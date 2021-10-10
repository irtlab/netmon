<template>
    <div class="chartsWrapper">
        <div class="selectWrapper" v-if="this.activeTab !== 'per_node_vlan'">
            <div class="select">
                <div id="range-picker">
                    <date-range-picker
                      :startDate="picker.startDate"
                      :endDate="picker.endDate"
                      @update="onDateSelected"
                      :locale-data="picker.locale"
                      :dateRange="picker.dateRange"
                      :show-droopdowns="true"
                      :opens="'right'"
                    >
                      <!--Optional scope for the input displaying the dates -->
                      <div slot="input" slot-scope="picker">
                        Select dates
                      </div>
                    </date-range-picker>
                </div>
                <div class="btnWrapper">
                    <button type="button" class="btn bg-info p-0 pl-2 pr-2 ml-3 text-light" @click="resetDates">
                      <v-icon name="redo-alt"></v-icon>
                    </button>
                </div>
            </div>
        </div>
      <div class="graffic col-lg-6 col-md-7 col-sm-10 mx-auto my-2" v-for="(data, key) in lineChartsData"
           :key="Math.random()"
           v-if="loaded">
        <div class="w-100">
          <div class="dataName ">
            <h5>{{ data.name }}</h5>
            <div class="last-update">
              <b>Last update:</b> {{ trafficData.lastUpdate[data.id] }}
            </div>
          </div>
          <div v-if="activeTab !== 'per_node_vlan'" class="row pie-chart">
            <div class="col-lg-6 col-md-12">
              <h6 class="text-center"><b>Today</b></h6>
              <div class="last-day-data text-center">
                <p>
                  RX: {{ trafficData.lastDayData[data.id].rx }}
                </p>
                <p>
                  TX: {{ trafficData.lastDayData[data.id].tx }}
                </p>
              </div>
              <div class="pie-chart-item w-75 m-auto">
                <Pie
                  :data-active="activeTab"
                  :chartdata="pieChartData[key]"
                  :style="chartStyles"
                  :options="pieChartOptions"/>
              </div>
            </div>
            <div class="col-lg-6 col-md-12">
              <h6 class="text-center"><b>All time</b></h6>
              <div class="all-time">
                <p> RX: {{ size(trafficData.totalTraffic[data.id].rx_bytes) }}</p>
                <p> TX: {{ size(trafficData.totalTraffic[data.id].tx_bytes) }}</p>
                <p>__</p>
                <p>
                  RX Packets: {{ trafficData.totalTraffic[data.id].rx_packets }}
                </p>
                <p>
                  RX Dropped: {{ trafficData.totalTraffic[data.id].rx_dropped }}
                </p>
                <p>
                  TX Packets: {{ trafficData.totalTraffic[data.id].tx_packets }}
                </p>
                <p>
                  TX Dropped: {{ trafficData.totalTraffic[data.id].tx_dropped }}
                </p>
              </div>
            </div>
          </div>
          <div class="line-chart">
            <line-chart
              :data-active="activeTab"
              :chartdata="data"
              :style="chartStyles"
              :options="lineChartOptions"/>
          </div>
        </div>
      </div>
    </div>
</template>

<script>
import filesize from 'filesize';
import VueDateRangePicker from 'vue-rangedate-picker';
import moment from 'moment';
import DateRangePicker from 'vue2-daterange-picker';
import LineChart from './BarChart.vue';
import Pie from './PieChart.vue';
import { ChartsWorker } from './ChartsWorker.js';

const size = filesize.partial({base: 10});
import { ChartStyleData } from '../../static/ChartsDataStyle.js';

