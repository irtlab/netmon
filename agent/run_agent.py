#!/usr/bin/env python3

"""
Module name:
 run_agent.py


Authors:
  Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.

"""


#import resource
#resource.setrlimit(resource.RLIMIT_NOFILE, (16384, 16384))

import gevent.monkey
gevent.monkey.patch_all()
import gevent
import asyncio
import threading
from datetime import datetime

import discover_devices as dd
import traffic_data as iface_data
import port_scanner
import db
import cli_parse
import ip_traffic
import socket_client
import utils
import external


def main():

  config_data = cli_parse.ParseArguments()

  server_url = config_data['server_url']
  db_connection = db.init_database(config_data['db_file_path'])
  net_interfaces = config_data['net_interfaces']

  external_interval = config_data['external_interval']
  external_timeout = config_data['external_timeout']
  external_commands = config_data['external_command']

  # This must be called after cli_parse.ParseArguments function and before
  # any other functions, because it sets agent data and stores on the DB.
  agent_data = utils.setup_agent(db_connection, config_data)

  if len(net_interfaces):
    print("Running device and port scanners on interfaces %s" % [i['iface'] for i in net_interfaces])
    device_scan = threading.Thread(target = dd.search_network_devices, args = (db_connection, net_interfaces,))
    device_scan.start()

    #port_scan = threading.Thread(target = port_scanner.scan_ports, args = (db_connection,))
    #port_scan.start()
  else:
    print("No network interfaces, disabling device and port scanners")


  external_cmd_threads = []
  if len(external_commands):
    for cmd in external_commands:
      print('Periodically invoking external command "%s"' % cmd)
      t = threading.Thread(target = external.process_external_data, args = (db_connection, cmd, external_interval, external_timeout))
      external_cmd_threads.append(t)
      t.start()


  net_iface_thr = threading.Thread(target = iface_data.process_network_traffic_data, args = (db_connection,))
  net_iface_thr.start()


  socket_client.run_websocket_client(db_connection, server_url, config_data)


  #utc_time_now = str(datetime.utcnow())
  #print('[' + utc_time_now + '] ' + 'Start monitoring IP traffic ......................')
  #ip_traffic_thr = threading.Thread(target = ip_traffic.run_ip_traffic_monitor, args = (db_connection, net_interfaces, agent_id, agent_ip,))
  #ip_traffic_thr.start()




if __name__ == '__main__':
    main()

