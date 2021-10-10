export default {
  socketStatus(state) {
    return state.socketStatus;
  },

  deviceInfo(state) {
    return state.devicesInfo;
  },

  devices(state) {
    return state.devices;
  },

  getActiveTab(state) {
    if (!state.activeTab || state.activeTab === 'null') {
      return false;
    }
    return state.activeTab;
  },

  networks(state) {
    return state.networks;
  },

  traffic(state) {
    return state.traffic;
  },

  IDSEvents(state) {
    return state.idsEvents;
  },

  notifications(state) {
    return Object.assign([], state.notifications).reverse();
  },

  vlanTypes(state) {
    return state.vlanTypes;
  }
};

