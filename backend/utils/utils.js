/*
 * utils/utils.js
 *
 * Authors:
 *   Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.
 *
 * Description:
 *   File provides utility functions for project.
 */

const moment = require('moment');
const constants = require('../common/constants');
const schemas = require('../utils/schemas');


// Returns a Promise that resolves after milliseconds.
function Sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}



// Function returns UTC date in ISO format (ISO 8601), which is always 24 or 27
// characters long (YYYY-MM-DDTHH:mm:ss.sssZ). The timezone is always zero UTC
// offset, as denoted by the suffix "Z".
function getUTCISOFormat() {
  const utc_iso_format = (new Date()).toISOString();
  return utc_iso_format;
}



// Function checks if given object has a provided key/property or not.
//
// See ESLint rules for details:
// https://eslint.org/docs/rules/no-prototype-builtins
//
// Arguments:
// - object: JSON object.
// - key: Provide key, which will be checked.
//
// Returns true if an object has 'key' property, otherwise false.
function HasKey(object, key) {
  return Object.prototype.hasOwnProperty.call(object, String(key));
}



function ConvertUTCToLocal(utc_date) {
  const local = moment.parseZone(utc_date).local().format('YYYY MMM DD, HH:mm:ss');
  return String(local);
}



// Function finds an element in array, if elemen is found an index will be
// returned, otherwise -1.
function FindInArray(array, element) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === element) {
      return i;
    }
  }

  return -1;
}



function ConvertAgentsArrayToDic(agent_list) {
  const agent_dic = {};
  for (let i = 0; i < agent_list.length; i++) {
    const id = agent_list[i].id;
    agent_dic[id] = id;
  }

  return agent_dic;
}



// TODO I have to improve complexity.
function getDeviceID(agents_data, ifaces_data, link_ip) {
  for (let i = 0; i < ifaces_data.length; i++) {
    const agent_id = ifaces_data[i]._id;
    const agent_ifaces_data = ifaces_data[i].ifaces_data;
    for (const iface of Object.values(agent_ifaces_data)) {
      const ip_list = iface.ip;
      if (ip_list && ip_list.includes(link_ip)) {
        return agents_data[agent_id];
      }
    }
  }

  return link_ip;
}



function getVlanTrafficChartDate() {
  const utc_now = new Date();
  const year = utc_now.getUTCFullYear();
  const month = utc_now.getUTCMonth() + 1;
  const day = utc_now.getUTCDate();
  const date_format = String(month) + '/' + String(day) + '/' + String(year);

  return date_format;
}



// Function updates VLAN traffic data timeseries.
//
// Arguments:
// - all_time_traffic: All time RX and TX values in bytes.
// - db_data: Queried timeseries data from DB.
//
// Note that on database I store 'value' and 'date' arrays.
// See getVlanTrafficTsSchema() function in schemas.js file.
//
// 'date[i]' contains timestamp and 'value[i]' corresponding RX and TX.
//
// Returns updated 'value' and 'date' arrays.
function UpdateVlanChart(all_time_traffic, db_data) {
  const getUpdatedRxTx = function (total_traffic, value, idx) {
    const today_rx = Math.abs(total_traffic.rx_bytes - value[idx - 1].rx);
    const today_tx = Math.abs(total_traffic.tx_bytes - value[idx - 1].tx);
    return {rx: today_rx, tx: today_tx};
  };
  // If we reach here it means that 'value' and 'date' arrays contain
  // at least one element. So, value[0] and date[0] exist.
  const value = db_data.time_series.value;
  const date = db_data.time_series.date;

  // Format is MM/DD/YYYY.
  const utc_date_str = getVlanTrafficChartDate();
  let idx = FindInArray(date, utc_date_str);
  if (idx > 0) {
    value[idx] = getUpdatedRxTx(all_time_traffic, value, idx);
  } else if (idx === -1) {
    idx = date.length;
    const new_day_rx_tx = getUpdatedRxTx(all_time_traffic, value, idx);
    value.push(new_day_rx_tx);
    date.push(utc_date_str);
  } else {
    // If idx === 0
    value[idx] = {rx: all_time_traffic.rx_bytes, tx: all_time_traffic.tx_bytes};
  }

  const updated_data = {
    value,
    date
  };

  return updated_data;
}



