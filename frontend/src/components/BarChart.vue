<script>
import { Bar } from 'vue-chartjs';

export default {
  name: 'Chart',
  extends: Bar,
  props: {
    height: 100,
    width: 70,
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