export default {
  name: 'LineChartContainer',
  components: {
    LineChart, Pie, VueDateRangePicker, DateRangePicker
  },
  data: () => ({
    dateRange: null,
    picker: {
      startDate: '2017-09-05',
      endDate: '2017-09-15',
      dateRange: {},
      locale: {
        direction: 'ltr', // direction of text
        format: 'DD-MM-YYYY', // fomart of the dates displayed
        separator: ' - ', // separator between the two ranges
        applyLabel: 'Apply',
        cancelLabel: 'Cancel',
        weekLabel: 'W',
        customRangeLabel: 'Custom Range',
        daysOfWeek: moment.weekdaysMin(), // array of days - see moment documenations for details
        monthNames: moment.monthsShort(), // array of month names - see moment documenations for details
        firstDay: 1 // ISO first day of week - see moment documenations for details
      }
    },
    loaded: false,
    trafficData: {},
    lastDayData: {},
    lineChartsData: [],
    chartWorker: null,
    traffic: null,
    pieChartData: [],
    size,
    activeTab: sessionStorage.getItem('activeChart') || 'vlans',
    datePickerConfigs: {
      presetRange: {},
      i18n: 'EN'
    },
    lineChartOptions: {
      scales: {
        xAxes: ChartStyleData.lineChartOptions.scales.xAxes,
        yAxes: [{
          beginAtZero: true,
          ticks: {
            callback: (value) => {
              const changedFormat = size(value).split(' ');
              return (+(changedFormat[0])) + ' ' + changedFormat[1];
            }
          }
        }]
      },
      legend: ChartStyleData.lineChartOptions.legend,
      tooltips: {
        enabled: true,
        callbacks: {
          label: (tooltipItems) => size(tooltipItems.yLabel)
        }
      }
    },
    pieChartOptions: ChartStyleData.pieChartOptions
  }),
  mounted() {
    this.$root.$on('changeActiveTap', (data) => {
      this.activeTab = data.type;
    });
    this.loaded = false;
    try {
      this.$store.dispatch('getTraffic').then(() => {
        this.traffic = this.dataTraffic;
        this.generateData(this.traffic[this.activeTab]);
      });
    } catch (e) {
      console.error(e);
    }
    // document.querySelector('div.input-date').innerText = 'Select dates'
    document.querySelector('.wrapper.content-wrapper').classList.remove('wrapper');
  },

  beforeDestroy() {
    document.querySelector('.content-wrapper').classList.add('wrapper');
  },

  computed: {
    chartStyles() {
      return ChartStyleData.chart_styles;
    },
    dataTraffic() {
      return this.$store.getters['traffic'];
    }
  },

  watch: {
    activeTab() {
      this.generateData(this.traffic[this.activeTab]);
    },
    dataTraffic() {
      if (JSON.stringify(this.traffic) !== JSON.stringify(this.dataTraffic)) {
        this.traffic = this.dataTraffic;
        let filteringDays = null;
        if (this.selectedDays) {
          filteringDays = this.chartWorker.generateFilteredDaysArray(this.selectedDays);
        }
        this.generateData(this.traffic[this.activeTab], filteringDays);
      }
    }
  },
  methods: {
    generateData(data, exceptedDates = null) {
      this.chartWorker = new ChartsWorker(data, ChartStyleData);
      this.chartWorker.generateDataSets(exceptedDates);
      this.loaded = ChartsWorker.loaded;
      if (this.loaded) {
        this.trafficData = this.chartWorker.getTrafficData;
        if (this.activeTab === 'nodes') {
          const data = this.chartWorker.getLineChartsData;
          const forSort = {};
          const sorted = [];
          Object.values(data).map((value) => {
            forSort[value.hostname] = value;
          });
          Object.keys(forSort).sort().map((item) => {
            sorted.push(forSort[item]);
          });
          this.lineChartsData = sorted;
        } else {
          this.lineChartsData = this.chartWorker.getLineChartsData;
        }
        this.pieChartData = this.chartWorker.getPieChartData;
        this.lastDayData = this.chartWorker.getLastDayData;
      }
    },
    resetDates() {
      this.generateData(this.traffic[this.activeTab]);
    },
    filterDataForSelectedDays(dates) {
      const filteringDays = this.chartWorker.generateFilteredDaysArray(dates);
      this.generateData(this.traffic[this.activeTab], filteringDays);
    },
    onDateSelected(dates) {
      this.selectedDays = {start: dates.startDate, end: dates.endDate};
      this.filterDataForSelectedDays(this.selectedDays);
    }
  }
};
</script>
<style>
    .btnWrapper{
      display: flex;
    }
    #range-picker {
      min-width: 20%;
    }
    #range-picker .vue-daterange-picker {
      width: 100%;
    }
    #range-picker .reportrange-text:after {
      content: "\25BC";
      float: right;
      font-size: smaller;
      position: absolute;
      right: 9px;
      top: 9px;
    }
    .input-date{
      height: 100%;
      border-radius: 5px !important;
    }
    .note{
      color: #ccc;
    }
    .dataName{
      padding: 10px;
    }
    .dataName h5{
      color: #21a8d8;
    }
    .graffic{
      /*width: 48%;*/
      margin: 14px;
      box-sizing: border-box;
      border: 1px solid #c8ced5;
    }
    .graffWrapper{
      justify-content: center;
      width: 100%;
      display: flex;
      flex-wrap: wrap;
    }
    .box-header {
      color: #444;
      display: block;
      position: relative;
      background-color: #f0f3f5;
    }

    .pie-chart {
        min-height: 190px;
    }

    .pie-chart > h6 {
        margin-left: 100px;
    }

    .pie-chart-item {
        margin-top: 5px;
    }

    .last-day-data {
        top: 35px;
        left: 15%;
    }

    .all-time {
        top: 6px;
        right: 12%;
        border-left: 2px solid #ccc;
        padding-left: 23px;
    }
     .pie-chart p {
         margin-bottom: 0;
         padding: 0;
         font-size: 15px;
         color: rgba(0, 0, 0, 0.7);
         line-height: 19px;
     }

    .see-more-href {
        padding: 2px;
        color: rgba(0, 0, 0, 0.7);
        background-color: #ecf0f5;
        border: unset;
        text-decoration: underline;
        margin: 0 !important;
    }
    .see-more-href:hover {
        background-color: unset;
        color: black;
    }

    .see-more-href:focus {
        outline: none;
        background-color: #ecf0f5;
        border: unset;
        text-decoration: underline;

    }

    .see-more-href:active {
        outline: none;
        background-color: transparent;
        border: unset;
    }

    .btn-secondary.see-more-href:not(:disabled):not(.disabled):active{
        outline: none;
        background-color: transparent;
        border: unset;
        color: black;
        box-shadow: unset;
        text-decoration: underline;
    }

    .btn-secondary:focus {
        box-shadow: unset;
    }
    .calendar-root.date-picker {
        margin-left: -20px;
    }
    .reset-dates:after {
        display: block;
        content: "\f0e2";
        font-family: FontAwesome ;
    }

    .tooltip p {
        padding: 0;
        margin-bottom: 0;
        text-align: left;
        color: black;
    }

    .tooltip .tooltip-inner {
        background-color: #fffdfd;
    }

    .tooltip .arrow:before {
        border-bottom-color: #fffdfd;
        border-top-color: #fffdfd;
    }

    .see-more-tooltip {
        background-color: transparent;
        text-decoration: underline;
        color: black;
        border: unset;
        margin-top: 0;
    }
    .see-more-tooltip:hover {
        background-color: transparent;
        text-decoration: underline;
        color: black;
        border: unset;
    }

    .see-more-tooltip.btn-secondary:not(:disabled):not(.disabled):active{
        background-color: transparent;
        text-decoration: underline;
        color: black;
        border: unset;
        box-shadow: unset;
    }

    .see-more-tooltip:focus {
        background-color: transparent;
        text-decoration: underline;
        color: black;
        border: unset;
    }

    #range-picker .calendar-range{
        float: left;
        transform: translate(-9px,170px);
        border: unset;
        margin: -2px;
    }

    #range-picker .calendar-wrap {
        width: 87%;
    }

    #range-picker .calendar {
        width: 555px;
    }

    .charts-area {
        margin-top: 50px;
    }

    .last-update {
        font-size:smaller
    }

    .chartsWrapper{
      margin: 43px 0;
      background-color: #fff;
      border: 1px solid #c8ced5;
    }

    .selectWrapper{
      background-color: #f0f3f5;
      border-bottom: 1px solid #c8ced5;
      padding: 10px;
    }

    .select{
      display: flex;
    }
</style>
