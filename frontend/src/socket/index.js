import io from 'socket.io-client';
import store from '../store/index.js';

const Socket = {
  io: null,
  store,
  init() {
    this.io = io(window._devMonitConfig.socketio_prefix);
    this.io.on('connect', () => {
      this.callback_socket_status('connected');
    });
    this.io.on('disconnect', () => {
      this.callback_socket_status('disconnected');
    });
    this.io.on('ws_devices_data', (data) => {
      this.callback_devices(data.data);
    });
    this.io.on('ws_notifications_data', (data) => {
      this.callback_notifications(data.data);
    });
    this.io.on('ws_network_topology_data', (data) => {
      this.callback_network_topology(data.data);
    });
    this.io.on('ws_traffic_data', (data) => {
      this.callback_traffic(data.data);
    });
    this.io.on('ws_get_ids_events_data', (data) => {
      this.callback_ids_events(data.data);
    });
  },

  newMessage(params) {
    if (typeof this['callback_' + params.type] !== 'function') {
      console.log(params.type, 'method not found');
    }
    this['callback_' + params.type](params.data);
  },

  callback_socket_status(params) {
    store.dispatch('socketStatus', params);
  },

  callback_devices(params) {
    store.dispatch('devicesFromSocket', params);
  },

  callback_network_topology(params) {
    store.dispatch('topologyFromSocket', params);
  },

  callback_ids_events(params) {
    store.dispatch('IDSEventsFromSocket', params);
  },

  callback_notifications(params) {
    store.dispatch('receiveNotification', params);
  },
  callback_traffic(params) {
    store.dispatch('receiveTraffic', params);
  }
};

Socket.init();
export default Socket;

