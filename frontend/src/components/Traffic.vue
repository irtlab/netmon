<template>
    <div class="w-100">
        <div class="bTab">
          <ul class="ulWrapper d-flex flex-row-reverse justify-content-end">
              <li class="li" @click="setActiveChart" v-for="(index, vlan) in traffic" :data-type="vlan" :class="{'activeLi': activeTab === vlan}">
                  <a href="#" @click.prevent='' class="nav-a">
                      {{vlan}}
                  </a>
              </li>
          </ul>
        </div>
        <div class="charts">
            <Charts></Charts>
        </div>
    </div>
</template>

<script>
import Charts from './Charts.vue';

export default {
  name: 'Traffic',
  data() {
    return {
      selectedDevice: null,
      activeTab: sessionStorage.getItem('activeChart') || 'vlans',
      vlanTypes: []
    };
  },
  mounted() {
  },
  computed: {
    traffic() {
      return this.$store.getters['traffic'];
    }
  },
  methods: {
    convertTrafficData() {
      this._trafficData = this.traffic;
    },
    getVlanTypes() {
      Object.keys(this._trafficData).map((vlan) => {
        this.vlanTypes.push(vlan);
      });
      return this.vlanTypes;
    },
    setActiveChart(evt) {
      const type = evt.currentTarget.getAttribute('data-type');
      sessionStorage.setItem('activeChart', type);
      this.activeTab = type;
      this.$root.$emit('changeActiveTap', {type});
    }
  },
  components: {
    Charts
  }
};
</script>

<style scoped>
    .bTab{
    position: fixed;
    width: 98%;
    top: 0;
    left: 200px;
    z-index: 5;
    height: 44px;
  }
  .ulWrapper{
    display: flex;
    margin: 0;
  }
    .li{
    padding: 8px 10px;
    text-align: center;
  }
  .nav-a{
    padding: 5px 15px;
    color: #758291;
    transition: 0s !important;
    text-decoration: none !important;
  }
  .li:hover{
    text-decoration: none;
    /* background-color: #20a8d8; */
  }
  .li:hover a{
    color: #5d6063 !important;
  }
  .activeLi{
    color: #fff !important;
    border-bottom: 4px solid #21a8d8;
  }
</style>
