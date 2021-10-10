import Vue from 'vue';
import Router from 'vue-router';

import NetworkMap from '../components/NetworkMap.vue';
import DevicesList from '../components/DevicesList.vue';
import Notifications from '../components/Notifications.vue';
import Traffic from '../components/Traffic.vue';
import IDSEvents from '../components/IDSEvents.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      redirect: '/NetworkMap'
    },
    {
      name: 'NetworkMap',
      path: '/NetworkMap',
      component: NetworkMap
    },
    {
      name: 'Devices',
      path: '/Devices',
      component: DevicesList
    },
    {
      name: 'Notifications',
      path: '/Notifications',
      component: Notifications
    },
    {
      name: 'Traffic',
      path: '/Traffic',
      component: Traffic
    },
    {
      name: 'IDSEvents',
      path: '/IDSEvents',
      component: IDSEvents
    }

  ]
});
