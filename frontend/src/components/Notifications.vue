<template>
  <div class="col-12">
   <div class="col-md-6 col-sm-12">
     <div
     v-for="(notification, idx) in notifications"
     :key="idx"
     >
       <div class="box with-border">
         <div class="box-body">
           <b-alert
             show
             v-bind:variant="getClassName(notification.type)"
                v-bind:class="'alert alert-'+getClassName(notification.type)"
           >
             {{notification.message}}
           </b-alert>
         </div>
         <div class="box-footer">
           <span class="timestamp">{{ConvertUTCDateToLocalDate(notification.ts)}}</span>
         </div>
       </div>

     </div>
   </div>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  name: 'Notifications',
  computed: {
    notifications() {
      return this.$store.getters['notifications'];
    }
  },
  methods: {
    getClassName(type) {
      const classObj = {
        green: 'success',
        red: 'danger',
        yellow: 'warning'
      };
      if (classObj[type]) {
        return classObj[type];
      }
      return 'info';
    },
    ConvertUTCDateToLocalDate(utsMilliseconds) {
      if (!utsMilliseconds) {
        return '';
      }
      return moment.utc(utsMilliseconds).local().format('LLL');
    }
  }
};
// 2018-09-22T21:15:44.623198  2018 Sep 22, 17:15:44
</script>

<style scoped>
  .timestamp{
    font-size:13px;
    float:right;
  }
  .alert{
    margin-bottom:0px;
  }
</style>
