/**
 * websocket_server/process_data.js
 *
 * Authors:
 *   Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.
 *
 * Description:
 * Module provides functionality to process websocket received data from agents.
 *
 */

const crypto = require('crypto');

const verify = require('../../utils/verify');
const constants = require('../../common/constants');
const db_utils = require('../../utils/db_utils');
const utils = require('../../utils/utils');
const schemas = require('../../utils/schemas');


// Function processes websocket connections. Basically registers new agent
// connection if an agent is already registered it just notifies it.
//
// Arguments:
// - db: MongoDB database connection.
// - req: Websocket connection's request object. It contains Agent's data
//        which help to register new connected Agent.
// - vlan_name: VLAN name in string format.
function ProcessWebsocketConnection(db, req, vlan_name, callback) {
  const ifaces = verify.IsValidJSON(req.headers['ifaces']);
  if (ifaces === null) {
    callback('Not valid JSON object provided in header', null);
    return;
  }

  const agent_data = {
    id: req.headers['id'],
    hostname: req.headers['hostname'],
    substation_name: req.headers['substation_name'],
    mac: req.headers['mac'],
    ip: req.headers['ip'],
    iface: ifaces,
    vlan_name
  };

  if (agent_data.id && agent_data.mac && agent_data.ip && agent_data.hostname) {
    db_utils.RegisterAgent(db, agent_data, (error, result) => {
      if (error) {
        callback(error, null);
      } else if (result === 'exists') {
        // If Agent already exists on the database, I just set status up.
        const agents_col = db.collection(constants.agents_col);
        const query = {_id: agent_data.id};
        const update = {};
        update['last_update'] = (new Date()).getTime();
        update['status'] = 'up';
        agents_col.updateOne(query, {$set: update}, (error) => {
          if (error) {
            callback(error.message, null);
          } else {
            callback(null, agent_data);
          }
        });
      } else {
        callback(null, agent_data);
      }
    });
  } else {
    callback('Not valid data were provided', null);
  }
}



function ProcessDisconnection(db, agent) {
  const message = String(agent.hostname) + ' disconnected. It may connect again!';
  const not_schema = schemas.getNotificationSchema(message, 'red');
  db_utils.InsertNotifications(db, not_schema, (error) => {
    if (error) {
      console.error(error);
    }
  });

  // Make agent down (offline).
  const agents_col = db.collection(constants.agents_col);
  const query = {_id: agent.id};
  const update = {};
  update['last_update'] = (new Date()).getTime();
  update['status'] = 'down';
  agents_col.updateOne(query, {$set: update}, (error) => {
    if (error) {
      console.error(error.message);
    }
  });
}



function UpdateDevicesData(agent_devices, ws_data, vlan_name) {
  const UpdateDeviceCurrentData = function (current_data, websocket_data) {
    // TODO Notify if an IP, MAC or hostname have been changed.
    current_data.ip = String(websocket_data.ip);
    current_data.hostname = String(websocket_data.hostname);
    if (!websocket_data.hostname) {
      current_data.hostname = websocket_data.ip;
    }

    current_data.bandwidth = Number(websocket_data.bandwidth);
    if (!current_data.bandwidth) {
      current_data.bandwidth = 0;
    }

    current_data.iface = String(websocket_data.iface);
    current_data.last_update = Number(websocket_data.last_update);
    current_data.open_tcp_ports = String(websocket_data.open_tcp_ports);
    current_data.last_tcp_update = Number(websocket_data.last_tcp_update);
    current_data.open_udp_ports = String(websocket_data.open_udp_ports);
    current_data.last_udp_update = Number(websocket_data.last_udp_update);

    return current_data;
  };


  for (let [mac, data] of Object.entries(ws_data)) {
    mac = String(mac);
    if (utils.HasKey(agent_devices, mac)) {
      agent_devices[mac] = UpdateDeviceCurrentData(agent_devices[mac], data);
    } else {
      agent_devices[mac] = schemas.getDeviceSchema(mac, data, vlan_name);
    }
  }

  return agent_devices;
}



function ProcessDevicesData(db, ws_data, vlan_name) {
  const agents_col = db.collection(constants.agents_col);
  const query = {_id: ws_data.agent_id};

  agents_col.findOne(query, (error, result) => {
    if (!error && result) {
      const current_devices = result.visible_devices;
      const updated_data = UpdateDevicesData(current_devices, ws_data.data, vlan_name);

      const update = {};
      update['last_update'] = (new Date()).getTime();
      update['visible_devices'] = updated_data;
      update['bandwidth'] = ws_data.agent_bandwidth || 0;
      agents_col.updateOne(query, {$set: update}, (error) => {
        if (error) {
          console.error(error.message);
        }
      });
    } else if (!result) {
      // This should not happen. If it happens it means that unregistered
      // Agent is sending data.
      console.error('Error: This should not happen');
    } else {
      console.error(error.message);
    }
  });
}



