<script>
import { Doughnut } from 'vue-chartjs';

export default {
  name: 'Chart',
  extends: Doughnut,
  props: {
    height: 100,
    width: 100,
    responsive: true,
    chartdata: {
      type: Object,
      default: null
    },
    options: {
      type: Object,
      default: null
    }
  },
  mounted() {
    this.renderChart(this.chartdata, this.options);
  }
};
</script>
