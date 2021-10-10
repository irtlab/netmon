"""
Module Name:
  db.py


Description:
  Module provides functionality to modify (create tables, query, insert and
  update tables) database.


Authors:
  Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.

"""


import sqlite3
import utils



def init_database(db_filename = "/var/local/monitoring_sqlite3.db"):
  """
  Function establishes connection with sqlite3 database and creates
  agent_devices, ip_traffic_data, agent_iface_stats, node_log and node_id
  tables if one of them does not exist.

  Arguments:
  - db_filename: SQLite database file's absolute path. By default it is set
                 /var/local/monitoring_sqlite3.db

  Returns sqlite3 database connection if connection established and tables are
  created if they do not exist. Raises an exception if there is an operational
  error.
  """

  try:
    connection = sqlite3.connect(db_filename)

    # Cleanup database.
    cleanup_db(connection)

    connection.execute("""
    CREATE TABLE IF NOT EXISTS agent_devices (
        mac             TEXT PRIMARY KEY,
        ip              TEXT,
        hostname        TEXT,
        iface           TEXT,
        bandwidth       REAL,
        last_update     REAL,
        registration_ts REAL,
        open_tcp_ports  TEXT,
        last_tcp_update REAL,
        open_udp_ports  TEXT,
        last_udp_update REAL
    )
    """)


    connection.execute("""
    CREATE TABLE IF NOT EXISTS ip_traffic_data (
        source_ip      TEXT,
        destination_ip TEXT,
        not_local_ip   TEXT,
        last_update    REAL
    )
    """)

    connection.execute("""
    CREATE TABLE IF NOT EXISTS net_interface_data (
        iface       TEXT PRIMARY KEY,
        mac         TEXT,
        ip          TEXT,
        tx_bytes    INTEGER,
        tx_packets  INTEGER,
        tx_dropped  INTEGER,
        rx_bytes    INTEGER,
        rx_packets  INTEGER,
        rx_dropped  INTEGER,
        last_update REAL
    )
    """)

    connection.execute("""
    CREATE TABLE IF NOT EXISTS node_log (
        year   INTEGER,
        month  INTEGER,
        day    INTEGER,
        hour   INTEGER,
        minute INTEGER,
        second INTEGER,
        data TEXT
    )
    """)


    connection.execute("""
    CREATE TABLE IF NOT EXISTS link_data (
        status     TEXT,
        src_ip     TEXT,
        src_mac    TEXT,
        dst_ip     TEXT,
        dst_mac    TEXT,
        timestamp  TEXT,
        attributes TEXT
    )
    """)


    connection.execute("""
    CREATE TABLE IF NOT EXISTS ids_data (
        ip            TEXT,
        blocked       INTEGER,
        blocked_on    INTEGER,
        danger_level  INTEGER,
        attributes    TEXT,
        last_update   REAL
    )
    """)


    connection.execute("""
    CREATE TABLE IF NOT EXISTS agent_data (
        id              TEXT PRIMARY KEY,
        mac             TEXT,
        ip              TEXT,
        hostname        TEXT,
        substation_name TEXT,
        ifaces          TEXT,
        bandwidth       REAL,
        last_update     REAL,
        registration_ts REAL
    )
    """)

  except sqlite3.OperationalError:
    raise Exception(sqlite3.OperationalError, "Unable to connect Sqlite3 database.")

  return connection





def get_agent_data(db_connection):
  """
  Function queries data from the database, particularly from agent_data table.

  Arguments:
  - db_connection: sqlite3 database connection

  Returns a dictionary of queried data.
  """

  data = {}

  try:
    query = query_from_table(db_connection, 'agent_data')
  except sqlite3.OperationalError:
    print(sqlite3.OperationalError, 'QueryData: statement failed with Operational error')
    return data


  # Database schema. If I change database schema I must modify here.

  # [0] id               TEXT PRIMARY KEY,
  # [1] mac              TEXT,
  # [2] ip               TEXT,
  # [3] hostname         TEXT,
  # [4] substation_name  TEXT,
  # [5] ifaces           TEXT,
  # [6] bandwidth        REAL,
  # [7] last_update      REAL,
  # [8] registration_ts  REAL

  for row in query:
   data = {'id': row[0],
           'mac': row[1],
           'ip': row[2],
           'hostname': row[3],
           'substation_name': row[4],
           'ifaces': row[5],
           'bandwidth': row[6],
           'last_update': row[7],
           'registration_ts': row[8]
          }

  return data





