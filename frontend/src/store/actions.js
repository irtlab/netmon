import axios from 'axios';

export default {
  getNetworkTopology(context, params) {
    return new Promise((resolve) => {
      axios.get(
        window._devMonitConfig.api_prefix + 'get_network_topology_data'
      ).then(({data}) => {
        if (data) {
          resolve(data.data);
          context.commit('setTopology', data.data);
        }
      });
    });
  },

  getDevices(context, params) {
    return new Promise((resolve, reject) => {
      axios.get(
        window._devMonitConfig.api_prefix + 'get_devices_data'
      ).then(({data}) => {
        if (data) {
          context.commit('setDevices', data.data);
          resolve();
        }
      });
    });
  },

  getIDSEvents(context, params) {
    return axios.get(
      window._devMonitConfig.api_prefix + 'get_ids_events_data'
    ).then(({data}) => {
      if (data) {
        context.commit('setIDSEvents', data.data);
      }
    });
  },

  getTraffic(context, params) {
    return axios.get(
      window._devMonitConfig.api_prefix + 'get_traffic_data'
    ).then(({data}) => {
      if (data) {
        context.commit('setTraffic', data.data);
      }
    });
  },

  getNotifications(context, params) {
    try {
      axios.get(
        window._devMonitConfig.api_prefix + 'get_notifications_data'
      ).then(({data}) => {
        let notifications = data.data;
        if (typeof notifications === 'string') {
          notifications = JSON.parse(notifications);
        }
        if (notifications) {
          context.commit('setNotifications', notifications);
        }
      });
    } catch (e) {
      console.log(e);
    }
  },

  devicesFromSocket(context, device) {
    context.commit('setDevices', device);
  },

  IDSEventsFromSocket(context, data) {
    context.commit('setIDSEvents', data);
  },

  receiveTraffic(context, params) {
    context.commit('setTraffic', params);
  },

  trafficDismissed(context, idx) {
    context.commit('dismissTrafficItem', idx);
  },

  receiveNotification(context, data) {
    context.commit('setNotifications', data);
  },

  notificationViewed(context, idx) {
    context.commit('notificationViewed', idx);
  },

  topologyFromSocket(context, params) {
    if (params) {
      context.commit('setTopology', params);
    }
  },

  socketStatus(context, params) {
    if (params) {
      context.commit('socketStatus', params);
    }
  }
};
