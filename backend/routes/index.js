/**
 * routes/index.js
 *
 * Authors:
 *   Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.
 *
 * Description:
 * File provides REST API functionality.
 *
 */

const express = require('express');

const db_utils = require('../utils/db_utils');
const message = require('../utils/messages');

const router = express.Router();


// GET home page.
router.get('/', (req, res) => {
  res.render('index', {title: 'Express'});
});



router.get('/get_devices_data', (request, response) => {
  const db = request.app.get('mongo_db');
  db_utils.getDevicesData(db, (error, result) => {
    if (error) {
      const user_res = message.getResponseObj('error', error);
      response.send(user_res);
    } else {
      const user_res = message.getResponseObj('ok', '', result);
      response.send(user_res);
    }
  });
});



router.get('/get_network_topology_data', (request, response) => {
  const db = request.app.get('mongo_db');
  db_utils.getNetworkTopologyData(db, (error, result) => {
    if (error) {
      const user_res = message.getResponseObj('error', error);
      response.send(user_res);
    } else {
      const user_res = message.getResponseObj('ok', '', result);
      response.send(user_res);
    }
  });
});



router.get('/get_traffic_data', (request, response) => {
  const db = request.app.get('mongo_db');
  db_utils.getTrafficData(db, (error, result) => {
    if (error) {
      const user_res = message.getResponseObj('error', error);
      response.send(user_res);
    } else {
      const user_res = message.getResponseObj('ok', '', result);
      response.send(user_res);
    }
  });
});



router.get('/get_ids_events_data', (request, response) => {
  const db = request.app.get('mongo_db');
  db_utils.getIDSEventsData(db, (error, result) => {
    if (error) {
      const user_res = message.getResponseObj('error', error);
      response.send(user_res);
    } else {
      const user_res = message.getResponseObj('ok', '', result);
      response.send(user_res);
    }
  });
});



router.get('/get_notifications_data', (request, response) => {
  const db = request.app.get('mongo_db');
  db_utils.getNotificationsData(db, (error, result) => {
    if (error) {
      const user_res = message.getResponseObj('error', error);
      response.send(user_res);
    } else {
      const user_res = message.getResponseObj('ok', '', result);
      response.send(user_res);
    }
  });
});

module.exports = router;

