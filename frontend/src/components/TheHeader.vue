<template>
<div>
  <div class="menuButton">
    <div class="headerLogo">
      <div class="iconMenu" @click="openMenu">
        <v-icon name="bars" />
      </div>
    </div>
  </div>
  <div class="navBarWrapper" :class="{'width': isActive2}">
    <div class="navBarUl" :class="{'active': isActive}">
      <div class="items">
        <router-link to="/NetworkMap">
          <v-icon name="network-wired"/>
           Network Topology
        </router-link>
      </div>
      <div class="items">
        <router-link to="/Devices">
        <v-icon name="clipboard-list"/>
         Device List
        </router-link>
      </div>
      <div class="items">
        <router-link to="/Traffic">
        <v-icon name="database"/>
         Traffic Data
        </router-link>
      </div>
      <div class="items">
        <router-link to="/IDSEvents">
        <v-icon name="file-export"/>
        Intrusion Detection
        </router-link>
      </div>
      <div class="items" @click="notificationsViewed = notifications.length">
        <router-link to="/Notifications">
       <v-icon name="exclamation-triangle"/>
        Notifications
        </router-link>
      </div>
    </div>
  </div>
</div>
</template>
<script>
export default {
  name: 'TheHeader',
  data() {
    return {
      isActive: false,
      isActive2: false,
      notificationsViewed: 0
    };
  },
  computed: {
    notifications() {
      return this.$store.getters['notifications'];
    }
  },
  methods: {
    myFunction() {
      this.isActive = true;
      this.isActive2 = true;
    },
    openMenu() {
      this.isActive = !this.isActive;
      this.isActive2 = !this.isActive2;
    }
  }
};
</script>

<style scoped>
   .active{
    transform: translateX(-200px);
  }
  .router-link-exact-active {
    background-color: #20a8d8 !important;
  }
  .router-link-exact-active .fa-icon{
    color: #fff !important;
  }
  .width{
    width: 0 !important;
  }
  .navBarWrapper{
    width: 200px;
    transition: 0.5s;
  }
  .navBarUl{
    position: fixed;
    top: 44px;
    left: 0;
    background-color: #30353a;
    width: 200px;
    height: 100vh;
    transition: 0.5s;
    z-index: 10;
  }
  .items{
    width: 100%;
    transition: 0.3s;
    display: flex;
    flex-direction: column;
  }
  /*.items a:hover{*/
  /*  background-color: #20a8d8;*/
  /*}*/
  .items a{
    width: 100%;
    color: #fff;
    padding: 10px 15px;
    text-decoration: none;
    transition: 0.3s;
    display: flex;
    align-items: center;
  }
  ul{
    position: fixed !important;
    top: 0;
    left: 0;
    background-color: #25292d;
    width: 250px;
    height: 100%;
  }
  ul li a{
    background-color: #30353a;
    color: #fff !important;
  }
  /*ul li a:hover{*/
  /*  background-color: #20a8d8;*/
  /*}*/
  /*.items a:hover .fa-icon{*/
  /*  color: #fff !important;*/
  /*}*/
  .navbar-brand{
    color: #fff;
    padding: 15px 0;
  }
  .router-link-exact-active{
    background-color: #3a4248
  }
  .headerLogo{
    padding: 10px 15px;
    color: #20a8d8;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 200px;
    user-select: none;
  }
  .fa-icon{
    margin-right: 10px;
    color: #20a8d8;
    cursor: pointer;
  }
  .menuButton{
    position: fixed;
    left: 0;
    top: 0;
    /* padding: 10px 15px; */
    background-color: #fff;
    width: 100%;
    z-index: 4;
    height: 44px;
    border-bottom:1px solid #c8ced4;
  }
  .iconMenu>.fa-icon{
    color: #7a7a7a;
    height: 23px;
    width: 23px;
  }
</style>

