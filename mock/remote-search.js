const Mock = require('mockjs')

const NameList = ["马欢", "康帅", "代东林", "高振番", "李攀", "田永全", "", "",":"]
const count = 100

for (let i = 0; i < count; i++) {
  NameList.push(Mock.mock({
    name: '@first'
  }))
}
NameList.push({ name: 'mock-Pan' })

module.exports = [
  // username search
  {
    url: '/vue-element-admin/search/user',
    type: 'get',
    response: config => {
      const { name } = config.query
      const mockNameList = NameList.filter(item => {
        const lowerCaseName = item.name.toLowerCase()
        return !(name && lowerCaseName.indexOf(name.toLowerCase()) < 0)
      })
      return {
        code: 20000,
        data: { items: mockNameList }
      }
    }
  },

  // transaction list
  {
    url: '/vue-element-admin/transaction/list',
    type: 'get',
    response: _ => {
      return {
        code: 20000,
        data: {
          total: 10,
          'items|20': [{
            order_no: '@guid()',
            timestamp: +Mock.Random.date('T'),
            item_name: "",
            username: '马欢',
            price: '@float(1, 10, 0, 0)',
            'status|1': ['success', 'pending']
          }]
        }
      }
    }
  }
]
