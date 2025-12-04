const Mock = require('mockjs')

const List = []
const instr_list = ['RS422板卡', 'LVDS板卡', 'ARINC429板卡', 'LVDT仿真卡', '旋变仿真卡', '直流电压输入卡', '数字量输出卡', '高速IO仿真卡', '直流电压采集卡', '数字量输入卡', '数字波形分析卡', '电压采集卡']
const name_list = ['主控计算机', '主控计算机', '主控计算机', '接口从机1', '接口从机1', '接口从机1',         '接口从机2', '接口从机2', '接口从机2', '接口从机2', '接口从机2', '接口从机2']
const port_list = ['192.168.100.20:7020', 'com1', 'com2', 'com3', 'com4', 'com5',         'com6', 'com7', 'com8', 'com9', 'com10', 'com11']
const instr_type = ["调理卡",    "硬线",    "总线",          "硬线",       "硬线",      "硬线",           "硬线",        "硬线",         "硬线",         "硬线",         "硬线",          "硬线"]
const count = 12

const baseContent = '<p>I am testing data, I am testing data.</p><p><img src="https://wpimg.wallstcn.com/4c69009c-0fd4-4153-b112-6cb53d1cf943"></p>'
const image_uri = 'https://wpimg.wallstcn.com/e4558086-631c-425c-9430-56ffb46e70b3'

for (let i = 0; i < count; i++) {
  // 计算当前时间减去 i 天
  let date = new Date();
  date.setDate(date.getDate() - i);
  // 格式化日期为 ISO 格式（YYYY-MM-DDTHH:mm:ss.sssZ）

  let timestamp = date.toISOString();
  console.log(timestamp);
  List.push(Mock.mock({
    id: i + 1,
    timestamp: timestamp,
    author: 'admin',
    reviewer: '@first',
    title: instr_list[i],
    content_short: 'mock data',
    content: baseContent,
    forecast: '@float(0, 100, 2, 2)',
    importance: '@integer(1, 3)',
    'type|1': name_list[i],
    'status|1': ['在线', '离线'],
    display_time: '@datetime',
    comment_disabled: true,
    pageviews: port_list[i],
    instr_type: instr_type[i],
    image_uri,
    platforms: ['a-platform']
  }))
}

module.exports = [
  {
    url: '/vue-element-admin/article/list',
    type: 'get',
    response: config => {
      const { importance, type, title, page = 1, limit = 20, sort } = config.query

      let mockList = List.filter(item => {
        if (importance && item.importance !== +importance) return false
        if (type && item.type !== type) return false
        if (title && item.title.indexOf(title) < 0) return false
        return true
      })

      if (sort === '-id') {
        mockList = mockList.reverse()
      }

      const pageList = mockList.filter((item, index) => index < limit * page && index >= limit * (page - 1))

      return {
        code: 20000,
        data: {
          total: mockList.length,
          items: pageList
        }
      }
    }
  },

  {
    url: '/vue-element-admin/article/detail',
    type: 'get',
    response: config => {
      const { id } = config.query
      for (const article of List) {
        if (article.id === +id) {
          return {
            code: 20000,
            data: article
          }
        }
      }
    }
  },

  {
    url: '/vue-element-admin/article/pv',
    type: 'get',
    response: _ => {
      return {
        code: 20000,
        data: {
          pvData: [
            { key: 'PC', pv: 1024 },
            { key: 'mobile', pv: 1024 },
            { key: 'ios', pv: 1024 },
            { key: 'android', pv: 1024 }
          ]
        }
      }
    }
  },

  {
    url: '/vue-element-admin/article/create',
    type: 'post',
    response: _ => {
      return {
        code: 20000,
        data: 'success'
      }
    }
  },

  {
    url: '/vue-element-admin/article/update',
    type: 'post',
    response: _ => {
      return {
        code: 20000,
        data: 'success'
      }
    }
  }
]

