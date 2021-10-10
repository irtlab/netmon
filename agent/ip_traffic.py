"""
Module Name:
  ip_traffic.py


Description:
  Module provides functionality to monitor IP traffic.


Authors:
  Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.

"""


import random

import db
import utils
from scapy.all import sniff
from datetime import datetime



def run_ip_traffic_monitor(db_connection, net_interfaces, device_id, agent_ip):
  """
  Function monitors IP traffic in real time using Scapy's sniff function.
  If an exception occurres it will run again in 5 seconds.

  Arguments:
  - db_connection: sqlite3 database connection.
  - net_interfaces: A list of provided network interfaces.
  - device_id: An ID (UUID) of current device.
  - agent_ip: An IPv4 address of agent.
  """

  while 1:
    try:
      arp_traffic_out = sniff(prn = ip_monitoring_callback(db_connection, net_interfaces, device_id, agent_ip), filter = "ip", store = 0);
    except:
      utc_time_now = str(datetime.utcnow())
      print('[' + utc_time_now + '] ' + 'An exception in ip_monitoring_callback function')

    # Just random sleep between 1 and 5 seconds before starting next round.
    # This will happen if an exception occurs in ip_monitoring_callback.
    random_seconds = random.randint(1, 6)
    time.sleep(random_seconds)





def ip_monitoring_callback(db_connection, net_interfaces, device_id, host_ip):
  """
  Function monitors IP traffic in real time using Scapy's sniff function and
  result stores in the sqlite3 database.

  Arguments:
  - db_connection: sqlite3 database connection
  - net_interfaces: A list of provided network interfaces
  - device_id: An ID (UUID) of current device
  - host_ip: An IP address of current device
  """

  # For example, if 10.2.x.x talks to 10.1.x.x that is fine.
  subnet_ip_list = []
  for data in net_interfaces:
    local_ip = data['ip']
    local_ip = local_ip.split('.')
    subnet_ip_list.append(str(local_ip[0]))

  host_parts = host_ip.split('.')
  host_parts = str(host_parts[0]) + '.' + str(host_parts[1])
  subnet_ip_list.append(host_parts)

  """
  Note that if I want to pass parameters into the sniff's custom_action function for
  additional control or the ability to modularize out the custom_action function,
  I have to use a nested function.
  """
  def upload_packet(packet):
    utc_time_now = utils.get_unix_epoch_milliseconds()

    if (packet and packet[0][1].src and packet[0][1].dst and
        str(packet[0][1].dst) != '255.255.255.255' and str(packet[0][1].src) != '255.255.255.255'):

      source_ip = packet[0][1].src
      destination_ip = packet[0][1].dst

      # Skip localhost and multicast DNS
      if (source_ip != '127.0.0.1' and destination_ip != '127.0.0.1' and
          source_ip != '239.255.255.250' and destination_ip != '239.255.255.250' and
          source_ip != '224.0.0.251' and destination_ip != '224.0.0.251'):

        src_parts = source_ip.split('.')
        src_parts = str(src_parts[0])
        dst_parts = destination_ip.split('.')
        dst_parts = str(dst_parts[0])

        if (src_parts in subnet_ip_list) and (dst_parts in subnet_ip_list):
          event = 'IP traffic is inside of local network'
          # Not sure if it makes sense to store this data on the database.
          #ip_traffic_data = {'ts': utc_time_now, 'src': source_ip, 'dst': destination_ip, 'not_local_ip': ''}
        else:
          not_local_ip = source_ip
          if src_parts in subnet_ip_list:
            not_local_ip = destination_ip

          ip_traffic_data = {'ts': utc_time_now, 'src': source_ip, 'dst': destination_ip, 'not_local_ip': not_local_ip}
          db.insert_ip_traffic_data(db_connection, ip_traffic_data)


  return upload_packet

