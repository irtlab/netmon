"""
Module Name:
  discover_devices.py


Description:
  Module provides functionality to search (discover) devices in local network
  and store devices' data on the SQLite3 database.


Authors:
  Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.

"""


import gevent
import random
import time
import sys
import ipaddress
import re
import subprocess
import netifaces
import traceback
import threading

from scapy.all import srp, Ether, ARP
from datetime import datetime

import db
import utils



def search_network_devices(db_connection, net_interfaces):
  """
  Function searches devices in the given network and stores/updates devices'
  data on the SQLite3 database.

  Arguments:
  - db_connection: SQLite3 database connection.
  - net_interfaces: A list of network interfaces' data. Every single element of
    list is dictionary and format is {'ip': <ip addr>, 'iface': <iface name>}.
  """

  if not net_interfaces:
    utils.print_error('Please provide network interface(s)')
    sys.exit()

  if not db_connection:
    utils.print_error('SQLite3 database is not connected')
    sys.exit()


  try:
    utc_time_now = str(datetime.utcnow())
    print('[' + utc_time_now + '] ' + 'Start searching devices in local network .........')
    start = datetime.now()

    for iface_data in net_interfaces:
      iface_thr = threading.Thread(target = discover_devices, args = (db_connection, iface_data))
      iface_thr.start()

  except:
    utils.print_error('An exception occurred in discovering devices functionality')
    traceback.print_exc()





def discover_devices(db_connection, iface_data):
  """
  Arguments:
  - db_connection: SQLite3 database connection.
  - iface_data: A network interface data.
  """

  cfg = netifaces.ifaddresses(iface_data['iface'])[netifaces.AF_INET][0]
  my_ip = cfg['addr']
  subnet = ipaddress.IPv4Network('%s/%s' % (my_ip, cfg['netmask']), strict=False)

  if subnet.prefixlen >= 24 and subnet.prefixlen < 32:
    # Get a list of all IP addresses that belong to the IP subnet on
    # the interface, sans the IP address of our own network
    # interface.
    devices = [str(ip) for ip in subnet.hosts() if str(ip) != my_ip]
    search_devices(db_connection, devices, iface_data['iface'])

  else:
    utils.print_error('Error: currently system supports only /24 <= X < /32 IPv4 prefixes')





def search_devices(db_connection, ip_list, iface):
  """
  Function constructs full IPv4 address (x.x.x concatenates with last byte),
  searches devices in given IPv4 interval using gevent, which allows to makes
  non-blocking requests.

  Arguments:
  - db_connection: SQLite3 database connection.
  - reserved_ip_addresses: A list contains IPv4 addresses, which does not make
    sense to do request.
  - ip_list: A list of IPv4 addresses to be requested parallel (non-blocking)
  - iface: Network interface name.
  """

  threads = []
  for ip_addr in ip_list:
    ip_addr = str(ip_addr)
    threads.append(gevent.spawn(request, db_connection, iface, ip_addr))

  gevent.joinall(threads)





def request(db_connection, iface, ip_addr):
  """
  Function does ARP request for given IPv4 address, constructs device data
  (MAC, IPv4, network interface name and timestamp) based on ARP response and
  stores and/or updates on the database.

  Arguments:
  - db_connection: SQLite3 database connection.
  - iface: Network interface name.
  - ip_addr: IPv4 address.
  """

  hostname = ''

  while 1:
    try:
      result = arp_request(ip_addr, iface)
      if result:
        ip_addr = result[0]
        mac_addr = result[1]
        utc_time_now = utils.get_unix_epoch_milliseconds()
        # The idea is NOT to call get_device_hostname() function if we already
        # got hostname.
        if not hostname:
          hostname = get_device_hostname(mac_addr)

        data = {'mac': mac_addr, 'ip': ip_addr, 'hostname': hostname, 'iface': iface, 'last_update': utc_time_now}
        db.update_device_data(db_connection, data)
    except:
      pass


    # Just random sleep 2 seconds, plus random milliseconds in [2, 500] interval,
    # before starting next round.
    wait_millisecond = float(random.randint(2, 501)) / float(1000)
    wait_millisecond = float(2) + wait_millisecond
    time.sleep(wait_millisecond)





def arp_request(ip_addr, iface, timeout = 3):
  """
  Function does ARP request to check if given IPv4 is up or down.

  The fastest way to discover hosts on a local Ethernet network is to use
  the Scapy's ARP Ping method.

  Arguments:
  - ip_addr: An IPv4 address. If given argument is empty string or undefined
    it returns empty Tuple.
  - iface: Network interface name.
  - timeout: The timeout parameter of srp function specifies the time to wait
    after the last packet has been sent. If there is, no response a None value
    will be assigned instead when the timeout is reached.


  Returns Tuple (IPv4 address, MAC address) if IPv4 is up and response contains
  IPv4 and MAC, otherwise empty Tuple.
  """

  if not ip_addr:
    return tuple()

  # TODO We may need to implement our own ARP request instead of using Scapy.
  answered, unanswered = srp(Ether(dst = "ff:ff:ff:ff:ff:ff") / ARP(pdst = ip_addr), iface = iface, timeout = timeout, verbose = False)
  if answered:
    for send, receive in answered:
      mac_address = receive.sprintf(r"%Ether.src%")
      ip_address = receive.sprintf(r"%ARP.psrc%")
      if mac_address and ip_address:
        return (ip_address, mac_address)

  return tuple()





def get_device_hostname(dev_mac):
  """
  Function runs arp command, filters hostnames by MAC addresses, and returns
  hostname if it finds, otherwise returns an empty string.

  Arguments:
  - dev_mac: MAC address of device.
  """

  completed = subprocess.run("arp", shell = True, stdout = subprocess.PIPE)
  arp_table = (completed.stdout).splitlines()
  list_length = len(arp_table)

  # First element is just description.
  if list_length < 2:
    return;

  # Skip first line as it contains Address, HWtype, HWaddres, Flags Mask
  # and Iface.
  for i in range(1, list_length):
    arp_table[i] = arp_table[i].decode("utf-8")
    arp_table_dev_data = re.split(r'\s{2,}', arp_table[i])
    # Make sure that it was parsed correct. After parsing a list should contain
    # following data:
    # list = ['192.168.1.174', 'ether', 'b0:e1:7e:c2:8c:8f', 'C', 'enp0s3']
    # list[0] is Address
    # list[1] is HWtype
    # list[2] is HWaddres
    # list[3] is Flags
    # list[4] is Iface
    if arp_table_dev_data and len(arp_table_dev_data) == 5:
      if dev_mac == arp_table_dev_data[2]:
        return arp_table_dev_data[0]

  return ''

