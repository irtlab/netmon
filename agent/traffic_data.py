"""
Module Name:
  traffic_data.py


Description:
  Module provides functionality to provide network interfaces' data.


Authors:
  Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.

"""


import db
import utils
import time
import netifaces
import traceback
import iptc
from datetime import datetime


def process_network_traffic_data(db_connection):
  """
  Function gathers given network interfaces', devices bandwidth data, and stores
  on the database.

  Arguments:
  - db_connection: SQLite3 database connection.
  """

  net_ifaces = utils.get_interfaces()

  # Interval in seconds
  time_interval = 5
  prev_bytes = {}

  while 1:
    try:
      process_network_interfaces_data(db_connection, net_ifaces)
    except Exception:
      utils.print_error('Getting network interface data failed')
      traceback.print_exc()

    try:
      prev_bytes = get_devices_bandwidth(db_connection, prev_bytes, time_interval)
    except Exception:
      utils.print_error('Getting network bandwidth data failed')
      traceback.print_exc()

    # Sleep interval in seconds.
    time.sleep(time_interval)





def process_network_interfaces_data(db_connection, net_ifaces):
  """
  Function iterates over given network interfaces gets TX and RX for per-interface
  and stores on the database.

  Arguments:
  - db_connection: SQLite3 database connection.
  - net_ifaces: A list of network interfaces.
  """

  for iface in net_ifaces:
    addrs = netifaces.ifaddresses(iface)
    if (netifaces.AF_INET not in addrs) or (netifaces.AF_LINK not in addrs):
      continue

    # It is possible that network interface has two or more addresses.
    ip_list = []
    inet_data = addrs[netifaces.AF_INET]
    for inet in inet_data:
      ip_list.append(inet['addr'])

    # I do this, because on the database I cannot store as a list.
    ip_list = ','.join(ip_list)

    # In case get_iface_stats returns a empty dictionary that is okay.
    iface_data = utils.get_iface_stats(iface)
    iface_data['mac'] = addrs[netifaces.AF_LINK][0]['addr']
    iface_data['ip'] = ip_list
    iface_data['iface'] = iface
    iface_data['last_update'] = utils.get_unix_epoch_milliseconds()

    db.insert_iface_data(db_connection, iface_data)





def get_devices_bandwidth(db_connection, prev_bytes, time_interval):
  """
  Function parses iptables data using python-iptables library. It gathers bytes,
  source and destination IP address, calculates bandwidth data for every single
  IP address, and returns JSON object.

  Arguments:
  - db_connection: SQLite3 database connection.
  - prev_bytes: Previous gathered data in {<ip address>: <total bytes>} format
  - time_interval: Data gathering time interval.
  """

  # TODO function is not properly tested and it may need some modifications.

  db_data = {}
  query = db.query_from_table(db_connection, 'agent_devices', ['mac', 'ip'])
  for device_data in query:
    # Key is an IP and value is MAC. This is because iptables gives source IP
    # and by MAC to update database as MAC is primary key.
    key = device_data[1]
    db_data[key] = device_data[0]

  db_agent_data = {}
  query = db.query_from_table(db_connection, 'agent_data', ['mac', 'ip'])
  for agent_data in query:
    # Key is an IP and value is MAC. This is because iptables gives source IP
    # and by MAC to update database as MAC is primary key.
    key = agent_data[1]
    db_agent_data[key] = agent_data[0]


  table = iptc.Table(iptc.Table.FILTER)
  table.refresh()

  chain_forward = iptc.Chain(table, 'COUNTING')

  current_bytes = {}
  for rule in chain_forward.rules:
    (packets, bytes) = rule.get_counters()
    dst = (rule.dst).split('/')[0]
    src = (rule.src).split('/')[0]
    if bytes:
      total_bytes = 0
      if src != '0.0.0.0':
        total_bytes = total_bytes + bytes
        current_bytes[src] = total_bytes
      if dst != '0.0.0.0':
        total_bytes = total_bytes + bytes
        current_bytes[dst] = total_bytes


  current_bandwidth = {}
  for ip in current_bytes:
    # Otherwise I cannot calculate bandwidth.
    if ip in prev_bytes:
      current_bits = current_bytes[ip] * 8
      prev_bits = prev_bytes[ip] * 8
      current_bandwidth[ip] = round(abs(current_bits - prev_bits) / time_interval, 2)


  db_devices_bandwidth = {}
  db_agent_bandwidth = {}
  for ip in current_bandwidth:
    if ip in db_data:
      mac = db_data[ip]
      db_devices_bandwidth[mac] = current_bandwidth[ip]
    if ip in db_agent_data:
      mac = db_agent_data[ip]
      db_agent_bandwidth[mac] = current_bandwidth[ip]


  db.updated_devices_bandwidth(db_connection, db_devices_bandwidth, db_agent_bandwidth)

  return current_bytes

