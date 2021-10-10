export default {
  saveTopology(state, params) {
    state.networkTopology = params;
  },

  setTopology(state, data) {
    state.networks = data;
  },

  setInfo(state, info) {
    state.devicesInfo = info;
  },

  setNotifications(state, notifications) {
    state.notifications = notifications;
  },

  setNotification(state, notification) {
    if (notification.length + state.notifications.length > state.notificationsLimit) {
      if (state.notifications.length > notification.length) {
        state.notifications = (state.notifications.splice(notification.length)).concat(notification);
      }
    } else {
      state.notifications = state.notifications.concat(notification);
    }
  },

  setDevices(state, params) {
    state.devices = params;
  },

  setTraffic(state, traffic) {
    state.traffic = traffic;
  },

  setIDSEvents(state, data) {
    state.idsEvents = data;
  },

  dismissTrafficItem(state, idx) {
    state.traffic.splice(idx, 1);
  },

  notificationViewed(state, idx) {
    state.notifications.splice(idx, 1);
  },

  setVlanTypes(state, data) {
    state.vlanTypes = data;
  },

  setActiveTab(state, data) {
    state.activeTab = data;
  },

  socketStatus(state, data) {
    state.socketStatus = data;
  }
};
