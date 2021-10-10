<template>
  <div id="app">
    <div class="wrapper content-wrapper">
      <!-- Page Content -->
      <div id="content">
        <the-header></the-header>
        <router-view></router-view>
      </div>

    </div>
  </div>
</template>

<script>
import TheHeader from './components/TheHeader.vue';

export default {
  name: 'App',
  components: {
    TheHeader
  }
};
</script>

<style>
  .content-wrapper{
    background-color: #e4e5e6 !important;
  }
</style>
