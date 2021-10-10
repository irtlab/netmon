/**
 * websocket/expressjs_socket.js
 *
 * Authors:
 *   Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.
 *
 * Description:
 *   Module provides Websocket API and Command Line Interface.
 */

const assert = require('assert');
const stdio = require('stdio');
const http = require('http');
const socket_io = require('socket.io');

const ConnectToMongoDB = require('../../db/mongodb_connect');
const constants = require('../../common/constants');
const utils = require('../../utils/utils');
const sd = require('./sending_data');


const opts = stdio.getopt({
  port: {
    key: 'p', args: 1, description: 'Port number to listen on', default: process.env['PORT'] || 5000
  },
  host: {
    key: 'h', args: 1, description: 'Override MongoDB hostname for TLS certificate validation', default: ''
  },
  db: {
    key: 'd', args: 1, description: 'MongoDB database URL', default: process.env['MONGODB_URL'] || constants.default_db_url
  },
});


opts.port = parseInt(opts.port);
if (opts.port < 0 || opts.port > 65535) {
  console.log('Error: Invalid port number \'%s\'', opts.port);
  process.exit(1);
}


// Global variables for storing socket session and timestamp.
function getTS() { return '[' + utils.getUTCISOFormat() + ']'; }
const socket_clients = {};


async function SendDataToUsers(db) {
  while (1) {
    try {
      // Do not send data if there is not connected user.
      if (Object.keys(socket_clients).length !== 0) {
        sd.SendDevicesData(db, socket_clients);
        sd.SendNetworkTopologyData(db, socket_clients);
        sd.SendTrafficData(db, socket_clients);
        sd.SendNotificationData(db, socket_clients);
        sd.SendIDSEventsData(db, socket_clients);
      }
    } catch (e) {
      console.error(e);
    }

    await utils.Sleep(constants.data_sending_time_interval);
  }
}



function ListenWebSocketServer(db, socket_io_server) {
  socket_io_server.on('connection', (socket) => {
    if (socket && socket.id) {
      socket_clients[socket.id] = socket;
    }

    console.log(getTS(), 'A new socket connection. Socket ID:', socket.id);

    // When user disconnects I must delete/clean socket session.
    socket.on('disconnect', () => {
      if (socket.id && socket_clients) {
        console.log(getTS(), socket.id, 'disconnected.');
        delete socket_clients[socket.id];
      } else {
        console.error('Undefined ExpressJS socket.');
      }
    });
  });
}



console.log(getTS(), 'Connecting to MongoDB. URL:', opts.db);
ConnectToMongoDB(opts.db, (error, db) => {
  assert.equal(null, error);

  const socket_server = http.createServer();
  socket_server.listen(opts.port);
  const socket_io_server = socket_io(socket_server);

  // Function sends data to connected users. It is going to run always.
  SendDataToUsers(db);

  // Run ExpressJS WebSocket server. It is going to run/listen always.
  ListenWebSocketServer(db, socket_io_server);
}, opts.host);