function UpdateInterfaceData(db, agent_id, ws_data, vlan_name, callback) {
  const ifaces_data_col = db.collection(constants.ifaces_data_col);
  const query = {_id: agent_id};
  ifaces_data_col.findOne(query, (error, result) => {
    if (!error) {
      if (result) {
        const update = {};
        update['last_update'] = (new Date()).getTime();
        update['ifaces_data'] = ws_data;
        ifaces_data_col.updateOne(query, {$set: update}, (error) => {
          if (error) {
            callback(error.message, null);
          } else {
            callback(null, 'ok');
          }
        });
      } else {
        const ifaces_data_schema = schemas.getIfacesDataSchema(agent_id, ws_data, vlan_name);
        ifaces_data_col.insertOne(ifaces_data_schema, (error) => {
          if (error) {
            callback(error.message, null);
          } else {
            callback(null, 'ok');
          }
        });
      }
    } else {
      callback(error.message, null);
    }
  });
}


// TODO Function needs to be optimized.
function ProcessInterfaceData(db, ws_data, vlan_name) {
  const agent_id = ws_data.agent_id;
  ws_data = ws_data.data;

  UpdateInterfaceData(db, agent_id, ws_data, vlan_name, (error) => {
    if (!error) {
      utils.UpdateVlanTrafficDataChart(db, vlan_name, (error) => {
        if (error) {
          console.error(error);
        }
      });

      const agents_col = db.collection(constants.agents_col);
      const query = {_id: agent_id};
      agents_col.findOne(query, (error, result) => {
        const agent_hostname = result.hostname;
        utils.UpdateNodeTrafficDataChart(db, agent_id, agent_hostname, vlan_name, (error) => {
          if (error) {
            console.error(error);
          }
        });
      });
    } else {
      console.error(error);
    }
  });
}



function ProcessLinkData(db, ws_data, vlan_name) {
  // TODO verify received data.
  const agent_id = ws_data.agent_id;
  const link_data_list = ws_data.data;

  // An ID is a value of MD5(src_id + dst_id). If the result already exist then add
  // _1 to hashed value and check. Continue increment (_2, _3, ...) it until value
  // does not exist. An ID is needed for front-end side.
  const getUniqueIDOfLink = function (link_ids, src_id, dst_id) {
    const concat_str = src_id + dst_id;
    let id = crypto.createHash('md5').update(concat_str).digest('hex');
    if (utils.HasKey(link_ids, id)) {
      let number = 1;
      while (utils.HasKey(link_ids, id)) {
        id = id + '_' + String(number);
        number++;
      }
    }

    return id;
  };


  const HasTheSameSrcAndDstIP = function (arr, src_ip, dst_ip) {
    if (arr.length < 1) {
      return -1;
    }
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].src_ip === src_ip && arr[i].dst_ip === dst_ip) {
        return i;
      }
    }

    return -1;
  };


  const latest_link_data = [];

  // Iterate over array and get the most updated data as I may get the same
  // source and destination, but different timestamp.
  for (let i = 0; i < link_data_list.length; i++) {
    const tmp_data = link_data_list[i];
    const src_ip = tmp_data.src_ip;
    const dst_ip = tmp_data.dst_ip;
    const current_utc_millisec = new Date(tmp_data.timestamp).getTime();

    // TODO It is possible to optimize complexity by using extra memory.

    const idx = HasTheSameSrcAndDstIP(latest_link_data, src_ip, dst_ip);
    if (idx >= 0) {
      const prev_utc_millisec = new Date(latest_link_data[idx].timestamp).getTime();
      if (current_utc_millisec > prev_utc_millisec) {
        latest_link_data[idx] = tmp_data;
      }
    } else {
      latest_link_data.push(tmp_data);
    }
  }

  // TODO I have to save all link data to another collection in order to have
  // time measurement. Better to save src_mac as an ID and 'attribute' as value.

  const agents_col = db.collection(constants.agents_col);
  const ifaces_data_col = db.collection(constants.ifaces_data_col);
  let query = {vlan: vlan_name};

  agents_col.find(query).toArray((error, result) => {
    if (!error && result && result.length > 0) {
      const agents_data = utils.ConvertAgentsArrayToDic(result);

      ifaces_data_col.find(query).toArray((error, ifaces_data) => {
        if (!error && ifaces_data && ifaces_data.length > 0) {
          const link_ids = {};
          for (let i = 0; i < latest_link_data.length; i++) {
            const temp_data = latest_link_data[i];
            temp_data['src_id'] = utils.getDeviceID(agents_data, ifaces_data, latest_link_data[i].src_ip);
            temp_data['dst_id'] = utils.getDeviceID(agents_data, ifaces_data, latest_link_data[i].dst_ip);
            temp_data['attributes'] = JSON.parse(temp_data['attributes']);

            const id = getUniqueIDOfLink(link_ids, temp_data['src_id'], temp_data['dst_id']);
            temp_data['id'] = id;
            link_ids[id] = 1;

            // By deafult it is set 'up'.
            const link_quality = Number(temp_data['attributes']['linkQuality']);
            if (link_quality <= 0.75 && link_quality >= 0.5) {
              temp_data['status'] = 'low';
            } else if (link_quality < 0.5) {
              temp_data['status'] = 'down';
            }

            latest_link_data[i] = temp_data;
          }

          const update = {};
          update['last_update'] = (new Date()).getTime();
          update['link_data'] = latest_link_data;
          query = {_id: agent_id};
          agents_col.updateOne(query, {$set: update}, (error) => {
            if (error) {
              console.error(error.message);
            }
          });
        } else if (error) {
          console.error(error.message);
        }
      });
    } else if (error) {
      console.error(error.message);
    }
  });
}



