"""
Module name:
  utils.py


Authors:
  Columbia University, the Internet Real-Time Laboratory (IRT Lab). 2018-2019.


Description:
  Module provides utility functions.
"""


import db
import sqlite3
import sys
import netifaces
import ifaddr
import uuid
import json
import socket
import hashlib
import traceback
from datetime import datetime



def get_unix_epoch_milliseconds():
  """
  Function returns Unix Epoch time in milliseconds.
  """
  return int(float(datetime.utcnow().timestamp()) * 1000)




def get_mac():
  """
  Function returns MAC address of current device as a string.
  """

  mac_num = hex(uuid.getnode()).replace('0x', '').lower()
  mac = ':'.join(mac_num[i: i + 2] for i in range(0, 11, 2))

  return str(mac)





def get_ip():
  """
  Function returns IP address of current device as a string.
  """

  try:
    hostname = socket.gethostname()
    ip_addr = socket.gethostbyname(hostname)
  except:
    traceback.print_exc()

  return ip_addr





def get_hostname(ip_addr):
  """
  Function returns hostname of current device as a string.

  Arguments:
  - ip_addr: An IPv4 address.
  """

  try:
    # Return a triple (hostname, aliaslist, ipaddrlist) where hostname is the
    # primary host name responding to the given IP address.
    hostname = socket.gethostbyaddr(ip_addr)
  except:
    traceback.print_exc()

  return hostname[0]





def setup_agent(db_connection, config_data):
  """
  Function checks if current devices is registered or not. If it is registered,
  then it returns an unique ID of device, otherwise generates a new unique ID
  (ID is hexadecimal value of SHA1(hostname)),
  stores in the database and returns it.
  Database is SQLite3 and table name is device_id.

  Arguments:
  - db_connection: sqlite3 database connection.
  - config_data: Command line argument, which contains network interfaces, substation
    name and UUID. if config_data['uuid'] it is None then set SHA1(hostname) as
    an ID, otherwise set UUID (uuid4).
  """

  agent_data = db.get_agent_data(db_connection)
  if agent_data:
    return agent_data
  else:
    net_interfaces = config_data['net_interfaces']
    substation_name = config_data['substation_name']
    provided_id = config_data['uuid']

    mac = get_mac()
    ip = get_ip()
    hostname = get_hostname(ip)

    # Get interfaces and IP addresses.
    ifaces = {}
    for interface in net_interfaces:
      iface_name = interface['iface']
      ifaces[str(iface_name)] = interface['ip']
    ifaces = json.dumps(ifaces)

    dev_id = str(uuid.uuid4())
    if provided_id is False:
      hash_value = hashlib.sha1(str(hostname).encode())
      dev_id = hash_value.hexdigest()
    utc_time_now = get_unix_epoch_milliseconds()
    try:
      db_connection.execute("""
      INSERT INTO agent_data (id, mac, ip, hostname, substation_name, ifaces, bandwidth, last_update, registration_ts)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""", (dev_id, mac, ip, hostname, substation_name, ifaces, 0, utc_time_now, utc_time_now))

      db_connection.commit()

    except sqlite3.OperationalError:
      traceback.print_exc()
      sys.exit()

    agent_data = db.get_agent_data(db_connection)
    return agent_data





def interfaces_to_ip(interfaces_list):
  """
  Function gets IP addresses of given network interfaces. Note that network
  interfaces are provided by name. For example, if network interface name is
  ['enp0s3'] then it returns [{'ip': 190.168.0.1/24, 'iface': 'enp0s3'}].

  Arguments:
  - interfaces_list: A list of network interfaces.
  """

  if len(interfaces_list) <= 0:
    return []

  net_interfaces = []
  for interface in interfaces_list:
    try:
      # Remove all white spaces in a string
      interface = interface.strip()
      addrs = netifaces.ifaddresses(interface)
      addrs = addrs[netifaces.AF_INET]
      for net_interface in addrs:
        if 'addr' in net_interface:
          net_interface_ip = net_interface['addr']
          # Skip localhost
          if net_interface_ip == '127.0.0.1':
            continue

          # Some of the interfaces may be point-to-point, e.g., with a /32 netmask.
          if 'peer' in net_interface:
            print('Point-to-point network interface detected:', interface)
            return []

          net_interface_ip = getNetworkPrefixOfIP(net_interface_ip)
          if net_interface_ip == '0':
            print('Unable to detect network prefix of ', interface)
            return []

          parts = net_interface_ip.split('/')
          if len(parts) >= 2:
            if parts[1] == '32':
              print('Point-to-point network interface detected:', interface)
              return []

          net_interfaces.append({'ip': net_interface_ip, 'iface': interface})
    except:
      print('{} is not valid network interface name.'.format(interface))
      print('ValueError: You must specify a valid interface name.')
      traceback.print_exc()
      return []


  return net_interfaces





