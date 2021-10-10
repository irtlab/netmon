# Backend Server & Websocket Server
Even though Backend server and Websocket server are in the same directory, their
building and running are separate.

### Requirements
For both minimal software requirements are [Node.js](https://nodejs.org/en/) and
[MongoDB](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)
database. It is recommended to install the latest versions.

### Build Backend Server & Websocket Server
Go to `/var/www/` directory and download source code using `git clone` command,
and then install required libraries using `npm install` command.<br/>

    cd /var/www/
    git clone https://gitlab.com/phxnet/monitor.git
    cd monitor/backend
    npm install
    
### Run Backend Server
Backend server consists of two parts: REST API and Websocket API.
They have to be run separately. From `<root_directory/backend>` run following
two commands (for production mode it is recommended to use
[PM2](http://pm2.keymetrics.io/)).<br/>

    pm2 start bin/www
    pm2 start websocket_servers/expressjs/expressjs_socket.js

In development mode you can run just like a node script. For example,

    node bin/www
    node websocket_servers/expressjs/expressjs_socket.js

### Run Websocket Server
Before running see description of command line arguments.<br/>

`--vlan:` VLAN name (required).<br/>
`--port:` Port number to listen on. By default it is set to 8000.<br/>
`--db:` MongoDB database URL. By default it is set to localhost.<br/>
`--host:` Override MongoDB hostname for TLS certificate validation.<br/>
`--tls:` Enable SSL/TLS.<br/>
`--crt:` Path to a X.509 server certificate.<br/>
`--key:` Path to a private key.<br/>

For production mode it is recommended to use [PM2](http://pm2.keymetrics.io/).

    pm2 start websocket_servers/agent_socket/socket_server.js --vlan voip

In development mode you can run just like a node script. For example,

    node websocket_servers/agent_socket/socket_server.js --vlan voip
