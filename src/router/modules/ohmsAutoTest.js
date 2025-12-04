/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const ohmsAutoTestRouter = {
  path: '/ohms-auto-test',
  component: Layout,
  redirect: '/ohms-auto-test/index',
  name: '自动测试',
  meta: {
    title: '维护系统自动测试',
    icon: 'table'
  },
  children: [
    {
      path: 'index',
      component: () => import('@/views/ohms-auto-test/index'),
      name: '维护系统自动测试',
      meta: { title: '维护系统自动测试' }
    },
    {
      path: 'edit_menu/edit_menu',
      component: () => import('@/views/ohms-auto-test/edit_menu/edit_menu'),
      name: '维护系统功能配置',
      meta: { title: '维护系统功能配置' }
    }
    // {
    //   path: 'complex-table',
    //   component: () => import('@/views/table/complex-table'),
    //   name: 'ComplexTable',
    //   meta: { title: 'Complex Table' }
    // }
  ]
}
export default ohmsAutoTestRouter
