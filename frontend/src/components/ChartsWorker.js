import moment from 'moment';
import filesize from 'filesize';

const size = filesize.partial({base: 10});

class ChartsWorker {
  constructor(traffic, chartStyles) {
    this.chartStyles = chartStyles;
    this.traffic = traffic;
    this.trafficData = {};
    this.lastDayData = {};
    this.lineChartsData = [];
    this.pieChartData = [];
    ChartsWorker.trafficData = {};
    ChartsWorker.lastDayData = {};
    ChartsWorker.lineChartsData = [];
    ChartsWorker.pieChartData = [];
    ChartsWorker.loaded = false;
  }

  get getPieChartData() {
    return this.pieChartData;
  }

  get getTrafficData() {
    return this.trafficData;
  }

  get getLineChartsData() {
    return this.lineChartsData;
  }

  get getLastDayData() {
    return this.lastDayData;
  }

  generateDataSets(exceptedDates = null) {
    const traffic = { ...this.traffic};
    if (!Object.keys(traffic).length) {
      return false;
    }
    this.lineChartsData = [];
    this.pieChartData = [];
    this.trafficData = {};
    this.trafficData['lastUpdate'] = {};
    this.trafficData['summary'] = {};
    this.trafficData['lastDayData'] = {};
    this.trafficData['totalTraffic'] = {};
    Object.keys(traffic).map((vlan) => {
      this.trafficData['lastUpdate'][vlan] = ChartsWorker.convertLastupdateFormat(traffic[vlan].last_update);
      this.trafficData[vlan] = {};
      this.trafficData[vlan]['labels'] = traffic[vlan].time_series.date;
      this.trafficData[vlan]['datasets'] = [];
      if (traffic[vlan].hasOwnProperty('hostname')) {
        this.trafficData[vlan]['hostname'] = traffic[vlan].hostname;
        this.trafficData[vlan]['name'] = `${traffic[vlan].hostname} (${traffic[vlan].vlan})`;
      } else {
        this.trafficData[vlan]['name'] = vlan;
      }
      this.trafficData[vlan].id = vlan;
      const rx = [];
      const tx = [];
      const values = traffic[vlan].time_series.value;
      const lastDayRx = values[values.length - 1] ? values[values.length - 1].rx : 1;
      const lastDayTx = values[values.length - 1] ? values[values.length - 1].tx : 1;
      const rxBgColorArr = [];
      const txBgColorArr = [];
      const rxBgColor = this.getBgColor('line', 'rx');
      const txBgColor = this.getBgColor('line', 'tx');
      let key = '';
      if (vlan.length > 20) {
        key = this.trafficData[vlan].name;
      } else {
        key = vlan;
      }
      for (let i = 0; i < values.length; i++) {
        rxBgColorArr.push(rxBgColor);
        txBgColorArr.push(txBgColor);
        if (exceptedDates && exceptedDates[key].indexOf(this.trafficData[vlan]['labels'][i]) !== -1) {
          rx.push(null);
          tx.push(null);
        } else {
          rx.push(values[i].rx);
          tx.push(values[i].tx);
        }
      }
      this.trafficData[vlan].datasets.push({
        label: 'RX',
        data: rx,
        backgroundColor: rxBgColor
      });
      this.trafficData[vlan].datasets.push({
        label: 'TX',
        data: tx,
        backgroundColor: txBgColor
      });
      this.lineChartsData.push(this.trafficData[vlan]);

      this.trafficData['lastDayData'][vlan] = {
        rx: size(lastDayRx),
        tx: size(lastDayTx),
        sum: size(lastDayRx + lastDayTx)
      };
      this.trafficData['totalTraffic'][vlan] = traffic[vlan].total_traffic;
      this.lastDayData[vlan] = {
        datasets: [{
          data: [lastDayRx, lastDayTx],
          backgroundColor: [this.getBgColor('pie', 'rx'), this.getBgColor('pie', 'tx')]
        }],
        labels: ['RX', 'TX'],
        name: vlan
      };
      this.pieChartData.push(this.lastDayData[vlan]);
    });
    ChartsWorker.pieChartData = this.pieChartData;
    ChartsWorker.trafficData = this.trafficData;
    ChartsWorker.lineChartsData = this.lineChartsData;
    ChartsWorker.lastDayData = this.lastDayData;
    ChartsWorker.loaded = true;

    return true;
  }

  getBgColor(chartType, dataType) {
    return this.chartStyles[chartType + 'ChartOptions']['bgColors'][dataType];
  }

  static convertLastupdateFormat(lastUpdateMilliseconds) {
    if (!lastUpdateMilliseconds) {
      return 'Unknown';
    }
    // Convert UTC milliseconds to some format.
    const thenUTC = moment.utc(lastUpdateMilliseconds).format('YYYY-MM-DD HH:mm:ss');
    let nowUTC = moment.utc(new Date()).format('YYYY-MM-DD HH:mm:ss');
    nowUTC = moment(nowUTC);
    const diff = moment.duration(nowUTC.diff(thenUTC)).humanize();
    return diff + ' ago';
  }

  generateFilteredDaysArray(dates) {
    let {start, end} = dates;
    if (!start || !end) {
      return false;
    }
    start = moment(start, 'MM/DD/YYYY');
    end = moment(end, 'MM/DD/YYYY');
    const filteringDays = {};
    for (let i = 0; i < this.lineChartsData.length; i++) {
      const vlan = this.lineChartsData[i];
      filteringDays[vlan.name] = [];
      for (let j = 0; j < vlan.labels.length; j++) {
        const currentDay = moment(vlan.labels[j], 'MM/DD/YYYY');
        if ((moment(currentDay).isAfter(start, 'day') &&
            !(moment(currentDay).isBefore(end, 'day')) &&
            !(moment(currentDay).isSame(end, 'day'))) ||
            moment(currentDay).isBefore(start, 'day')) {
          filteringDays[vlan.name].push(vlan.labels[j]);
        }
      }
    }
    return filteringDays;
  }
}

export { ChartsWorker };
export default ChartsWorker;
