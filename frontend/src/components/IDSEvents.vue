<template>
  <div class="idseWrapper">
    <div class="idse">
      <div class="events-block">
        <div class="headerWrapper">
          <h3>Intrusion Detection</h3>
          <label for="searchEvent">
            <input type="text" class="form-control" @keyup="filterData" id="searchEvent" placeholder="Search">
          </label>
        </div>
      </div>
      <table class="table">
          <thead class="text-center">
          <tr>
              <td><b>VLAN</b></td>
              <td><b>Phoenix Box</b></td>
              <td><b>Attacker IP</b></td>
              <td><b>Danger Level</b></td>
              <td><b>Blocked</b></td>
              <td><b>Blocked on</b></td>
              <td><b>Last update</b></td>
          </tr>
          </thead>
          <tbody>
          <tr  class="text-center" :style="{ background: getBGColor(event.danger_level) }" v-for="event in filteredEvents">
              <td>{{ event.vlan }}</td>
              <td>{{ event.phx_box }}</td>
              <td>{{ event.ip }}</td>
              <td>{{ event.danger_level }}</td>
              <td>{{ getBlockedStatus(event.blocked) }}</td>
              <td>{{ unixEpochToLocal(event.blocked_on) }}</td>
              <td>{{ convertLastupdateFormat(event.last_update) }}</td>
          </tr>
          </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import moment from 'moment';

import { TableStyles } from '../../static/EventsTableStyles.js';

export default {
  name: 'IDSEvents',
  data: () => ({
    events: [],
    filteredEvents: []
  }),
  mounted() {
    try {
      this.$store.dispatch('getIDSEvents').then(() => {
        this.events = this.$store.getters['IDSEvents'];
        this.events = this.sortData(this.events);
        for (let i = 0; i < this.events.length; i++) {
          this.getBGColor(this.events[i].danger_level);
        }
        this.filteredEvents = this.events.slice();
      });
    } catch (e) {
      console.error(e);
    }
  },
  methods: {
    sortData(data) {
      return data.sort((a, b) => b.last_update - a.last_update);
    },
    getBGColor(level) {
      let dangerLevel = '';
      if (level === 1 || level === 2) {
        dangerLevel = 'low';
      } else if (level === 3 || level === 4) {
        dangerLevel = 'middle';
      } else if (level >= 5) {
        dangerLevel = 'high';
      }
      return TableStyles.backgroundColors[dangerLevel];
    },
    setRegisterTS(registerTsMilliseconds) {
      // Convert UTC to local time.
      if (!registerTsMilliseconds) {
        return '';
      }
      const thenUTC = moment.unix(registerTsMilliseconds).utc().format('YYYY-MM-DD HH:mm:ss');
      return moment(thenUTC).local().format('LLL');
    },
    unixEpochToLocal(seconds) {
      if (!seconds) {
        return '';
      }

      const utc_date = moment.unix(seconds).utc().format('YYYY-MM-DD HH:mm:ss');
      const utc = moment.utc(utc_date).toDate();
      return moment(utc).local().format('LLL');
    },
    convertLastupdateFormat(seconds) {
      if (!seconds) {
        return 'Unknown';
      }

      // Convert UNIX seconds to UTC format.
      const thenUTC = moment.unix(seconds).utc().format('YYYY-MM-DD HH:mm:ss');
      let nowUTC = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss');
      nowUTC = moment(nowUTC);
      const diff = moment.duration(nowUTC.diff(thenUTC)).humanize();

      return diff + ' ago';
    },
    getBlockedStatus(value) {
      if (value === 1) {
        return 'YES';
      } if (value === 0) {
        return 'NO';
      }
      return 'Unknown';
    },
    filterData(event) {
      const searchText = new RegExp(`(${event.target.value})`, 'i');
      this.filteredEvents = this.events.filter((item) => (item.vlan.match(searchText) || item.blocked.match(searchText) || item.ip.match(searchText) || item.phx_box.match(searchText) || this.setRegisterTS(item.blocked_on).match(searchText)));
    }
  }
};
</script>
<style>
    .events-block {
        background-color: #fff;
    }
    .events-block table {
        border-collapse: unset;
        border-spacing: 0 1px;
    }
    .events-block tbody {
        font-size: 14px;
    }
    .events-block tbody tr {
        border-radius: 5px;
    }
    .idseWrapper{
      width: 100%;
      padding: 60px 19px;
    }
    .idse{
      background-color: #fff;
      border: 1px solid #c8ced5;
    }
    .headerWrapper{
      background-color: #f0f3f5;
      border-bottom: 1px solid #c8ced5;
      padding: 10px;
      display: flex;
      justify-content: space-between;
    }
    .headerWrapper h3{
      color: #444;
    }
</style>
