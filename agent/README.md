# Agent

### Requirements
Minimum software requirements are `python >=3.6`, `pip3`, `python3-env` and
`nmap`;

### Build Agent
At first create Python virtual environment and activate it.<br/>

    python3 -m venv agent-env
    source agent-env/bin/activate

Now, change directory (cd) to the `agent-env` directory and download tool via
`git clone` command.<br/>

    cd agent-env
    git clone https://gitlab.com/phxnet/monitor.git


Inside of `monitor/agent` directory there is a `requirements.txt` file, which
contains a list of required libraries to be installed using `pip3 install`
command.<br/>

    sudo pip3 install -r monitor/agent/requirements.txt


### Run Agent

Make sure you activated python virtual environment and you are in `monitor/agent`
directory.

#### Command Line Arguments
`--db_file_path:` SQLite database file's absolute path. By default it is set to
                  `/var/local/monitoring_sqlite3.db`.<br/>
`--server_url:` Websocket Server's URL.<br/>
`--substation_name:` (optional). If it is not provided then hostname will be
set.<br/>
`--net_interfaces:` List of network interfaces in string format. For example,
```--net_interfaces="eth1, eth2"```. By default it takes existing network
interfaces.<br/>
`--external_interval:` (optional) Interval (s) between invocations of external
commands. If Agent is not going to run external command then no need to provide
this argument. By default it is set to 3.<br/>
`--external_timeout:` (optional) Maximum time (s) an external command is allowed
to run. If Agent is not going to run external command then no need to provide this
argument. By default it is set to None.<br/>
`--external_command:` Periodically invoke given command to gather external data.<br/>
`--uuid:` (optional) If this is provided then as a unique ID of the device will be
UUID, otherwise value of SHA1(hostname).<br/>

#### Run Agent
Runnin the Agent is straightforward, just run `run_network_scanner.py` script.
 
     sudo python3 run_network_scanner.py --net_interfaces='enp0s3, wlp7s0'