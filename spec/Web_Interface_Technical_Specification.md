# Web Interface Design and Technical Specification
##### Columbia University, the Internet Real-Time Laboratory (IRT Lab), 2018-2019.

## 1 Introduction
This document provides Network Monitoring Tool’s web interface (UI) design and
technical specification.

## 2 Web Interface Design
Web interface has one page. For now, tabs are: `Network Topology`,
`Devices List`, `Traffic Data`, `Intrusion Detection` and `Notifications`.

## 3 Technical Specification
Technical specification of web interface (front-end) specifies all technical
details; HTTP requests, response data format and websocket specifications.
Communications between front-end and back-end are only through HTTP and Websocket
application layer protocols. All communications (HTTP and Websocket) between
front-end and back-end is secure and it is encrypted by Transport Layer Security
(TLS).

All HTTP requests’ response is a JSON object and format is

    {
     status: <status of request>,
     message: <descriptive message>,
     data:  <requested data>
    }

Where `status` of request is ‘ok’ or ‘error’ string. If status is error then
data is null and message provides descriptive message. If status is ok then
message is an empty string and data is requested data.

#### Websocket:
Websocket server sends data every ~5 seconds. So, the user DOES NOT need to
refresh page.

Websocket URL: `https://<domain_name>:443/socket.io/`

Note that Websocket URL is always the same, but it has more than one messages.
Format of every message is JSON object: `{data: <message data>}`.

### 3.1 Network Topology Data
Get network topology data using HTTP request or listening websocket.

GET Request: `https://<domain_name>/get_network_topology_data`

Responded JSON object’s data is a JSON object and format is

    {<vlan_name>: <vlan data>,...}

where key (<vlan_name>) is the VLAN name and value (<vlan data>) is JSON object;
see Network Topology JSON Format Table for JSON format of value.

###### Network Topology JSON Format Table

| JSON Key | Value type | Value Description |
| --- | --- | :------- |
| nodes | JSON object | Embedded JSON object. See Node Table.|
| links | Array of JSON objects | See Link Table for JSON object format.|
| visible_devs | JSON Object | See Visible Devices Table for JSON object format.|

###### Node Table
Note that the format of JSON object is `{dev_id: <JSON object. See table>, ...}`,
where dev_id is unique ID of node and value is JSON object (see table for description).

| JSON Key | Value type | Value Description |
| --- | --- | :------- |
| status | String | Device status. It is up, down or congested.|
| id | String | Unique ID of node.|
| type | String | Phoenix Box or Device.|
| mac | String | MAC address of device.| 
| ip | String | An IPv4 address of device.|
| hostname | String | Hostname of device.|
| vlan | String | VLAN name.|
| iface | String | Network interface name used by device.|
| last_update | Integer number | Last update of device in UTC milliseconds. This is the last ARP request timestamp.|
| geo_location | JSON object | See Geo location Table.|

###### Link Table
Format of single JSON object in a list of JSON objects.

| JSON Key | Value type | Value Description |
| --- | --- | :------- |
| status | String | Link status. It is up, low, medium or down.|
| src_id | String | Unique ID of source device.|
| src_ip | String | An IPv4 address of source node.|
| src_mac | String | A MAC address of source node (optional).|
| dst_id | String | Unique ID of destination device.|
| dst_ip | String | An IPv4 address of the destination node.|
| dst_mac | String | A MAC address of the destination node (optional).|
| timestamp | String | The timestamp of the measurement in UTC.|
| attributes | JSON String | “{link_quality: <>, bandwidth: <>,...}”|


###### Visible Devices Table
Visible devices format is pretty simple `{device_id: [list of IDs], ...}`
Where device_id  is unique ID of device (basically it is Phoenix BOX’s agent_id)
and list of IDs are all devices visible from. Every single PB connects to its visible devices.

#### Websocket:
Websocket message: `ws_network_topology_data`

If message’s (JSON object) data is not null then it is a JSON object. See
Network Topology JSON Format table for JSON format.

## 3.2 Devices Data
This collection stores information about the devices discovered by the agent on
one of PHOENIX box’s LAN interfaces. Can be queried over the HTTP API at:
`https://<domain_name>/get_devices_data`

Responded JSON object’s data is a JSON object and format is `{<device_id>: <device data>,...}`
where key <device_id> is the unique ID of device and value <device data> is
JSON object; see below table for the format.

