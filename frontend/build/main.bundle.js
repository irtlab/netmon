'use strict';

var _vue = require('vue');

var _vue2 = _interopRequireDefault(_vue);

var _App = require('./App');

var _App2 = _interopRequireDefault(_App);

var _router = require('@/router');

var _router2 = _interopRequireDefault(_router);

require('@/../static/style.css');

require('@/../static/lte-style.css');

var _store = require('@/store');

var _store2 = _interopRequireDefault(_store);

require('font-awesome/css/font-awesome.css');

var _socket = require('@/socket');

var _socket2 = _interopRequireDefault(_socket);

var _bootstrapVue = require('bootstrap-vue');

var _bootstrapVue2 = _interopRequireDefault(_bootstrapVue);

require('bootstrap/dist/css/bootstrap.css');

require('bootstrap-vue/dist/bootstrap-vue.css');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_vue2.default.use(_bootstrapVue2.default); // The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
/* eslint-disable */

new _vue2.default({
  el: '#app',
  router: _router2.default,
  store: _store2.default,
  template: '<App/>',
  components: { App: _App2.default },
  mounted: function mounted() {
    this.$store.dispatch('getDevices');
    this.$store.dispatch('getNotifications');
    this.$store.dispatch('getNetworkTopology');
  }
});