function ProcessIDSData(db, ws_data, vlan_name) {
  const agent_id = ws_data.agent_id;
  const ws_ids_data_list = ws_data.data;

  const UpdateIDSEvents = function (vlan, ids_events_list, callback) {
    const ids_data_col = db.collection(constants.ids_data_col);
    const query = {_id: agent_id};
    ids_data_col.findOne(query, (error, result) => {
      if (error) {
        callback(error.message);
      } else if (result) {
        const existing_list = result.ids_events;
        const new_ids_list = existing_list.concat(ids_events_list);
        const update = {};
        update['last_update'] = new Date();
        update['ids_events'] = new_ids_list;
        ids_data_col.updateOne(query, {$set: update}, (error) => {
          if (error) {
            callback(error.message);
          } else {
            callback(null);
          }
        });
      } else {
        const ids_events_schema = schemas.getIDSEventsSchema(agent_id, vlan, ids_events_list);
        ids_data_col.insertOne(ids_events_schema, (error) => {
          if (error) {
            callback(error.message);
          } else {
            callback(null);
          }
        });
      }
    });
  };


  const agents_col = db.collection(constants.agents_col);
  const query = {_id: agent_id};
  agents_col.findOne(query, (error, result) => {
    if (error) {
      console.error(error.message);
    } else if (result) {
      for (let i = 0; i < ws_ids_data_list.length; i++) {
        ws_ids_data_list[i]['vlan'] = vlan_name;
        ws_ids_data_list[i]['phx_box'] = result.hostname;
        // Check if blocked_on is an integer number, otherwise initialize 0.
        if (!Number.isInteger(ws_ids_data_list[i]['blocked_on'])) {
          ws_ids_data_list[i]['blocked_on'] = 0;
        }
      }

      UpdateIDSEvents(vlan_name, ws_ids_data_list, (error) => {
        if (error) {
          console.error(error);
        }
      });
    } else {
      console.error('This should not happen');
    }
  });
}


// Function parses and processes received websocket data.
//
// Arguments:
// - db: MongoDB database client.
// - data: Received message.
// - vlan_name: VLAN name in string format.
function ProcessWebsocketData(db, ws_data, vlan_name) {
  ws_data = verify.IsValidJSON(ws_data);
  if (ws_data === null) {
    return;
  }

  if (!utils.HasKey(ws_data, 'msg_type') ||
      !utils.HasKey(ws_data, 'data') ||
      !utils.HasKey(ws_data, 'agent_id')) {
    return;
  }

  if (!ws_data.data || !ws_data.agent_id) {
    return;
  }

  switch (ws_data.msg_type) {
    case 'devices_data': {
      ProcessDevicesData(db, ws_data, vlan_name);
      break;
    }

    case 'link_data': {
      ProcessLinkData(db, ws_data, vlan_name);
      break;
    }

    case 'ids_data': {
      ProcessIDSData(db, ws_data, vlan_name);
      break;
    }

    case 'iface_data': {
      ProcessInterfaceData(db, ws_data, vlan_name);
      break;
    }

    default: {
      const msg = 'Skip';
    }
  }
}

module.exports.ProcessWebsocketData = ProcessWebsocketData;
module.exports.ProcessWebsocketConnection = ProcessWebsocketConnection;
module.exports.ProcessDisconnection = ProcessDisconnection;