def getNetworkPrefixOfIP(net_interface_ip):
  """
  Function finds network prefix of given IP and returns it in
  <IP>/<network prefix> format. If there is not network prefix it returns '0'.
  For example, if IP address is 192.168.0.1 and network prefix is 24, then it
  returns 192.168.0.1/24

  Arguments:
  - net_interface_ip: An IP address
  """
  adapters = ifaddr.get_adapters()
  for adapter in adapters:
    for ip in adapter.ips:
      if net_interface_ip == ip.ip:
        return str(ip.ip) + '/' + str(ip.network_prefix)

  return '0'





def get_iface_stats(iface):
  """
  Function reads RX and TX data (statistics) from system files for given network
  interface and returns as a dictionary.

  Note that this works only for unix based systems.

  Arguments:
  - iface: Network interface name.

  Returns a dictionary and format is
       {
        'tx_bytes': <number>,
        'tx_packets': <number>,
        'tx_dropped': <number>,
        'rx_bytes': <number>,
        'rx_packets': <number>,
        'rx_dropped': <number>
       }

  If an eception occurred, then function returns an empty dictionary.
  """

  base_path = '/sys/class/net/' + str(iface) + '/statistics/'
  iface_statistics = {}

  try:
    # RX statistics.
    rx_bytes_file = base_path + 'rx_bytes'
    with open(rx_bytes_file, 'r') as file_:
      iface_statistics['rx_bytes'] = int(file_.read())

    rx_packets_file = base_path + 'rx_packets'
    with open(rx_packets_file, 'r') as file_:
      iface_statistics['rx_packets'] = int(file_.read())

    rx_dropped_file = base_path + 'rx_dropped'
    with open(rx_dropped_file, 'r') as file_:
      iface_statistics['rx_dropped'] = int(file_.read())


    # TX statistics.
    tx_bytes_file = base_path + 'tx_bytes'
    with open(tx_bytes_file, 'r') as file_:
      iface_statistics['tx_bytes'] = int(file_.read())

    tx_packets_file = base_path + 'tx_packets'
    with open(tx_packets_file, 'r') as file_:
      iface_statistics['tx_packets'] = int(file_.read())

    tx_dropped_file = base_path + 'tx_dropped'
    with open(tx_dropped_file, 'r') as file_:
      iface_statistics['tx_dropped'] = int(file_.read())

  except:
    traceback.print_exc()
    return {}

  return iface_statistics





def get_interfaces():
  """
  Function returns all, besides local, network interfaces of th current device.
  """

  try:
    net_ifaces = netifaces.interfaces()
    net_ifaces.remove('lo')
  except:
    traceback.print_exc()

  return net_ifaces





def print_error(error_message, db_message = ''):
  utc_time_now = str(datetime.utcnow())
  print('[' + utc_time_now + '] ' + error_message, db_message)





def print_log(message, full_message = 1, print_data = 0):
  """
  Function writes log message to file or prints it.

  Arguments:
  - message: A message, string type, to write to file.
  - full_message: If full_message is set 1, then write message to file as it is,
    otherwise construct message structure including timestamp then write to file.
    By default it is set 1.
  - print_data: If it is set 1 then print data instead of writing to file.
    By default it is set 0.
  """
  print('This is for printing log data in specific format. This is in TODO list')
  return
  """
  if full_message == 1 and print_data == 0:
    # Write data to file.
  elif full_message == 1 and print_data == 1:
    # Print data.
  elif full_message == 0 and print_data == 0:
    # Construct message and write to file.
    utc_time_now = str(datetime.utcnow())
  elif full_message == 0 and print_data == 1:
    # Construct message and print data.
    utc_time_now = str(datetime.utcnow())
  """