def update_device_data(db_connection, data):
  """
  Function stores or updates visible (discovered) devices data into the database,
  particularly in the agent_devices table.

  Arguments:
  - db_connection: sqlite3 database connection.
  - data: Data is a dictionary and format is
    {'mac': <MAC>, 'ip': <IP>, hostname: <hostname>, 'iface': <iface name>, 'last_update': <unix epoch time>}
  """

  cursor = db_connection.cursor()

  try:
    cursor.execute("""
      UPDATE agent_devices
      SET
        ip = ?,
        iface = ?,
        hostname = ?,
        last_update = ?
      WHERE mac = ?
      """, (data['ip'], data['iface'], data['hostname'], data['last_update'], data['mac']))

    if cursor.rowcount < 1:
      registration_ts = utils.get_unix_epoch_milliseconds()
      db_connection.execute("""
        INSERT INTO agent_devices
          (mac, ip, hostname, iface, last_update, registration_ts)
        VALUES
          (?, ?, ?, ?, ?, ?)
        """, (data['mac'], data['ip'], data['hostname'], data['iface'], data['last_update'], registration_ts))


    db_connection.commit()

  except sqlite3.OperationalError:
    print(sqlite3.OperationalError, 'INSERT failed with Operational error')





def updated_devices_bandwidth(db_connection, bandwidth, agent_bandwidth):
  """
  Function stores or updates visible (discovered) devices and agent bandwidth data
  into the database, particularly in the agent_devices and agent_data table.

  Arguments:
  - db_connection: sqlite3 database connection.
  - bandwidth: Data is a dictionary and format is {'mac': <bandwidth value in bits/sec>}
  - agent_bandwidth: Agent's bandwidth data and format is the same as bandwidth argument.
  """

  for key, value in agent_bandwidth.items():
    try:
      db_connection.execute("""
        UPDATE agent_data
        SET
          bandwidth = ?
        WHERE mac = ?
        """, (value, key))

      db_connection.commit()

    except sqlite3.OperationalError:
      print(sqlite3.OperationalError, 'INSERT statement failed with Operational error')


  for key, value in bandwidth.items():
    try:
      db_connection.execute("""
        UPDATE agent_devices
        SET
          bandwidth = ?
        WHERE mac = ?
        """, (value, key))

      db_connection.commit()

    except sqlite3.OperationalError:
      print(sqlite3.OperationalError, 'INSERT statement failed with Operational error')





def insert_port_data(db_connection, device_mac, device_ip, open_ports, port_type):
  """
  Function stores TCP/UDP open ports into the database, particularly in the
  agent_devices table.

  Arguments:
  - db_connection: sqlite3 database connection.
  - device_mac: MAC address of device.
  - device_ip: An IPv4 address of scanning device.
  - open_ports: A list of open port numbers.
  - port_type: It must be 'tcp' or 'udp'.
  """

  utc_time_now = utils.get_unix_epoch_milliseconds()
  open_ports_str = ','.join(str(i) for i in open_ports)

  if port_type == 'tcp':
    try:
      db_connection.execute("""
        UPDATE agent_devices
        SET
          open_tcp_ports = ?,
          last_tcp_update = ?
        WHERE mac = ? AND ip = ?
        """, (open_ports_str, utc_time_now, device_mac, device_ip))

      db_connection.commit()

    except sqlite3.OperationalError:
      print(sqlite3.OperationalError, 'UPDATE failed with Operational error')

  elif port_type == 'udp':
    try:
      db_connection.execute("""
        UPDATE agent_devices
        SET
          open_udp_ports = ?,
          last_udp_update = ?
        WHERE mac = ? AND ip = ?
        """, (open_ports_str, utc_time_now, device_mac, device_ip))

      db_connection.commit()

    except sqlite3.OperationalError:
      print(sqlite3.OperationalError, 'UPDATE failed with Operational error')





