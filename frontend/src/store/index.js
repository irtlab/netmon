import Vue from 'vue';
import Vuex from 'vuex';

import getters from './getters';
import mutations from './mutations';
import actions from './actions';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    notificationsLimit: 500,
    devices: null,
    traffic: [],
    networks: {},
    notifications: [],
    idsEvents: [],
    networkTopology: null,
    vlanTypes: [],
    activeTab: null,
    devicesInfo: {},
    socketStatus: null
  },

  actions: actions,
  mutations: mutations,
  getters: getters
});
