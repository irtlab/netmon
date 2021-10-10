"""
Module name:
 socket_client.py

Description:
  TODO


Authors:
  Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.

"""

import db
import utils

import traceback
import asyncio
import pathlib
import ssl
import websockets
import json
import time
from datetime import datetime


# TODO If I decide to use manually generated certificate I should uncomment
# this, provide certificate file and change websockets.connect function's
# argument from ssl = True to ssl = ssl_context.
#ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
#ssl_context.load_verify_locations(pathlib.Path(__file__).with_name('cert.pem'))


# Global variable stores devices' timestamp in order to check if data is not
# updated then do not send device data to server.
devices_update_timestamp = {}


# Global variable stores network interfaces' timestamp in order to check if
# data is not updated then do not send device data to server.
iface_update_timestamp = {}





def run_websocket_client(db_connection, server_url, config):
  """
  Function runs websocket client as an async event. It runs always and if an exception occurs
  it tries to run again in 3 seconds.

  Arguments:
  - db_connection: sqlite3 database connection
  - server_url: Server's URL. It must be wss://<domain_name>:443/agent format.
  - config: Command line data
  """

  utc_time_now = str(datetime.utcnow())
  print('[' + utc_time_now + '] ' + 'Establishing websocket connection to %s, please wait ...' % server_url)
  while 1:
    try:
      loop = asyncio.new_event_loop()
      loop.run_until_complete(run_websocket(db_connection, server_url, config))
    except:
      traceback.print_exc()

    print('Trying to establish websocket connection again in {:1} seconds.'.format(3))
    time.sleep(3)





async def run_websocket(db_connection, server_url, config):
  """
  Function establishes connection with socket server, queries data (visible devices,
  open TCP & UDP ports and IP traffic) from database and sends to websocket server.

  Arguments:
  - db_connection: sqlite3 database connection
  - server_url: Server's URL. It must be wss://<domain_name>:443/agent format.
  - config: Command line data
  """


  #server_url = 'wss://pnode-server.phx1.phxnet.org:8000'

  kwargs = {}
  if server_url.lower().startswith('wss:'):
    ctx = ssl.create_default_context()
    kwargs['ssl'] = ctx

    if config.get('no_hostname_check', False):
      print('Disabling TLS certificate hostname validation as requested')
      ctx.check_hostname = False

  agent_data = db.get_agent_data(db_connection)
  agent_id = agent_data['id']

  async with websockets.connect(server_url, extra_headers = agent_data, **kwargs) as websocket:
    utc_time_now = str(datetime.utcnow())
    print('[' + utc_time_now + '] ' +  'Websocket client has connected successfully ......')

    while 1:
      data_types = ['devices_data', 'link_data', 'ids_data', 'iface_data']
      for data_type in data_types:
        query = db.query_data(db_connection, data_type)
        json_data = filter_query_data(query, data_type, agent_id)

        # TODO For now I send only agent's bandwidth, later, if it is needed in
        # backend side, this should be DB schema of the agent.
        if data_type == 'devices_data' and json_data:
          query = db.query_from_table(db_connection, 'agent_data', ['bandwidth'])
          for agent_data in query:
            json_data['agent_bandwidth'] = agent_data[0]

        if json_data:
          utc_time_now = str(datetime.utcnow())
          print('[' + utc_time_now + '] ' + 'Start sending ' + str(data_type) + ' data to server .....')

          # In case if connection is closed in client or server side then an exception raises
          # and run_websocket_client function runs again to establish a new connection.
          #
          # Note that, send() raises a ConnectionClosed exception when the client or server
          # disconnects, which breaks out of the while True loop.
          try:
            await websocket.send(json.dumps(json_data))
          except websockets.ConnectionClosed:
            print('Websocket disconnected')
            return

          utc_time_now = str(datetime.utcnow())
          print('[' + utc_time_now + '] ' + str(data_type) + ' data have been sent ..............')

          """
          print('Waiting for response ......................................................')
          try:
            recv_data = await websocket.recv()
          except websockets.ConnectionClosed:
            e = 'Websocket disconnects'
          print('Got response ..............................................................')
          """

      await asyncio.sleep(2)





def filter_query_data(query, data_type, agent_id):
  """
  Function checks timestamps of queried device data, TCP and UDP updates.
  If timestamps have not been changed then it does not store data to global
  variable filtered_data dictionary. The idea is not to send device data to
  server which has not been updated.

  Arguments:
  - query: Queried data from database table.
  - data_type: Shows type of data which will be filtered. See data_types list
    in run_websocket function for details.
  - agent_id: An ID (UUID) of Agent.

  Returns a dictionary of devices' data, which is ready to send to server.
  Dictionary format: {
                      'agent_id': <Unique ID (UUID) of agent>,
                      'msg_type': <Sending message type>,
                      'data': <Data to be sent>
                     }
  """

  if not query:
    return {}

  filtered_data = {}
  data = {}

  # Process link/route data.
  if data_type == 'link_data':
    filtered_data['agent_id'] = agent_id
    filtered_data['msg_type'] = data_type
    filtered_data['data'] = query
    return filtered_data


  # Process Intrusion Detection System (IDS) data.
  if data_type == 'ids_data':
    filtered_data['agent_id'] = agent_id
    filtered_data['msg_type'] = data_type
    filtered_data['data'] = query
    return filtered_data


  # Process devices data.
  if data_type == 'devices_data':
    filtered_data['agent_id'] = agent_id
    filtered_data['msg_type'] = data_type

    for key, value in query.items():
      if str(key) in devices_update_timestamp:
        ts_data = devices_update_timestamp[key]
        if (value['last_update'] != ts_data['device_ts'] or
            value['last_tcp_update'] != ts_data['tcp_ts'] or
            value['last_udp_update'] != ts_data['udp_ts']):

          data[str(key)] = value

          # Better to initialize all than compare one by one.
          ts_data['device_ts'] = value['last_update']
          ts_data['tcp_ts'] = value['last_tcp_update']
          ts_data['udp_ts'] = value['last_udp_update']
          devices_update_timestamp[key] = ts_data

      else:
        ts_data = {'device_ts': value['last_update'],
                   'tcp_ts': value['last_tcp_update'],
                   'udp_ts': value['last_udp_update']
                  }
        devices_update_timestamp[key] = ts_data
        data[str(key)] = value

    if data:
      filtered_data['data'] = data
      return filtered_data
    else:
      return {}


  # Process network interfaces data.
  if data_type == 'iface_data':
    # This is to check if data is updated on the database then send to user,
    # otherwise do not send.
    json_data = {}
    for key, value in query.items():
      iface = key
      last_update = value['last_update']
      if key in iface_update_timestamp:
        if iface_update_timestamp[key] != value['last_update']:
          iface_update_timestamp[key] = value['last_update']
          json_data[key] = value
      else:
        iface_update_timestamp[key] = value['last_update']
        json_data[key] = value

    if not json_data:
      return {}

    filtered_data['agent_id'] = agent_id
    filtered_data['msg_type'] = data_type
    filtered_data['data'] = json_data

    return filtered_data

