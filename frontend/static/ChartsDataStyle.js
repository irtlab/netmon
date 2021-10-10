const ChartStyleData = {
  chart_styles: {
    responsive: true,
    position: 'relative',
    maintainAspectRatio: false,
    width: '90%',
    margin: 'auto'
  },
  lineChartOptions: {
    scales: {
      xAxes: [{
        categoryPercentage: 1.0,
        barPercentage: 1.0,
        barThickness: 7
      }],
      yAxes: []
    },
    legend: {
      display: true,
      labels: {
        boxHeight: 150,
        fontSize: 9,
        fontStyle: 'bold'
      }
    },
    bgColors: {
      rx: '#36495d80',
      tx: '#20a8d8'
    }
  },
  pieChartOptions: {
    scales: {
      xAxes: [{
        display: false
      }]
    },
    legend: {
      display: false
    },
    tooltips: {
      enabled: false
    },
    bgColors: {
      rx: '#36495d80',
      tx: '#20a8d8'
    }
  }
};

export { ChartStyleData };
export default ChartStyleData;