def insert_ip_traffic_data(db_connection, data):
  """
  Function stores IP traffic data on the database, particularly in the
  ip_traffic_data table.

  Arguments:
  - db_connection: sqlite3 database connection.
  - data: A dictionary which contains soure IP, destination IP, an IP address,
    which is not local ( if traffic is going to or coming from outside) and timestamp.
  """

  try:
    db_connection.execute("""
      INSERT INTO ip_traffic_data
        (source_ip, destination_ip, not_local_ip, last_update)
      VALUES
        (?, ?, ?, ?)
      """, (data['src'], data['dst'], data['not_local_ip'], data['ts']))

    db_connection.commit()

  except sqlite3.OperationalError:
    print(sqlite3.OperationalError, 'INSERT statement failed with Operational error')





def insert_iface_data(db_connection, iface_data):
  """
  Function stores network interface's statistics data into the database,
  particularly in the net_interface_data table.

  Arguments:
  - db_connection: sqlite3 database connection.
  - iface_data: A dictionary, which contains network interface data.
  """

  cursor = db_connection.cursor()

  try:
    cursor.execute("""
      UPDATE net_interface_data
      SET
        mac = ?,
        ip = ?,
        tx_bytes = ?,
        tx_packets = ?,
        tx_dropped = ?,
        rx_bytes = ?,
        rx_packets = ?,
        rx_dropped = ?,
        last_update = ?
      WHERE iface = ?
      """, (iface_data['mac'], iface_data['ip'], iface_data['tx_bytes'],
            iface_data['tx_packets'], iface_data['tx_dropped'], iface_data['rx_bytes'] ,
            iface_data['rx_packets'], iface_data['rx_dropped'], iface_data['last_update'], iface_data['iface']))


    if cursor.rowcount < 1:
      db_connection.execute("""
        INSERT INTO net_interface_data
          (iface, mac, ip, tx_bytes, tx_packets, tx_dropped, rx_bytes, rx_packets, rx_dropped, last_update)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (iface_data['iface'], iface_data['mac'], iface_data['ip'], iface_data['tx_bytes'],
              iface_data['tx_packets'], iface_data['tx_dropped'], iface_data['rx_bytes'] ,
              iface_data['rx_packets'], iface_data['rx_dropped'], iface_data['last_update']))


    db_connection.commit()

  except sqlite3.OperationalError:
    print(sqlite3.OperationalError, 'INSERT statement failed with Operational error')





def query_from_table(db_connection, table_name, columns = '*'):
  """
  Function queries data from table.

  Arguments:
  - db_connection: sqlite3 database connection.
  - table_name: Database table name.
  - columns: A list of columns, which should be queried. By default it is set
    '*' and will query all data.
  """

  if columns != '*':
    columns = ', '.join(columns)

  cursor = db_connection.cursor()
  query = []
  try:
    query_str = 'SELECT ' + columns + ' FROM ' + table_name
    cursor.execute(query_str)
    query = cursor.fetchall()
  except sqlite3.OperationalError:
    print(sqlite3.OperationalError, 'Query: statement failed with Operational error')

  return query





def insert_devices_hostname(db_connection, hostnames):
  """
  Function stores data into the database, particularly in the node_log table.

  Arguments:
  - db_connection: sqlite3 database connection
  - hostnames: Dictionary which contains MAC address as a key and hostname
    as a value.
  """

  for key, value in hostnames.items():
    if value:
      try:
        db_connection.execute("""
          UPDATE agent_devices
          SET
            hostname = ?
          WHERE mac = ?
          """, (value, key))

        db_connection.commit()

      except sqlite3.OperationalError:
        print(sqlite3.OperationalError, 'INSERT statement failed with Operational error')





def query_data(db_connection, data_type):
  """
  Function queries data from the database, particularly from the agent_devices
  and ip_traffic_data tables and returns a dictionary of queried data.

  Arguments:
  - db_connection: sqlite3 database connection
  - data_type: Type of data, which will be queried. It must be 'devices_data',
    'ip_traffic', 'iface_data' or 'ids_data'.
  """

  if data_type == 'devices_data':
    return get_devices_data(db_connection)

  if data_type == 'link_data':
    return get_link_data(db_connection)

  if data_type == 'ids_data':
    return get_ids_data(db_connection)

  if data_type == 'iface_data':
    return get_iface_data(db_connection)

  if data_type == 'ip_traffic':
    return get_ip_traffic_data(db_connection)





def get_devices_data(db_connection):
  """
  Function queries data from the database, particularly from agent_devices table.

  Arguments:
  - db_connection: sqlite3 database connection

  Returns a dictionary of queried data.
  """

  ret_json = {}

  try:
    query = query_from_table(db_connection, 'agent_devices')

  except sqlite3.OperationalError:
    print(sqlite3.OperationalError, 'QueryData: statement failed with Operational error')
    return ret_json


  # Database schema. If I change database schema I must modify here.

  # [0] mac              TEXT PRIMARY KEY,
  # [1] ip               TEXT,
  # [2] hostname         TEXT,
  # [3] iface            TEXT,
  # [4] bandwidth        REAL,
  # [5] last_update      REAL,
  # [6] registration_ts  REAL,
  # [7] open_tcp_ports   TEXT,
  # [8] last_tcp_update  REAL,
  # [9] open_udp_ports   TEXT,
  # [10] last_udp_update REAL

  for row in query:
   mac = row[0]
   data = {'mac': row[0],
           'ip': row[1],
           'hostname': row[2],
           'iface': row[3],
           'bandwidth': row[4],
           'last_update': row[5],
           'registration_ts': row[6],
           'open_tcp_ports': row[7],
           'last_tcp_update': row[8],
           'open_udp_ports': row[9],
           'last_udp_update': row[10]
          }

   ret_json[str(mac)] = data

  return ret_json





def get_link_data(db_connection):
  """
  Function queries data from the database, particularly from link_data table.

  Arguments:
  - db_connection: sqlite3 database connection

  Returns a list of JSON objects if queried data is not an empty, otherwise
  empty list.
  """

  json_list = []
  cursor = db_connection.cursor()

  try:
    query = query_from_table(db_connection, 'link_data')

  except sqlite3.OperationalError:
    print(sqlite3.OperationalError, 'QueryData statement failed with Operational error')
    return json_list

  # Cleanup table as I do not need old data, but before deleting data I must lock DB
  # in order to prevent any writing.
  if len(query) > 0:
    try:
      cursor.execute('BEGIN EXCLUSIVE')
      cursor.execute('DELETE FROM link_data')
      db_connection.commit()
    except sqlite3.OperationalError:
      print(sqlite3.OperationalError, 'DELETE statement failed with Operational error')


  # Database schema. If I change database schema I must modify here.

  # [0] status      TEXT,
  # [1] src_ip      TEXT,
  # [2] src_mac     TEXT,
  # [3] dst_ip      TEXT,
  # [4] dst_mac     TEXT,
  # [5] timestamp   TEXT,
  # [6] attributes  TEXT,

  for row in query:
    data = {'status': row[0],
            'src_ip': row[1],
            'src_mac': row[2],
            'dst_ip': row[3],
            'dst_mac': row[4],
            'timestamp': row[5],
            'attributes': row[6]
           }

    json_list.append(data)

  return json_list





def get_ids_data(db_connection):
  """
  Function queries data from the database, particularly from ids_data table.

  Arguments:
  - db_connection: sqlite3 database connection

  Returns a list of JSON objects if queried data is not an empty, otherwise
  empty list.
  """

  json_list = []
  cursor = db_connection.cursor()

  try:
    query = query_from_table(db_connection, 'ids_data')

  except sqlite3.OperationalError:
    print(sqlite3.OperationalError, 'QueryData statement failed with Operational error')
    return json_list

  # Cleanup table as I do not need old data, but before deleting data I must lock DB
  # in order to prevent any writing.
  if len(query) > 0:
    try:
      cursor.execute('BEGIN EXCLUSIVE')
      cursor.execute('DELETE FROM ids_data')
      db_connection.commit()
    except sqlite3.OperationalError:
      print(sqlite3.OperationalError, 'DELETE statement failed with Operational error')


  # Database schema. If I change database schema I must modify here.

  # [0] ip           TEXT,
  # [1] blocked      INTEGER,
  # [2] blocked_on   INTEGER,
  # [3] danger_level INTEGER,
  # [4] attributes   TEXT,
  # [5] last_update  REAL

  for row in query:
    data = {'ip': row[0],
            'blocked': row[1],
            'blocked_on': row[2],
            'danger_level': row[3],
            'attributes': row[4],
            'last_update': row[5]
           }

    json_list.append(data)

  return json_list





def get_ip_traffic_data(db_connection):
  """
  Function queries data from the database, particularly from ip_traffic_data
  table.

  Arguments:
  - db_connection: sqlite3 database connection

  Returns a dictionary of queried data.
  """

  ret_json = {}

  #TODO Implement

  return ret_json





def get_iface_data(db_connection):
  """
  Function queries data from the database, particularly from net_interface_data table.

  Arguments:
  - db_connection: sqlite3 database connection

  Returns a dictionary of queried data.
  """

  ret_json = {}

  try:
    query = query_from_table(db_connection, 'net_interface_data')

  except sqlite3.OperationalError:
    print(sqlite3.OperationalError, 'QueryData: statement failed with Operational error')
    return ret_json


  # Database schema. If I change database schema I must modify here.

  # [0] iface       TEXT PRIMARY KEY,
  # [1] mac         TEXT,
  # [2] ip          TEXT,
  # [3] tx_bytes    INTEGER,
  # [4] tx_packets  INTEGER,
  # [5] tx_dropped  INTEGER,
  # [6] rx_bytes    INTEGER,
  # [7] rx_packets  INTEGER,
  # [8] rx_dropped  INTEGER,
  # [9] last_update REAL

  for row in query:
   iface = str(row[0])
   ip_list = row[2]
   data = {
           'mac': row[1],
           'ip': ip_list.split(","),
           'tx_bytes': row[3],
           'tx_packets': row[4],
           'tx_dropped': row[5],
           'rx_bytes': row[6],
           'rx_packets': row[7],
           'rx_dropped': row[8],
           'last_update': row[9]
          }

   ret_json[iface] = data

  return ret_json





def insert_log_data(db_connection, schema):
  """
  Function stores data into the database, particularly in the node_log table.

  Arguments:
  - db_connection: sqlite3 database connection
  - schema: Data in JSON format, which will be stored in the database
  """

  # TODO finish implementation
  utc_now = 0


  # I store timestamp in this format, because it will be easy to query data
  # by specific time.
  year = int(utc_now.year)
  month = int(utc_now.month)
  day = int(utc_now.day)
  hour = int(utc_now.hour)
  minute = int(utc_now.minute)
  second = int(utc_now.second)

  try:
    db_connection.execute("""
      INSERT INTO node_log
        (year, month, day, hour, minute, second, data)
      VALUES
        (?, ?, ?, ?, ?, ?, ?)
    """, (year, month, day, hour, minute, second, json_str))

    db_connection.commit()

  except sqlite3.OperationalError:
    print(sqlite3.OperationalError, 'INSERT statement failed with Operational error')





def cleanup_db(db_connection):
  """
  Function cleans up database, besides node_id table, every time when user runs
  for the first time.
  """

  try:
    db_connection.execute("""DROP TABLE IF EXISTS agent_devices""")
    db_connection.execute("""DROP TABLE IF EXISTS ip_traffic_data""")
    db_connection.execute("""DROP TABLE IF EXISTS net_interface_data""")
    db_connection.execute("""DROP TABLE IF EXISTS node_log""")
    db_connection.execute("""DROP TABLE IF EXISTS ids_data""")
    db_connection.execute("""DROP TABLE IF EXISTS link_data""")
    #db_connection.execute("""DROP TABLE IF EXISTS node_id""")

    db_connection.commit()

  except sqlite3.OperationalError:
    print(sqlite3.OperationalError, 'INSERT statement failed with Operational error')

