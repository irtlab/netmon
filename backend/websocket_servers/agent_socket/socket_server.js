/**
 * websocket_servers/agent_socket/socket_server.js
 *
 * Authors:
 *   Columbia University, the Internet Real-Time Lab (IRT Lab). 2018-2019.
 *
 * Description:
 * File provides websocket functionality to handle/listen coming messages from
 * PNode socket clients.
 *
 */

const assert = require('assert');
const stdio = require('stdio');
// const udp = require('dgram');

const process_data = require('./process_data');
const constants = require('../../common/constants.js');
const ConnectToMongoDB = require('../../db/mongodb_connect');


const args = process.argv;
const opts = stdio.getopt({
  vlan: {
    key: 'n', args: 1, description: 'VLAN name', mandatory: true
  },
  port: {
    key: 'p', args: 1, description: 'Port number to listen on', default: process.env['PORT'] || 8000
  },
  db: {
    key: 'd', args: 1, description: 'MongoDB database URL', default: process.env['MONGODB_URL'] || constants.default_db_url
  },
  host: {
    key: 'h', args: 1, description: 'Override MongoDB hostname for TLS certificate validation', default: ''
  },
  tls: {key: 't', description: 'Enable SSL/TLS'},
  crt: {
    key: 'c', args: 1, description: 'Path to a X.509 server certificate', default: constants.tls_certificate_file
  },
  key: {
    key: 'k', args: 1, description: 'Path to a private key', default: constants.tls_private_key_file
  }
});


if (!opts.vlan) {
  console.log('VLAN name must not be empty');
  process.exit(1);
}

if (opts.vlan.includes('.') || opts.vlan.includes('$')) {
  console.log('VLAN name must not contain dot or $ sign.');
  process.exit(1);
}
console.log('VLAN name: %s', opts.vlan);


opts.port = parseInt(opts.port);
if (opts.port < 0 || opts.port > 65535) {
  console.log('Error: Invalid port number \'%s\'', opts.port);
  process.exit(1);
}

let http_server;

console.log('TLS/SSL is %s', opts.tls ? 'enabled' : 'disabled');
if (opts.tls) {
  console.log('Loading public key certificate from file %s', opts.crt);
  console.log('Loading private key from file %s', opts.key);

  const fs = require('fs');

  http_server = require('https').createServer({
    cert: fs.readFileSync(opts.crt),
    key: fs.readFileSync(opts.key)
  });
} else {
  http_server = require('http').createServer();
}


// Create UDP server in order to sync timestamp with agents.
/*
const udp_server = udp.createSocket('udp4');

function ProcessUDPServerData(db) {

  udp_server.on('listening', function() {
    const address = udp_server.address();
    console.log('UDP server is listening at port %d', address.port);
    console.log('UDP server ip:', address.ip_addr);
    console.log('UDP server is IP4/IP6:', address.family);
  });

  udp_server.on('message', function(msg_bytes, info) {
    const buff = new Buffer(msg_bytes);
    let msg = JSON.parse(buff.toString('utf8'));

    // console.log('Data received from client:', msg);
    // console.log('Received %d bytes from %s:%d\n', msg.length, info.address, info.port);

    // TODO process received data.

    const unix_epoch_milliseconds = String((new Date()).getTime());
    udp_server.send(unix_epoch_milliseconds, info.port, info.address, function(error) {
      if (error) {
        console.error('UDP server error: ', error);
      }
    });
  });

  udp_server.on('error', function(error) {
    console.error('UDP server error: ', error);
  });

  udp_server.on('close', function() {
    console.log('UDP Socket is closed!');
  });
}
*/


// Function runs WebSocket server in order to collect/listen data from different
// PNodes parses recived data and stores on the MongoDB database.
//
// Arguments:
// - db: MongoDB database client.
// - wss: (ws socket) Websocket object.
// - vlan_name: VLAN name in string format.
function RunWebSocketServer(db, wss, vlan_name) {
  console.log('Data collection Websocket server is running ...................................');

  // Variable for storing socket session.
  const socket_clients = {};

  wss.on('connection', (ws, req) => {
    process_data.ProcessWebsocketConnection(db, req, vlan_name, (error, client) => {
      if (error) {
        if (ws.readyState === 1) ws.close();
      } else {
        socket_clients[client.id] = client.id;
        console.log(client.id, 'device connected');


        ws.on('message', (message) => {
          ws.send('ok');
          process_data.ProcessWebsocketData(db, message, vlan_name);
        });


        ws.on('close', () => {
          if (client.id && socket_clients) {
            console.log(client.id, 'disconnected');
            process_data.ProcessDisconnection(db, client);
            delete socket_clients[client.id];
          }
        });


        ws.on('error', (error) => {
          console.error('Websocket error: ' + error);
        });
      }
    });
  });
}

console.log('Connecting to MongoDB %s', opts.db);
ConnectToMongoDB(opts.db, (error, db) => {
  assert.equal(null, error);

  const WebSocketServer = require('ws').Server;
  const wss = new WebSocketServer({ server: http_server });

  RunWebSocketServer(db, wss, opts.vlan);

  http_server.listen(opts.port, () => {
    console.log('Listening on TCP port %d', opts.port);
  });

  // udp_server.bind(5005);
  // ProcessUDPServerData(db);
}, opts.host);

