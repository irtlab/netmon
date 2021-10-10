/**
 * websocket/sending_data.js
 *
 * Authors:
 *   Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.
 *
 * Description:
 *   Module provides a functionality to send data to the user.
 */

const db_utils = require('../../utils/db_utils');
const utils = require('../../utils/utils');


function SendWebsocketData(socket_clients, socket_msg, data) {
  if (socket_clients) {
    for (const socket_id of Object.keys(socket_clients)) {
      if (utils.HasKey(socket_clients, socket_id)) {
        socket_clients[socket_id].compress(true).emit(socket_msg, {data: data});
      }
    }
  }
}



function SendDevicesData(db, socket_clients) {
  db_utils.getDevicesData(db, (error, result) => {
    if (!error) {
      SendWebsocketData(socket_clients, 'ws_devices_data', result);
    }
  });
}



function SendNetworkTopologyData(db, socket_clients) {
  db_utils.getNetworkTopologyData(db, (error, result) => {
    if (!error) {
      SendWebsocketData(socket_clients, 'ws_network_topology_data', result);
    }
  });
}



function SendIDSEventsData(db, socket_clients) {
  db_utils.getIDSEventsData(db, (error, result) => {
    if (!error) {
      SendWebsocketData(socket_clients, 'ws_ids_events_data', result);
    }
  });
}



function SendTrafficData(db, socket_clients) {
  db_utils.getTrafficData(db, (error, result) => {
    if (!error) {
      SendWebsocketData(socket_clients, 'ws_traffic_data', result);
    }
  });
}



function SendNotificationData(db, socket_clients) {
  db_utils.getNotificationsData(db, (error, result) => {
    if (!error) {
      SendWebsocketData(socket_clients, 'ws_notifications_data', result);
    }
  });
}

module.exports.SendDevicesData = SendDevicesData;
module.exports.SendNetworkTopologyData = SendNetworkTopologyData;
module.exports.SendIDSEventsData = SendIDSEventsData;
module.exports.SendTrafficData = SendTrafficData;
module.exports.SendNotificationData = SendNotificationData;

