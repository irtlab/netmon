/*
 * utils/db_utils.js
 *
 * Authors:
 *   Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.
 *
 * Description:
 * File provides utility functions for DB.
 *
 */

const moment = require('moment');

const constants = require('../common/constants');
const schemas = require('../utils/schemas');
const utils = require('../utils/utils');


function getDevicesData(db, callback) {
  // See frontend technical documentation.
  const getAllDevices = function (agents_list) {
    const all_devices = {};

    for (let i = 0; i < agents_list.length; i++) {
      const agent_data = agents_list[i];
      const agent_devices = agent_data.visible_devices;
      agent_data.visible_devices = {};
      agent_data.link_data = [];

      all_devices[agent_data.id] = agent_data;
      for (const [mac, agent_device_data] of Object.entries(agent_devices)) {
        all_devices[mac] = agent_device_data;
      }
    }

    return all_devices;
  };


  const agents_col = db.collection(constants.agents_col);
  agents_col.find({}).toArray((error, result) => {
    if (!error && result && result.length > 0) {
      const all_devices = getAllDevices(result);
      callback(null, all_devices);
    } else if (error) {
      callback(error.message, null);
    } else {
      callback('No registered devices found', null);
    }
  });
}



function getNetworkTopologyData(db, callback) {
  const getNetTopologyDeviceData = function (dev_data, id) {
    let then_utc = moment.utc(dev_data.last_update).format('YYYY-MM-DD HH:mm:ss');
    then_utc = moment(then_utc);
    let now_utc = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss');
    now_utc = moment(now_utc);

    const duration = moment.duration(now_utc.diff(then_utc));
    const diff_minutes = duration.asMinutes();

    // By default device status is up, if device last_update and current UTC
    // millisecond's difference is 1 minute, then set device status to down.
    let dev_status = 'up';
    if (diff_minutes > 1) {
      dev_status = 'down';
    }

    let substation_name = null;
    if (dev_data.type === 'Phoenix Box' && dev_data.substation_name) {
      substation_name = dev_data.substation_name;
    }

    const data = {
      status: dev_status,
      id,
      type: dev_data.type,
      mac: dev_data.mac,
      ip: dev_data.ip,
      hostname: dev_data.hostname,
      substation_name,
      vlan: dev_data.vlan,
      iface: dev_data.iface,
      bandwidth: dev_data.bandwidth,
      last_update: dev_data.last_update
    };

    return data;
  };


  const agents_col = db.collection(constants.agents_col);
  agents_col.find({}).toArray((error, agents_list) => {
    if (!error && agents_list && agents_list.length > 0) {
      const nt_data = {};
      for (let i = 0; i < agents_list.length; i++) {
        const agent_data = agents_list[i];
        const vlan_name = agent_data.vlan;

        if (utils.HasKey(nt_data, vlan_name)) {
          const nodes = nt_data[vlan_name].nodes;
          let links = nt_data[vlan_name].links;
          const visible_devs = nt_data[vlan_name].visible_devs;

          const visible_devs_list = [];
          nodes[agent_data.id] = getNetTopologyDeviceData(agent_data, agent_data.id);
          for (const visible_device_data of Object.values(agent_data.visible_devices)) {
            const dev_id = visible_device_data.id;
            nodes[dev_id] = getNetTopologyDeviceData(visible_device_data, dev_id);
            visible_devs_list.push(dev_id);
          }

          visible_devs[agent_data.id] = visible_devs_list;
          links = links.concat(agent_data.link_data);
          const vlan_data = {nodes, links, visible_devs};
          nt_data[vlan_name] = vlan_data;
        } else {
          const nodes = {};
          const visible_devs_list = [];
          nodes[agent_data.id] = getNetTopologyDeviceData(agent_data, agent_data.id);

          for (const visible_device_data of Object.values(agent_data.visible_devices)) {
            const dev_id = visible_device_data.id;
            nodes[dev_id] = getNetTopologyDeviceData(visible_device_data, dev_id);
            visible_devs_list.push(dev_id);
          }

          const visible_devs = {};
          visible_devs[agent_data.id] = visible_devs_list;
          const vlan_data = {nodes, links: agent_data.link_data, visible_devs};
          nt_data[vlan_name] = vlan_data;
        }
      }

      callback(null, nt_data);
    } else if (error) {
      callback(error.message, null);
    } else {
      callback('No registered devices found', null);
    }
  });
}



