"""
Module Name:
  port_scanner.py


Description:
  Module provides functionality to scan TCP and UDP ports.


Authors:
  Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.

"""


import nmap
nmap_port_scan = nmap.PortScanner()
import time
import random

from scapy.all import sr, sr1, IP, TCP, UDP
from datetime import datetime

import db
import utils


def scan_ports(db_connection):
  """
  Function scans TCP/UDP ports and result stores on the SQLite3 database.

  Arguments:
  - db_connection: SQLite3 database connection.
  """

  while 1:
    try:
      utc_time_now = str(datetime.utcnow())
      print('[' + utc_time_now + '] ' + 'Start scanning TCP ports .........................')
      start = datetime.now()

      scan_tcp_ports(db_connection)

      end = datetime.now()
      time_diff = end - start
      utc_time_now = str(datetime.utcnow())
      print('[' + utc_time_now + '] ' + 'Finished scanning TCP ports, it took', time_diff)
    except:
      print('An exception occurred in scan_tcp_ports function')

    try:
      """
      utc_time_now = str(datetime.utcnow())
      print('[' + utc_time_now + '] ' + 'Start scanning UDP ports .........................')
      start = datetime.now()

      scan_udp_ports(db_connection)

      end = datetime.now()
      time_diff = end - start
      utc_time_now = str(datetime.utcnow())
      print('[' + utc_time_now + '] ' + 'Finished scanning UDP ports, it took', time_diff)
      """
    except:
      print('An exception occurred in scan_udp_ports function')

    # Just random sleep between 1 and 5 seconds before starting next round.
    random_seconds = random.randint(1, 6)
    time.sleep(random_seconds)





def scan_tcp_ports(db_connection):
  """
  Function scans TCP ports and result stores on the SQLite3 database.
  At first it queries devices data (MAC and IPv1 addresses) from database,
  particularly agent_devices table.

  Arguments:
  - db_connection: SQLite3 database connection.
  """

  # TODO I may use gevent for scanning TCP ports or nmap's PortScannerAsync().

  # TCP port range to be scanned.
  tcp_port_range = [1, 512]
  query = db.query_from_table(db_connection, 'agent_devices', ['mac', 'ip', 'last_update'])

  for device_data in query:
    last_update = device_data[2]
    utc_time_now_sec = utils.get_unix_epoch_milliseconds()
    # TODO
    # If device data updated ~8 minutes ago, then I should assume that
    # device is not visible.
    #if (utc_time_now_sec - last_update) >= 480:
    #  print('Do not scan TCP ports')

    device_ip = device_data[1]
    #open_tcp_ports = scapy_tcp_ping(device_ip, tcp_port_range)
    open_tcp_ports = scan_tcp_range(device_ip, tcp_port_range)
    if open_tcp_ports:
      device_mac = device_data[0]
      db.insert_port_data(db_connection, device_mac, device_ip, open_tcp_ports, 'tcp')

    # Just random sleep between 2 and 100 milliseconds before scanning next device.
    wait_millisecond = float(random.randint(2, 101)) / float(1000)
    time.sleep(wait_millisecond)





def scan_udp_ports(db_connection):
  """
  Function scans UDP ports and result stores on the SQLite3 database.
  At first it queries devices data (MAC and IPv1 addresses) from database,
  particularly agent_devices table.

  Arguments:
  - db_connection: SQLite3 database connection.
  """

  # TODO I may use gevent for scanning UDP ports or nmap's PortScannerAsync().

  # UDP port range to be scanned.
  udp_port_range = [1, 8]
  query = db.query_from_table(db_connection, 'agent_devices', ['mac', 'ip', 'last_update'])

  for device_data in query:
    last_update = device_data[2]
    utc_time_now_sec = utils.get_unix_epoch_milliseconds()
    # TODO
    # If device data updated ~8 minutes ago, then I should assume that
    # device is not visible.
    #if (utc_time_now_sec - last_update) >= 480:
    #  print('Do not scan UDP ports')

    device_ip = device_data[1]
    #open_udp_ports = scapy_udp_ping(device_ip, udp_port_range)
    open_udp_ports = scan_udp_range(device_ip, udp_port_range)
    if open_udp_ports:
      device_mac = device_data[0]
      db.insert_port_data(db_connection, device_mac, device_ip, open_udp_ports, 'udp')

    # Just random sleep between 2 and 100 milliseconds before scanning next device.
    wait_millisecond = float(random.randint(2, 101)) / float(1000)
    time.sleep(wait_millisecond)





