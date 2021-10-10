<template>
  <div class="justify-content-between wrapper pt-1">
    <b-card title="Device List" style="width: 100%;">
      <b-row align-h="end">
       <b-col lg="3">
         <b-form-input
           v-model="filter"
           type="search"
           id="filterInput"
           placeholder="Type to Search"
         ></b-form-input>
       </b-col>
      </b-row>
      <b-card-body>
        <b-table
          id="device_list"
          :items="options.rows"
          :fields="options.columns"
          :sort-by.sync="sortBy"
          :sort-desc.sync="sortDesc"
          :busy="isBusy"
          responsive="sm"
          :filter="filter"
          :filterIncludedFields="filterOn"
        >
          <template slot="last_update" slot-scope="data">
            {{ lastUpdateFormatFn(data.value) }}
            <i class="fa fa-ellipsis-v pull-right cursor-pointer" @click="cellClicked" :data-id="data.item.id"></i>
          </template>
          <template slot="bandwidth" slot-scope="data">
            {{ getBandwidthValue(data.value) }}
          </template>
          <div slot="table-busy" class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>
            <strong>Loading...</strong>
          </div>
        </b-table>
      </b-card-body>
    </b-card>
    <b-modal v-if="selectedDevice" hide-footer :static="true" v-model="selected" :title="selectedDevice.hostname">
      <ul class="list-group">
        <li class="list-group-item"><span class="dname">Hostname: </span> {{selectedDevice.hostname}}</li>
        <li class="list-group-item"><span class="dname">IPv4: </span> {{selectedDevice.ip}}</li>
        <li class="list-group-item"><span class="dname">MAC: </span> {{selectedDevice.mac}}</li>
        <li class="list-group-item"><span class="dname">Bandwidth: </span> {{getBandwidthValue(selectedDevice.bandwidth)}}</li>
        <li class="list-group-item"><span class="dname">VLAN: </span> {{selectedDevice.vlan}}</li>
        <li class="list-group-item"><span class="dname">Network interface: </span> {{selectedDevice.iface}}</li>
        <li class="list-group-item"><span class="dname">Device registered: </span> {{setRegisterTS(selectedDevice.registration_ts)}}</li>
      </ul>
    </b-modal>
  </div>

</template>

<script>
import moment from 'moment';
import { VueGoodTable } from 'vue-good-table';
import { getBandwidthValue } from '../utils/ProcessNodeAndEdgeData';

export default {
  name: 'DevicesList',
  data() {
    return {
      deviceSelected: null,
      selected: false,
      sortBy: 'hostname',
      sortDesc: false,
      isBusy: true,
      filter: null,
      filterOn: [],
      options: {
        columns: [
          { key: 'hostname', sortable: true },
          { key: 'MAC', sortable: true },
          { key: 'VLAN', sortable: true },
          { key: 'IPv4', sortable: true },
          {
            key: 'bandwidth', sortable: true, sortByFormatted: false, filterByFormatted: false
          },
          {
            key: 'last_update', sortable: true, sortByFormatted: false, filterByFormatted: false
          }
        ],
        rows: []
      },
      deviceList: []
    };
  },


  computed: {
    devices() {
      return this.$store.getters['devices'];
    },

    selectedDevice() {
      if (this.devices) {
        try {
          return this.devices[this.deviceSelected];
        } catch (e) {
          console.error(e.message);
        }
      }
    },
  },


  methods: {
    lastUpdateFormatFn(lastUpdate) {
      lastUpdate = Number(lastUpdate);
      return this.convertLastupdateFormat(lastUpdate);
    },

    generateTableOptions() {
      if (!this.devices) {
        this.isBusy = true;
        return this.options;
      }
      this.isBusy = false;
      const devices = this.devices;
      this.options.rows = [];
      for (const mac in devices) {
        if (!devices.hasOwnProperty(mac)) {
          return false;
        }
        this.options.rows.push({
          id: mac,
          hostname: devices[mac].hostname,
          MAC: devices[mac].mac,
          VLAN: devices[mac].vlan,
          IPv4: devices[mac].ip,
          bandwidth: devices[mac].bandwidth,
          last_update: devices[mac].last_update
        });
      }
    },

    cellClicked(event) {
      const id = event.currentTarget.getAttribute('data-id');
      if (id) {
        this.deviceSelected = id;
        this.selected = true;
      }
    },

    rowStyleClassFn(row) {
      return row.id === this.deviceSelected ? 'table-primary' : '';
    },

    convertLastupdateFormat(lastUpdateMilliseconds) {
      if (!lastUpdateMilliseconds) {
        return 'Unknown';
      }

      // Convert UTC milliseconds to some format.
      const thenUTC = moment.utc(lastUpdateMilliseconds).format('YYYY-MM-DD HH:mm:ss');

      let nowUTC = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss');
      nowUTC = moment(nowUTC);
      const diff = moment.duration(nowUTC.diff(thenUTC)).humanize();

      return diff + ' ago';
    },

    getBandwidthValue(bandwidth) {
      return getBandwidthValue(bandwidth);
    },

    setRegisterTS(registerTsMilliseconds) {
      // Convert UTC to local time.
      const thenUTC = moment.utc(registerTsMilliseconds).format('YYYY-MM-DD HH:mm:ss');
      const thenLocal = moment(thenUTC).local().format('LLL');

      return thenLocal;
    }
  },


  components: {
    VueGoodTable
  },


  mounted() {
    document.getElementById('content').classList.add('h-auto');
    try {
      this.$store.dispatch('getDevices').then(() => {
        this.generateTableOptions();
      });
    } catch (e) {
      console.error(e);
    }
    this.$store.watch(
      (state, getters) => getters.devices,
      () => {
        this.generateTableOptions();
      },
    );
  },

  destroyed() {
    document.getElementById('content').classList.remove('h-auto');
  }
};
</script>

<style >
  .cursor-pointer{
    cursor: pointer;
    min-width: 10px;
  }
  .h-auto {
    height: auto !important;
  }
  .listWrapper{
    width: 100%;
    position: relative;
    background-color: #fff;
    border: 1px solid #c8ced5;
  }
  .box-header{
    background-color: #f0f3f5;
    border-bottom: 1px solid #c8ced5
  }
  .wrapper{
    padding: 60px 17px;
    width: 100%;
  }
  .more-info-hide{
    position: absolute;
    right: 0px;
    top:10px;
  }
  .dname {
    font-weight:600;
    margin-right: 5px;
  }
  .box.mx-auto{
    -webkit-animation-fill-mode: forwards;
    -webkit-animation-name: miku;
    -webkit-animation-duration: 1s;
  }
  @-webkit-keyframes miku{
    0% { margin-left: auto; }
    100% { margin-left:auto            }
  }
</style>
