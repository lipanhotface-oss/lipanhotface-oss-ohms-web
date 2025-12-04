/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const itemTableRouter = {
  path: '/item-schedule',
  component: Layout,
  redirect: '/item-schedule/index',
  name: '项目进度管理',
  meta: {
    title: '项目进度管理',
    icon: 'table'
  },
  children: [
    {
      path: 'index',
      component: () => import('@/views/item-schedule/index'),
      name: '项目进度管理',
      meta: { title: '项目进度管理' }
    },
    {
      path: 'item_info/index',
      component: () => import('@/views/item-schedule/item_info/index'),
      name: '项目进度详情',
      meta: { title: '项目进度详情' }
    }
    // {
    //   path: 'complex-table',
    //   component: () => import('@/views/table/complex-table'),
    //   name: 'ComplexTable',
    //   meta: { title: 'Complex Table' }
    // }
  ]
}
export default itemTableRouter