def scan_tcp_range(device_ip, tcp_port_range):
  """
  Function scans TCP ports using nmap (python-nmap) library.

  Arguments:
  - device_ip: An IPv4 address of device.
  - tcp_port_range: TCP port range to be scanned. It must contain two elements.
    Firts element should be min range and second element max range.
    For example, tcp_port_range = [21, 443], then it will scan all ports from 21 to 443.

  Returns a list of open TCP port numbers. If there is not an open TCP port it
  will return an empty list.
  """

  open_tcp_ports = []
  port_range = str(tcp_port_range[0]) + '-' + str(tcp_port_range[1])

  nmap_port_scan.scan(device_ip, port_range)
  if nmap_port_scan.has_host(device_ip) and 'tcp' in nmap_port_scan[device_ip]:
    tcp_data = nmap_port_scan[device_ip]['tcp']
    for port_number in tcp_data:
      if 'state' in tcp_data[port_number] and tcp_data[port_number]['state'] == 'open':
        open_tcp_ports.append(port_number)


  return open_tcp_ports





def scan_udp_range(device_ip, udp_port_range):
  """
  Function scans UDP ports using nmap (python-nmap) library.
  Note that UDP scanning is generally slower and more difficult than TCP.

  Arguments:
  - device_ip: An IPv4 address of device.
  - udp_port_range: UDP port range to be scanned. It must contain two elements.
    Firts element should be min range and second element max range.
    For example, udp_port_range = [21, 443], then it will scan all ports from 21 to 443.

  Returns a list of open UDP port numbers. If there is not an open UDP port it
  will return an empty list.
  """

  open_udp_ports = []
  port_range = str(udp_port_range[0]) + '-' + str(udp_port_range[1])

  nmap_port_scan.scan(device_ip, port_range, '-sU')
  if nmap_port_scan.has_host(device_ip) and 'udp' in nmap_port_scan[device_ip]:
    udp_data = nmap_port_scan[device_ip]['udp']
    for port_number in udp_data:
      if 'state' in udp_data[port_number] and udp_data[port_number]['state'] == 'open':
        open_udp_ports.append(port_number)


  return open_udp_ports





def scapy_tcp_ping(device_ip, port_range):
  """
  Function checks if given TCP ports are open or close.

  Arguments:
  - device_ip: An IPv4 address of device.
  - port_range: A list of port numbers to be checked.

  Returns a list of open TCP port numbers.
  """

  open_tcp_ports = []
  for destination_port in port_range:
    source_port = random.choice(port_range)

    response = sr1(IP(dst = device_ip) / TCP(sport = source_port, dport = destination_port, flags = "S"), timeout = 3, verbose = 0)
    if response is None:
      continue

    elif (response.haslayer(TCP)):
      # 0x12 - SYN-ACK. For details about TCP flags see:
      # https://www.keycdn.com/support/tcp-flags/
      if (response.getlayer(TCP).flags == 0x12):
        # Send a gratuitous RST to close the connection. For details check out
        # TCP stealth scan technique.
        open_tcp_ports.append(str(destination_port))
        send_rst = sr(IP(dst = device_ip) / TCP(sport = source_port, dport = destination_port, flags = 'R'), timeout = 0, verbose = 0)
      # 0x14 - RST-ACK. Port is closed.
      elif (response.getlayer(TCP).flags == 0x14):
        str_ = 'TCP port ' + str(destination_port) + ' is closed.'

  return open_tcp_ports





def scapy_udp_ping(device_ip, port_range):
  """
  Function checks if given UDP ports are open or close.

  Arguments:
  - device_ip: An IPv4 address of device.
  - port_range: A list of port numbers to be checked.

  Returns a list of open UDP port numbers.
  """

  open_udp_ports = []
  for destination_port in port_range:
    source_port = random.choice(port_range)

    response = sr1(IP(dst = device_ip) / UDP(dport = destination_port), timeout = 5, verbose = 0)
    if response is None:
      continue
    elif (response.haslayer(UDP)):
      open_udp_ports.append(destination_port)

  return open_udp_ports