function CalculateTotalTraffic(traffic_data) {
  for (const data of Object.values(traffic_data)) {
    let total_rx = 0;
    let total_tx = 0;
    const value = data.time_series.value;
    for (let i = 0; i < value.length; i++) {
      total_rx += value[i].rx;
      total_tx += value[i].tx;
    }

    data.total_traffic.rx_bytes = total_rx;
    data.total_traffic.tx_bytes = total_tx;
  }

  return traffic_data;
}



function UpdateNodeTrafficData(traffic_data) {
  const vlan_nodes = {};
  const vlans = JSON.parse(JSON.stringify(traffic_data.vlans));
  for (const [key, vlan_data] of Object.entries(vlans)) {
    vlan_nodes[key] = vlan_data;
    vlan_nodes[key].time_series.value = [];
    vlan_nodes[key].time_series.date = [];
  }

  const nodes = traffic_data.nodes;
  for (const node_data of Object.values(nodes)) {
    const hostname = node_data.hostname;
    const vlan = node_data.vlan;

    const size = node_data.time_series.value.length;
    const value = node_data.time_series.value[size - 1];
    const date = hostname.replace('.phxnet.org', '');

    vlan_nodes[vlan].time_series.value.push(value);
    vlan_nodes[vlan].time_series.date.push(date);
  }

  // Calculate total RX and TX as database stors onlt the latest total
  // from the Agent.
  CalculateTotalTraffic(traffic_data.vlans);
  CalculateTotalTraffic(traffic_data.nodes);

  const updated_data = {};
  updated_data['vlans'] = traffic_data.vlans;
  updated_data['per_node_vlan'] = vlan_nodes;
  updated_data['nodes'] = traffic_data.nodes;

  return updated_data;
}



function getTrafficData(db, callback) {
  const node_traffic = {};
  const vlan_traffic = {};

  const node_traffic_ts_col = db.collection(constants.node_traffic_ts_col);
  const vlan_traffic_ts_col = db.collection(constants.vlan_traffic_ts_col);

  vlan_traffic_ts_col.find({}).toArray((error, result) => {
    if (!error && result && result.length > 0) {
      for (let i = 0; i < result.length; i++) {
        const vlan_name = result[i].vlan;
        vlan_traffic[vlan_name] = result[i];
      }
    } else if (error) {
      console.error(error.message);
    }

    node_traffic_ts_col.find({}).toArray((error, node_result) => {
      if (!error && node_result && node_result.length > 0) {
        for (let i = 0; i < node_result.length; i++) {
          const node_id = node_result[i]._id;
          node_traffic[node_id] = node_result[i];
        }
      } else {
        console.error(error.message);
      }

      // TODO What to do if I get an error? not sure if NOT sending error
      // message to the user is a good idea.

      let response_obj = {nodes: node_traffic, vlans: vlan_traffic};
      // I modify object here because in UI side I am going to display
      // per-node VLAN data chart.
      response_obj = UpdateNodeTrafficData(response_obj);
      callback(null, response_obj);
    });
  });
}



function getNotificationsData(db, callback) {
  const notifications_col = db.collection(constants.notifications_col);
  notifications_col.find({}).sort({ts: 1}).limit(50).toArray((error, result) => {
    if (!error && result && result.length > 0) {
      callback(null, result);
    } else if (error) {
      callback(error.message, null);
    } else {
      callback('There are not notifications for now', null);
    }
  });
}