// TODO Currently as a database I use MongoDB, but it is not an efficient
// way to store timeseries data. I should use InfluxDB.
function UpdateVlanTrafficDataChart(db, vlan_name, callback) {
  const vlan_traffic_ts_col = db.collection(constants.vlan_traffic_ts_col);
  const ifaces_data_col = db.collection(constants.ifaces_data_col);
  const query = {vlan: vlan_name};

  ifaces_data_col.find(query).toArray((error, result) => {
    if (!error && result && result.length > 0) {
      let all_time_traffic = null;
      // Iterate over VLAN agents.
      for (let i = 0; i < result.length; i++) {
        const ifaces_dic = result[i].ifaces_data;
        // One Agent can have more than one network interfaces.
        for (const iface_data of Object.values(ifaces_dic)) {
          if (all_time_traffic !== null) {
            all_time_traffic.tx_bytes += Number(iface_data.tx_bytes);
            all_time_traffic.tx_packets += Number(iface_data.tx_packets);
            all_time_traffic.tx_dropped += Number(iface_data.tx_dropped);
            all_time_traffic.rx_bytes += Number(iface_data.rx_bytes);
            all_time_traffic.rx_packets += Number(iface_data.rx_packets);
            all_time_traffic.rx_dropped += Number(iface_data.rx_dropped);
          } else {
            all_time_traffic = {};
            all_time_traffic['tx_bytes'] = Number(iface_data.tx_bytes);
            all_time_traffic['tx_packets'] = Number(iface_data.tx_packets);
            all_time_traffic['tx_dropped'] = Number(iface_data.tx_dropped);
            all_time_traffic['rx_bytes'] = Number(iface_data.rx_bytes);
            all_time_traffic['rx_packets'] = Number(iface_data.rx_packets);
            all_time_traffic['rx_dropped'] = Number(iface_data.rx_dropped);
          }
        }
      }


      vlan_traffic_ts_col.findOne(query, (error, result) => {
        if (error) {
          callback(error.message, null);
        } else if (result) {
          const updated_time_series = UpdateVlanChart(all_time_traffic, result);
          const update = {};
          update['total_traffic'] = all_time_traffic;
          update['time_series'] = updated_time_series;
          update['last_update'] = (new Date()).getTime();
          vlan_traffic_ts_col.updateOne(query, {$set: update}, (error) => {
            if (error) {
              callback(error.message, null);
            } else {
              callback(null, 'ok');
            }
          });
        } else {
          const vlan_traffic_ts_schema = schemas.getVlanTrafficTsSchema(all_time_traffic, vlan_name);
          vlan_traffic_ts_col.insertOne(vlan_traffic_ts_schema, (error) => {
            if (error) {
              callback(error.message, null);
            } else {
              callback(null, 'ok');
            }
          });
        }
      });
    } else if (error) {
      callback(error.message, null);
    } else {
      callback('This should not happen. See ProcessInterfaceData function', null);
    }
  });
}



function UpdateNodeChart(all_time_traffic, db_data) {
  const getUpdatedRxTx = function (total_traffic, value, idx) {
    const today_rx = Math.abs(total_traffic.rx_bytes - value[idx - 1].rx);
    const today_tx = Math.abs(total_traffic.tx_bytes - value[idx - 1].tx);
    return {rx: today_rx, tx: today_tx};
  };


  // If we reach here it means that 'value' and 'date' arrays contain
  // at least one element. So, value[0] and date[0] exist.
  const value = db_data.time_series.value;
  const date = db_data.time_series.date;

  // Format is MM/DD/YYYY.
  const utc_date_str = getVlanTrafficChartDate();
  let idx = FindInArray(date, utc_date_str);
  if (idx > 0) {
    value[idx] = getUpdatedRxTx(all_time_traffic, value, idx);
  } else if (idx === -1) {
    idx = date.length;
    const new_day_rx_tx = getUpdatedRxTx(all_time_traffic, value, idx);
    value.push(new_day_rx_tx);
    date.push(utc_date_str);
  } else {
    // If idx === 0
    value[idx] = {rx: all_time_traffic.rx_bytes, tx: all_time_traffic.tx_bytes};
  }

  const updated_data = {
    value,
    date
  };

  return updated_data;
}



