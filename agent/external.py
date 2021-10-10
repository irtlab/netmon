"""
Module name:
  external.py


Description:
  Module provides functionality to process external commands.


Authors:
  Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.

"""

import utils
import json
import sqlite3
import traceback
from time import sleep
from subprocess import run, TimeoutExpired, CalledProcessError
from datetime import datetime

__all__ = ['process_external_data', 'invoke_external_command']


def print_exc_info(e):
  print('Command: "%s"' % e.cmd)
  print('Stdout: %s' % '|\t'.join(e.stdout.strip().splitlines(True)))
  print('Stderr: %s' % '|\t'.join(e.stderr.strip().splitlines(True)))





def process_external_data(db_connection, *args):

  for data in invoke_external_command(*args):
    try:
        data = json.loads(data)
    except Exception:
        utils.print_error('Error: External command returned malformed JSON data')
        traceback.print_exc()
    else:
        try:
          if len(data) > 0 and data[0]['type']:
            if data[0]['type'] == 'link':
              insert_link_data(db_connection, data)
            if data[0]['type'] == 'device':
              insert_ids_data(db_connection, data)
        except Exception:
          utils.print_error('Error: Inserting link/route and/or IDS data into the database failed')
          traceback.print_exc()





def invoke_external_command(cmd, interval = 3, timeout = 2):

  interval = float(interval)
  timeout = float(timeout)

  if timeout > interval:
    raise ValueError('Timeout longer than interval')

  while True:
    start = datetime.now()

    try:
        rv = run(cmd, timeout=timeout, text=True, check=True, shell=True, capture_output=True)
        yield rv.stdout.strip()
    except TimeoutExpired as e:
        print('Error: External command killed after %f seconds' % timeout)
        print_exc_info(e)
    except CalledProcessError as e:
        print('Error: External command terminated with return code %d' % e.returncode)
        print_exc_info(e)

    # Calculate the time it took to run the command
    elapsed = datetime.now() - start
    elapsed = elapsed.seconds + elapsed.microseconds / 1e6

    # Calculate the remaining time in this interval. Clamp the value
    # to <0, interval>
    sleep(max(min(interval - elapsed, interval), 0))





def parse_link_data(data):

  db_schema = {
    "status": '',
    "src_ip": '',
    "src_mac": '',
    "dst_ip": '',
    "dst_mac": '',
    "timestamp": '',
    "attributes": {}
  }

  schema = []
  for json_data in data:
    # TODO Complete data verification.
    tmp_db_schema = {k: json_data.get(k, v) for k, v in db_schema.items()}
    schema.append(tmp_db_schema)

  return schema





def insert_link_data(db_connection, received_data):

  db_schema_list = parse_link_data(received_data)

  for data in db_schema_list:
    attributes = json.dumps(data['attributes'])
    try:
      db_connection.execute("""
        INSERT INTO link_data
          (status, src_ip, src_mac, dst_ip, dst_mac, timestamp, attributes)
        VALUES
          (?, ?, ?, ?, ?, ?, ?)
      """, (data['status'], data['src_ip'], data['src_mac'], data['dst_ip'], data['dst_mac'], data['timestamp'], attributes))

      db_connection.commit()

    except sqlite3.OperationalError:
      utils.print_error('INSERT statement failed with Operational error', sqlite3.OperationalError)
      traceback.print_exc()





def parse_ids_data(data):

  db_schema = {
    "ip": '',
    "blocked": '',
    "blocked_on": 0,
    "danger_level": 0,
    "attributes": {},
    "last_update": 0
  }

  schema = []
  for json_data in data:
    # TODO Complete data verification.
    tmp_db_schema = {k: json_data.get(k, v) for k, v in db_schema.items()}
    schema.append(tmp_db_schema)

  return schema





def insert_ids_data(db_connection, received_data):

  db_schema_list = parse_ids_data(received_data)

  for data in db_schema_list:
    attributes = json.dumps(data['attributes'])
    try:
      db_connection.execute("""
        INSERT INTO ids_data
          (ip, blocked, blocked_on, danger_level, attributes, last_update)
        VALUES
          (?, ?, ?, ?, ?, ?)
      """, (data['ip'], data['blocked'], data['blocked_on'], data['danger_level'], attributes, data["last_update"]))

      db_connection.commit()

    except sqlite3.OperationalError:
      utils.print_error('INSERT statement failed with Operational error', sqlite3.OperationalError)
      traceback.print_exc()