function getIDSEventsData(db, callback) {
  const RemoveOldData = function (ids_events, hours) {
    const updated_list = [];
    for (let i = 0; i < ids_events.length; i++) {
      const last_update = ids_events[i].last_update;
      let then_utc = (moment.unix(last_update).utc()).format('YYYY-MM-DD HH:mm:ss');
      then_utc = moment(then_utc);
      let now_utc = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss');
      now_utc = moment(now_utc);

      const duration = moment.duration(now_utc.diff(then_utc));
      const diff_hours = duration.asHours();
      if (diff_hours <= hours) {
        updated_list.push(ids_events[i]);
      }
    }

    return updated_list;
  };


  const MergeAgentsIDSEvents = function (db_data) {
    if (!db_data || db_data.length < 1) {
      return [];
    }

    let all_ids_events = [];
    for (let i = 0; i < db_data.length; i++) {
      const agent_ids_events = RemoveOldData(db_data[i].ids_events, (30 * 24));
      all_ids_events = all_ids_events.concat(agent_ids_events);
    }

    return all_ids_events;
  };


  const ids_data_col = db.collection(constants.ids_data_col);
  ids_data_col.find({}).toArray((error, result) => {
    if (error) {
      callback(error.message, null);
    } else {
      const all_ids_events = MergeAgentsIDSEvents(result);
      callback(null, all_ids_events);
    }
  });
}



// TODO I have to think better desing for storing notifications.
function InsertNotifications(db, notification_doc, callback) {
  let doc_list = [];
  if (Array.isArray(notification_doc) === true) {
    doc_list = notification_doc;
  } else {
    doc_list.push(notification_doc);
  }

  if (doc_list.length > 0) {
    const notifications_col = db.collection(constants.notifications_col);
    notifications_col.insertMany(doc_list, (error) => {
      if (error) {
        callback(error.message, null);
      } else {
        callback(null, 'ok');
      }
    });
  } else {
    callback(null, 'ok');
  }
}



function RegisterAgent(db, agent_data, callback) {
  const agents_col = db.collection(constants.agents_col);

  const query = {_id: agent_data.id};
  agents_col.findOne(query, (error, result) => {
    if (error) {
      callback(error.message, null);
    } else if (result) {
      // This means that Agent already registered, at least agent_id is the
      // same. I should store notification about this event and for now allow
      // device to establish connection with back-end server.
      if (result.mac !== agent_data.mac || result.ip !== agent_data.ip) {
        let message = '';
        if (result.ip !== agent_data.ip) {
          message = 'Agent ' + String(agent_data.id) + ' changed IP address from ' +
                      String(result.ip) + ' to ' + String(agent_data.ip);
        } else if (result.mac !== agent_data.mac) {
          message = 'Agent ' + String(agent_data.id) + ' changed MAC address from ' +
                      String(result.mac) + ' to ' + String(agent_data.mac);
        } else {
          message = 'Agent ' + String(agent_data.id) + ' changed MAC and IP addresses';
        }

        const not_schema = schemas.getNotificationSchema(message, 'yellow');
        // TODO what if I get an error here?
        InsertNotifications(db, not_schema, () => {});
      }

      callback(null, 'exists');
    } else {
      const agent_schema = schemas.getAgentSchema(agent_data);
      agents_col.insertOne(agent_schema, (error, res) => {
        if (error || res.result.ok !== 1 || res.result.n !== 1) {
          callback('Unable to register agent.', null);
        } else {
          callback(null, 'ok');
        }
      });
    }
  });
}

module.exports.RegisterAgent = RegisterAgent;
module.exports.InsertNotifications = InsertNotifications;
module.exports.getDevicesData = getDevicesData;
module.exports.getNetworkTopologyData = getNetworkTopologyData;
module.exports.getNotificationsData = getNotificationsData;
module.exports.getTrafficData = getTrafficData;
module.exports.getIDSEventsData = getIDSEventsData;

