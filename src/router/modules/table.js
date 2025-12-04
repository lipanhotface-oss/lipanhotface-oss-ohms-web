/** When your routing table is too long, you can split it into small modules **/

import Layout from '@/layout'

const tableRouter = {
  path: '/make-offer',
  component: Layout,
  redirect: '/make-offer/make-office-table',
  name: 'make-offer',
  meta: {
    title: '项目报价',
    icon: 'table'
  },
  children: [
    {
      path: 'dynamic-table',
      component: () => import('@/views/make-offer/make-office-table/index'),
      name: '硬件管理',
      meta: { title: '硬件管理' }
    },
    {
      path: 'drag-table',
      component: () => import('@/views/make-offer/dynamic-table/index'),
      name: 'DragTable',
      meta: { title: '批量导入' }
    }
    // {
    //   path: 'inline-edit-table',
    //   component: () => import('@/views/table/inline-edit-table'),
    //   name: 'InlineEditTable',
    //   meta: { title: 'Inline Edit' }
    // },
    // {
    //   path: 'complex-table',
    //   component: () => import('@/views/table/complex-table'),
    //   name: 'ComplexTable',
    //   meta: { title: 'Complex Table' }
    // }
  ]
}
export default tableRouter
