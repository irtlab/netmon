"""
Module Name:
  cli_parse.py


Description:
  Module provides functionality to parse command line arguments.


Authors:
  Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.

"""

import os
import sys
import json
import argparse

import utils



def ParseArguments():
  """
  Function parses command line arguments. Provided arguments are needed to
  setup Agent.

  Note that --db_file_path and --server_url can be set in config.json file.

  CL Arguments:
  --db_file_path: SQLite database file's absolute path. By default it is set
                  /var/local/monitoring_sqlite3.db.
  --server_url: Websocket Server's URL.
  --substation_name: (optional). If it is not provided then hostname will be set.
  --net_interfaces: List of network interfaces in string format.
    For example, --net_interfaces="eth1, eth2". By default it takes existing
    network interfaces.
  --no_hostname_check:
  --external_interval: (optional) Interval (s) between invocations of external
    commands. If Agent is not going to run external command then no need to
    provide this argument. By default it is set 3.
  --external_timeout: (optional) Maximum time (s) an external command is allowed
    to run. If Agent is not going to run external command then no need to provide
    this argument. By default it is set None.
  --external_command: Periodically invoke given command to gather external data.
    Use repeatedly.
  --uuid: (optional) If this is provided then as a unique ID of device will be UUID,
    otherwise value of SHA1(hostname).

  Returns:
    A dictionary that contains provided arguments.

  """


  parser = argparse.ArgumentParser()
  parser.add_argument("--db_file_path", required = False, help = "SQLite database filename", type = str, default = '')
  parser.add_argument("--server_url", required = False, help = "Server's domain name", type = str, default = '')
  parser.add_argument("--substation_name", required = False, help = "Substation name", type = str, default = '')
  parser.add_argument("--net_interfaces", required = False, help = "List of network interfaces", type = str)
  parser.add_argument("--no_hostname_check", required = False, help = "Disable TLS certificate hostname validation (insecure)", action = 'store_true')
  parser.add_argument("--external_interval", required = False, help = "Interval (s) between invocations of external commands", default = '3')
  parser.add_argument("--external_timeout", required = False, help = "Maximum time (s) an external command is allowed to run", default = None)
  parser.add_argument("--external_command", required = False, help = "Periodically invoke given command to gather external data. Use repeatedly.", action = 'append', default = [])
  parser.add_argument("--uuid", required = False, help = "To get UUID or hostname (set by default) as an unique ID.", action = 'store_true')

  argv = parser.parse_args(sys.argv[1:])

  config_data = {}
  try:
    if os.path.isfile('config.json'):
      json_data_file = open('config.json', 'r')
      config_data = json.load(json_data_file)
      required_keys = ['db_file_path', 'server_url']
      for key in required_keys:
        if key not in config_data:
          print('config.json file does not contain required key %s' % key)
          sys.exit()
    else:
      print('config.json does not exist in the current directory.')
      sys.exit()
  except IOError:
    sys.exit()

  config_data['no_hostname_check'] = argv.no_hostname_check or config_data.get('no_hostname_check', False)

  interval = float(argv.external_interval)

  if argv.external_timeout is None:
    timeout = interval
  else:
    timeout = float(argv.external_timeout)

  if timeout > interval:
    print('Error: External command timeout is longer than interval')
    sys.exit()

  config_data['external_interval'] = interval
  config_data['external_timeout'] = timeout
  config_data['external_command'] = argv.external_command
  config_data['substation_name'] = argv.substation_name
  config_data['uuid'] = argv.uuid

  if argv.db_file_path == '':
    if not config_data['db_file_path']:
      config_data['db_file_path'] = '/var/local/agent_sqlite3.db'
      print('SQLite3 database file is set by default: /var/local/agent_sqlite3.db')
  else:
    config_data['db_file_path'] = argv.db_file_path

  ifs = argv.net_interfaces or config_data.get('net_interfaces', [])
  if isinstance(ifs, str):
    ifs = ifs.split(',')
  config_data['net_interfaces'] = utils.interfaces_to_ip(ifs)

  # TODO verify provided URL
  if argv.server_url == '':
    if not config_data['server_url']:
      print('Please, provide server URL as an argument or in config.json file.')
      print('It must be in this format: wss://<domain_name>:443/agent')
      sys.exit()
  else:
    config_data['server_url'] = argv.server_url


  return config_data