function UpdateNodeTrafficDataChart(db, agent_id, agent_hostname, vlan_name, callback) {
  const node_traffic_ts_col = db.collection(constants.node_traffic_ts_col);
  const ifaces_data_col = db.collection(constants.ifaces_data_col);
  const query = {_id: agent_id};

  ifaces_data_col.findOne(query, (error, result) => {
    if (!error && result) {
      let node_latest_traffic = null;
      const ifaces_dic = result.ifaces_data;
      // One Agent can have more than one network interfaces.
      for (const iface_data of Object.values(ifaces_dic)) {
        if (node_latest_traffic !== null) {
          node_latest_traffic.tx_bytes += Number(iface_data.tx_bytes);
          node_latest_traffic.tx_packets += Number(iface_data.tx_packets);
          node_latest_traffic.tx_dropped += Number(iface_data.tx_dropped);
          node_latest_traffic.rx_bytes += Number(iface_data.rx_bytes);
          node_latest_traffic.rx_packets += Number(iface_data.rx_packets);
          node_latest_traffic.rx_dropped += Number(iface_data.rx_dropped);
        } else {
          node_latest_traffic = {};
          node_latest_traffic['tx_bytes'] = Number(iface_data.tx_bytes);
          node_latest_traffic['tx_packets'] = Number(iface_data.tx_packets);
          node_latest_traffic['tx_dropped'] = Number(iface_data.tx_dropped);
          node_latest_traffic['rx_bytes'] = Number(iface_data.rx_bytes);
          node_latest_traffic['rx_packets'] = Number(iface_data.rx_packets);
          node_latest_traffic['rx_dropped'] = Number(iface_data.rx_dropped);
        }
      }


      node_traffic_ts_col.findOne(query, (error, result) => {
        if (error) {
          callback(error.message, null);
        } else if (result) {
          const updated_time_series = UpdateNodeChart(node_latest_traffic, result);
          const update = {};
          update['total_traffic'] = node_latest_traffic;
          update['time_series'] = updated_time_series;
          update['last_update'] = (new Date()).getTime();
          node_traffic_ts_col.updateOne(query, {$set: update}, (error) => {
            if (error) {
              callback(error.message, null);
            } else {
              callback(null, 'ok');
            }
          });
        } else {
          const node_traffic_ts_schema = schemas.getNodeTrafficTsSchema(node_latest_traffic, agent_id, agent_hostname, vlan_name);
          node_traffic_ts_col.insertOne(node_traffic_ts_schema, (error) => {
            if (error) {
              callback(error.message, null);
            } else {
              callback(null, 'ok');
            }
          });
        }
      });
    } else if (error) {
      callback(error.message, null);
    } else {
      callback('This should not happen. See ProcessInterfaceData function', null);
    }
  });
}

module.exports.Sleep = Sleep;
module.exports.getUTCISOFormat = getUTCISOFormat;
module.exports.HasKey = HasKey;
module.exports.ConvertUTCToLocal = ConvertUTCToLocal;
module.exports.ConvertAgentsArrayToDic = ConvertAgentsArrayToDic;
module.exports.getDeviceID = getDeviceID;
module.exports.UpdateNodeTrafficDataChart = UpdateNodeTrafficDataChart;
module.exports.UpdateVlanTrafficDataChart = UpdateVlanTrafficDataChart;
module.exports.getVlanTrafficChartDate = getVlanTrafficChartDate;

