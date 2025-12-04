<template>
  <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import echarts from 'echarts'
require('echarts/theme/macarons') // echarts theme
import resize from './mixins/resize'

const animationDuration = 6000

export default {
  mixins: [resize],
  props: {
    className: {
      type: String,
      default: 'chart'
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '300px'
    }
  },
  data() {
    return {
      chart: null
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initChart()
    })
  },
  beforeDestroy() {
    if (!this.chart) {
      return
    }
    this.chart.dispose()
    this.chart = null
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$el, 'macarons')

      this.chart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: { // 坐标轴指示器，坐标轴触发有效
            type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
          }
        },
        grid: {
          top: 10,
          left: '2%',
          right: '2%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: [{
          type: 'category',
          data: ['2019年', '2020年', '2021年', '2022年', '2023年', '2024年', '2025年'],
          axisTick: {
            alignWithLabel: true
          }
        }],
        yAxis: [{
          type: 'value',
          axisTick: {
            show: false
          }
        }],
        series: [{
          name: '态度问题',
          type: 'bar',
          stack: 'vistors',
          barWidth: '60%',
          data: [0, 0, 10, 25, 35, 55, 47],
          animationDuration
        }, {
          name: 'bug次数',
          type: 'bar',
          stack: 'vistors',
          barWidth: '60%',
          data: [0, 0, 22, 42, 34, 53, 31],
          animationDuration
        }, {
          name: '客诉次数',
          type: 'bar',
          stack: 'vistors',
          barWidth: '60%',
          data: [0, 0, 1, 23, 25, 63, 35],
          animationDuration
        }]
      })
    }
  }
}
</script>
