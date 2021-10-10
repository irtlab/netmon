// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import router from '@/router';
import '../static/style.css';
import '../static/lte-style.css';
import store from './store/index.js';
import Socket from './socket/index.js';

import NProgress from 'nprogress/nprogress';
import 'nprogress/nprogress.css';

import BootstrapVue from 'bootstrap-vue';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

// font-awesome-------------
import 'font-awesome/css/font-awesome.css';
import 'vue2-daterange-picker/dist/vue2-daterange-picker.css';
import Icon from 'vue-awesome/components/Icon';
import App from './App.vue';
import 'vue-awesome/icons/flag';
import 'vue-awesome/icons';

Vue.component('v-icon', Icon);
// font-awesome-------------

router.beforeResolve((to, from, next) => {
  if (to.path) {
    NProgress.start();
  }
  next();
});

router.afterEach((to, from) => {
  NProgress.done();
});

Vue.use(BootstrapVue);
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: {
    App,
    'v-icon': Icon
  },
  mounted() {
    this.$store.dispatch('getNotifications');
    this.$store.dispatch('getNetworkTopology');
  }
});
