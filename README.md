# Network Monitoring Tool
The Network Monitoring Tool (Netmon) aims to analyse a network and provide
real-time data to the web interface with as much detail as possible. The provided
information is useful for evaluating both security events and troubleshooting
network security issues.


## System Architecture and Directory Structure
For detailed technical specification have a look at the
[/spec](https://gitlab.com/phxnet/monitor/tree/master/spec) directory.


##### Directory Structure
```
├── agent       : Network monitoring agent.
├── backend     : Back-end server, Websocket server and MongoDB database.
├── frontend    : Front-end (web interface).
├── spec        : Technical specification documents.
├── README
├── .gitignore
```

## Build & Run
Every component must be built and run separately (we recommend to use docker
containers).<br/>
To build and run the agent, see:
[agent/README.md](https://gitlab.com/phxnet/monitor/blob/master/agent/README.md).<br/>
To build and run the backend server and websocket server, see:
[backend/README.md](https://gitlab.com/phxnet/monitor/blob/master/backend/README.md)<br/>
To build and setup the frontend (web interface), see:
[frontend/README.md](https://gitlab.com/phxnet/monitor/blob/master/frontend/README.md)<br/>


## Contributions
Contributions are welcome and can be made by submitting GitHub pull requests to this repository. In general,
the source code follows [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
and and [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html).


## License
This source code is available to everyone under the standard
[MIT LICENSE](https://github.com/irtlab/netmon/blob/master/LICENSE).
