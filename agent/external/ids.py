import sys
import json
import traceback
import logging
import getopt
import os
import filecmp
from datetime import datetime

def get_unix_epoch_seconds():
  """
  Function returns Unix Epoch time in seconds.
  """
  return int(datetime.utcnow().timestamp())



def read_top_attacker(top_attacker_file, save_attacker_file, data_list):
    with open(top_attacker_file) as _csvfile:
        for _line in _csvfile:
            _csv = _line.split(',')
            if len(_csv) == 6:
                # ip, danger_level, total_packets, uniq_sigs, sig_matches, is_local
                _data = {}
                _attributes = {}
                _data["ip"] = _csv[0]
                _data["type"] = "device"
                _data["blocked"] = False
                _data["blocked_on"] = 0
                _data["danger_level"] = int(_csv[1])
                _attributes["total_packets"] = int(_csv[2])
                _attributes["uniq_sigs"] = int(_csv[3])
                _attributes["sig_matches"] = int(_csv[4])
                _attributes["is_local"] = int(_csv[5])
                _data["attributes"] = _attributes
                _data["last_update"] = get_unix_epoch_seconds()
                data_list.append(_data)
        os.rename(top_attacker_file, save_attacker_file)
    return



def update_auto_blocked(data_list, ip, blocked_on):
    #
    for _event in data_list:
        if _event["ip"] == ip:
            _event["blocked"] = True
            _event["blocked_on"] = blocked_on
            #print('found - ', ip, blocked_on)
            return
    #
    # not found, create a new entry.
    #print('not found - ', ip, blocked_on)
    _data = {}
    _attributes = {}
    _data["type"] = "device"
    _data["ip"] = ip
    _data["blocked"] = True
    _data["blocked_on"] = blocked_on
    _data["danger_level"] = 0
    _attributes["total_packets"] = 0
    _attributes["uniq_sigs"] = 0
    _attributes["sig_matches"] = 0
    _attributes["is_local"] = 0
    _data["attributes"] = _attributes
    _data["last_update"] = get_unix_epoch_seconds()
    data_list.append(_data)
    return


def read_auto_blocked(auto_blocked_file, data_list):
    with open(auto_blocked_file) as _csvfile:
        for _line in _csvfile:
            _csv = _line.split(',')
            if len(_csv) == 2:
                # ip, blocked_on (timestamp)
                # print('read_auto_blocked', _csv)
                _ip = _csv[0]
                _blocked_on = int(_csv[1])
                update_auto_blocked(data_list, _ip, _blocked_on)
    return



def write_json(data, json_file):
    with open(json_file, "w") as f:
            f.write(json.dumps(data))



def usage():
    """Display usage syntax."""
    logger.info('ids_parser.py -p [psad output file dir] -o [output-json-filename] -h ')



def main():
    logging.basicConfig(level=logging.INFO, format='%(name)-10s:%(message)s')
    #
    try:
        _opts, _ = getopt.getopt(sys.argv[1:],
                                 'p:o:h',
                                 ['p=', 'o=', 'help'])
    except getopt.GetoptError:
        logger.error('Command option error - %s', repr(getopt.GetoptError))
        usage()
        sys.exit(2)

    _pathname = "/srv/netmon/src/agent"
    _ofname = "ids_events.json"

    for _opt, _arg in _opts:
        if _opt in ('-h', '--help'):
            usage()
            sys.exit(2)
        elif _opt in ('-p'):
            # override default path
            _pathname = _arg
        elif _opt in ('-o'):
            # override default filename
            _json_ofname = _arg
        else:
            usage()
            sys.exit(2)
    _top_attacker_file = _pathname + "/top_attackers"
    _save_attacker_file = _top_attacker_file + ".save"
    _auto_blocked_file = _pathname + "/auto_blocked_iptables"
    _event_json_file = _pathname + "/" + _ofname
    _json_data = []
    if os.path.isfile(_top_attacker_file) is True:
        if os.path.isfile(_save_attacker_file) is True:
            if filecmp.cmp(_top_attacker_file, _save_attacker_file) is True:
                # no change return empty list.
                return _json_data
        read_top_attacker(_top_attacker_file, _save_attacker_file, _json_data)
        if os.path.isfile(_auto_blocked_file) is True:
            read_auto_blocked(_auto_blocked_file, _json_data)
    return _json_data
    # write_json(_json_data, _event_json_file)



if __name__ == '__main__':
    try:
        print(json.dumps(main()), file = sys.stdout)
    except:
        traceback.print_exc(file = sys.stderr)
        sys.exit(1)
    finally:
        sys.stdout.flush()
        sys.stderr.flush()

