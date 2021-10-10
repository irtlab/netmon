/**
 * utils/schemas.js
 *
 * Authors:
 *   Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.
 *
 * Description:
 * File provides almost all MongoDB database documents' schemas, which we use
 * in our project.
 */

const ObjectID = require('mongodb').ObjectID;
const utils = require('../utils/utils');


function getDeviceSchema(mac, device_data, vlan_name) {
  let hostname = '';
  if (!device_data.hostname) {
    hostname = device_data.ip;
  } else {
    hostname = device_data.hostname;
  }

  if (!device_data.bandwidth) {
    device_data.bandwidth = 0;
  }

  const device_schema = {
    // Create MongoDB ObjectID as a 24 byte unique hex string representation.
    // I do this for frontend code, so every device will have an unique ID as
    // two Agents can have the same MAC address.
    id: new ObjectID(),
    status: 'up',
    type: 'Device',
    mac: String(mac),
    ip: String(device_data.ip),
    hostname,
    iface: String(device_data.iface),
    vlan: String(vlan_name),
    bandwidth: Number(device_data.bandwidth),
    last_update: Number(device_data.last_update),
    registration_ts: Number(device_data.registration_ts),
    open_tcp_ports: String(device_data.open_tcp_ports),
    last_tcp_update: Number(device_data.last_tcp_update),
    open_udp_ports: String(device_data.open_udp_ports),
    last_udp_update: Number(device_data.last_udp_update)
  };

  return device_schema;
}



function getAgentSchema(agent_data) {
  const utc_milliseconds = (new Date()).getTime();

  const agent_schema = getDeviceSchema(agent_data.mac, agent_data, agent_data.vlan_name);
  agent_schema['type'] = 'Phoenix Box';
  // As MongoDB does not allow key which contains dot I store
  // it as a string. For devices this is not needed.
  agent_schema['iface'] = String(JSON.stringify(agent_data.iface));

  // Note that _id field is reserved for primary key in MongoDB, and that must
  // be a unique value. I init _id field here, because agent_data.id is unique.
  // Agent ID is a UUID of Agent device.
  agent_schema['_id'] = String(agent_data.id);
  // I do this for frontend side as every device must have 'id' field.
  agent_schema['id'] = String(agent_data.id);

  agent_schema['substation_name'] = String(agent_data.substation_name);
  agent_schema['last_update'] = utc_milliseconds;
  agent_schema['registration_ts'] = utc_milliseconds;
  agent_schema['open_tcp_ports'] = [];
  agent_schema['last_tcp_update'] = 0;
  agent_schema['open_udp_ports'] = [];
  agent_schema['last_udp_update'] = 0;
  agent_schema['visible_devices'] = {};
  agent_schema['link_data'] = [];

  return agent_schema;
}



function getNotificationSchema(message, type, utc_milliseconds = '') {
  // Get the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC,
  // with leap seconds ignored.
  if (!utc_milliseconds) {
    utc_milliseconds = (new Date()).getTime();
  }

  const schema = {
    ts: utc_milliseconds,
    type: String(type),
    message: String(message),
  };

  return schema;
}



function getIfacesDataSchema(agent_id, ws_data, vlan_name) {
  // As MongoDB NodeJS driver cannot contain store . and $ as a key I convert
  // JSON data to String. In new version of NodeJS this will be supported.
  // Note that network interface name is a key of document.

  // Note that _id field is reserved for primary key in MongoDB, and that must
  // be a unique value. I init _id field here, because agent_id is unique.
  // Agent ID is a UUID of Agent device.

  const schema = {
    _id: agent_id,
    vlan: vlan_name,
    ifaces_data: JSON.stringify(ws_data),
    last_update: (new Date()).getTime()
  };

  return schema;
}



function getVlanTrafficTsSchema(all_time_traffic, vlan_name) {
  const value = [];
  value.push({rx: all_time_traffic.rx_bytes, tx: all_time_traffic.tx_bytes});

  const utc_date = utils.getVlanTrafficChartDate();
  const date = [];
  date.push(utc_date);

  // 'date[i]' contains timestamp and 'value[i]' corresponding RX and TX.
  const time_series = {
    value,
    date
  };

  const schema = {
    vlan: String(vlan_name),
    total_traffic: all_time_traffic,
    time_series,
    last_update: (new Date()).getTime()
  };

  return schema;
}



function getNodeTrafficTsSchema(all_time_traffic, agent_id, agent_hostname, vlan_name) {
  const value = [];
  value.push({rx: all_time_traffic.rx_bytes, tx: all_time_traffic.tx_bytes});

  const utc_date = utils.getVlanTrafficChartDate();
  const date = [];
  date.push(utc_date);

  // 'date[i]' contains timestamp and 'value[i]' corresponding RX and TX.
  const time_series = {
    value,
    date
  };

  const schema = {
    _id: agent_id,
    hostname: agent_hostname,
    vlan: String(vlan_name),
    total_traffic: all_time_traffic,
    time_series,
    last_update: (new Date()).getTime()
  };

  return schema;
}



function getIDSEventsSchema(agent_id, vlan_name, ids_events) {
  const schema = {
    _id: agent_id,
    vlan: vlan_name,
    last_update: new Date(),
    ids_events
  };

  return schema;
}

module.exports.getAgentSchema = getAgentSchema;
module.exports.getDeviceSchema = getDeviceSchema;
module.exports.getNotificationSchema = getNotificationSchema;
module.exports.getIfacesDataSchema = getIfacesDataSchema;
module.exports.getVlanTrafficTsSchema = getVlanTrafficTsSchema;
module.exports.getNodeTrafficTsSchema = getNodeTrafficTsSchema;
module.exports.getIDSEventsSchema = getIDSEventsSchema;

