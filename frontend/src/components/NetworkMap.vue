<template>
  <div class="row home">
    <div class="col-12 margin">
      <VlanColumn></VlanColumn>
      <VisGraph></VisGraph>
    </div>
  </div>
</template>

<script>
import VisGraph from './VisGraph.vue';
import VlanColumn from './VlanColumn.vue';

export default {
  name: 'NetworkMap',
  data() {
    return {
      selectedDevice: null
    };
  },
  computed: {
    devices() {
      return this.$store.getters['devices'];
    }
  },
  components: {
    VisGraph,
    VlanColumn
  }
};
</script>

<style scoped>
.home{
  width: 100vw;
}
.margin{
  padding: 0 !important;
  margin: 43px 0 0;
}
.row{
  margin: 0 !important;
  padding: 0 !important;
}
</style>
