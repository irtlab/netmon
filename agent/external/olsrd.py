import sys
import json
import traceback
import datetime
import requests
import netifaces

# Set to the port number of olsrd's jsoninfo plugin
url = 'http://127.0.0.1:9090/links'

# Set to "olsrd" or "tc"
origin = "olsrd"

def utc_timestamp():
    return datetime.datetime.utcnow().isoformat() + 'Z'

def main():
    r = requests.get(url)
    r.raise_for_status()
    now = utc_timestamp()
    return [{
        'type': 'link',
        'status': 'up',
        'src_ip': l['localIP'],
        'src_mac': netifaces.ifaddresses(l['olsrInterface'])[netifaces.AF_LINK][0]['addr'],
        'dst_ip': l['remoteIP'],
        'timestamp': now,
        'attributes': {
            '_o': origin,
            '_v': 1,
            'linkQuality': l['linkQuality'],
        }
    } for l in r.json()['links']]

if __name__ == '__main__':
    try:
        print(json.dumps(main()), file=sys.stdout)
    except:
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
    finally:
        sys.stdout.flush()
        sys.stderr.flush()