| JSON Key | Value type | Value Description |
| --- | --- | :------- |
| id | String | Unique ID of device.|
| status | String | Device status, it is up or down.|
| type | String | Phoenix Box or Device.|
| mac | String | MAC address of device.|
| ip | String | IPv4 address of device.|
| hostname | String | Hostname of device.|
| iface | String | The main network interface (used by Agent).|
| vlan | String | VLAN name.|
| last_update | Float point number | Last update of device in UTC milliseconds.This is the last ARP request timestamp.|
| registration_ts | Float point number | When device is registered on the database. UTC milliseconds.|
| open_tcp_ports | Array | An array of open TCP port numbers.|
| last_tcp_update | Float point number | UTC time in milliseconds. It shows when last time scanned open TCP ports.|
| open_udp_ports | Array | An array of open UDP port numbers.|
| last_udp_update | Float point number | UTC time in milliseconds. It shows when last time scanned open UDP ports.|
| oline_period | Integer Number | Device’s online time in minutes.|
| offline_period | Integer Number | Device’s offline time in minutes.|


#### Websocket:
Websocket message: `ws_devices_data`<br/>
If message’s (JSON object) data is not null then it is an array of JSON objects.
See Device Data JSON Format table for single JSON object’s format.

## 3.3 Traffic Data
Basically traffic data consists of two parts: VLAN traffic data and Link statistics data.

Get traffic data using HTTP request or listening websocket.

GET Request: `https://<domain_name>/get_traffic_data`

Responded JSON object’s data is a JSON objects:

    {
     nodes: <see Nodes Traffic JSON>,
     vlans: <see VLANs Traffic JSON>
    }
    Nodes Traffic JSON
    {<node_id>:{
                 hostname: <node hostname>
                 vlan: <VLAN name>,
                 total_traffic: {rx_bytes: <value>, tx_bytes: <value>},   
                 time_series : {
                   value: [{rx: <value>, tx: <value>},...],
                   date: [<date for value[0]>, <date for value[1]>,...]
                 },
                 last_update: <last update in UTC milliseconds>
               },
     ...
    }
    
VLANs Traffic JSON

    {vlan_name:{
                 vlan: <VLAN name>,
                 total_traffic: {rx_bytes: <value>, tx_bytes: <value>},   
                 time_series : {
                   value: [{rx: <value>, tx: <value>},...],
                   date: [<date for value[0]>, <date for value[1]>,...]
                 },
                 last_update: <last update in UTC milliseconds>
               },
     ...
    }

Where <value> is a number of bytes. It is an integer number. Developer must
convert bytes to human readable values like 1MB, 1.5MB, 1.2GB and so on.

#### Websocket:

Websocket message: `ws_traffic_data` <br/>
If message’s (JSON object) data is not null then it is a JSON objects. See
above HTTP response format for details.


## 3.4 Intrusion Detection
Intrusion Detection System - IDS Events.
Get IDS events using HTTP request or listening websocket.

GET Request: `https://<domain_name>/get_ids_events_data`

Responded JSON object’s data is an array of JSON objects. See IDS Events JSON
Format Table for single JSON object’s format.
IDS Events JSON Format Table

| JSON key | Value type | Value description |
| --- | --- | :------- |
| vlan | String | VLAN name.|
| phx_box | String | Phoenix box hostname.|
| ip | String | IPv4 address of attacker.|
| danger_level | Integer number | Danger lleve.|
| blocked | String | This must be a YES or NO.|
| blocked_on | Integer number | UNIX Epoch time.|
| attributes |JSON String|



Note that ‘timestamp’ is in UTC milliseconds standard, but user should see it
in local time and it should be a human readable format.

##### Websocket:
Websocket message: `ws_ids_events_data` <br/>
If message’s (JSON object) data is not null then it is an array of JSON objects.
See IDS Events JSON Format Table table for single JSON object’s format.


## 3.5 Notifications
Get notifications data using HTTP request or listening websocket.

GET Request: `https://<domain_name>/get_notifications_data`

Responded JSON object’s data is an array of JSON objects. See Notifications
JSON Format Table for single JSON object’s format.

###### Notifications JSON Format Table

| JSON Key | Value type | Value Description |
| --- | --- | :------- |
| ts | Floating point number | Notification’s timestamp in UTC milliseconds.|
| type | String | Type must be green, yellow or red.|
| message | String | Descriptive message of notification.|

Note that ‘ts’ is in UTC standard, but user should see it in local time.
For example, 2 minutes ago.

##### Websocket:
Websocket message: `ws_notifications_data`

If message’s (JSON object) data is not null then it is an array of JSON objects.
See Notifications JSON Format table for single JSON object’s format.



