const Mock = require('mockjs')
const { deepClone } = require('../utils')
const { asyncRoutes, constantRoutes } = require('./routes.js')

const routes = deepClone([...constantRoutes, ...asyncRoutes])

const roles = [
  {
    key: 'admin',
    name: 'admin',
    description: '超级管理员，拥有软件的所有权限.',
    routes: routes
  },
  {
    key: 'editor',
    name: '开发人员',
    description: '拥有对测试设备所有功能的开发使用权限。',
    routes: routes.filter(i => i.path !== '/permission')// just a mock
  },
  {
    key: 'test_editor',
    name: '测试开发人员',
    description: '仅拥有测试配置，测试脚本开发，测试执行，测试数据查看的权限。',
    routes: routes.filter(i => i.path !== '/permission')// just a mock
  },
  {
    key: 'task',
    name: '课题人员',
    description: '拥有测试程序编辑，测试执行，数据监控的权限。',
    routes: routes.filter(i => i.path !== '/permission')// just a mock
  },
  {
    key: 'tester',
    name: '检验',
    description: '拥有测试执行，结果查看的权限。',
    routes: routes.filter(i => i.path !== '/permission')// just a mock
  },
  {
    key: 'visitor',
    name: 'visitor',
    description: '仅拥有查看大屏看板的权限',
    routes: [{
      path: '',
      redirect: 'dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          meta: { title: 'dashboard', icon: 'dashboard' }
        }
      ]
    }]
  }
]
const users = [
  {
    key: 'admin',
    name: 'admin',
    dept: '综合管理部',
    role: '超级管理员',
    description: '超级管理员，拥有软件的所有权限.',
    routes: routes
  },
  {
    key: 'feitian',
    name: '会飞的',
    dept: '九室',
    role: '超级管理员',
    description: '',
    routes: routes.filter(i => i.path !== '/permission')// just a mock
  },
  {
    key: 'liumazi',
    name: '刘麻子',
    dept: '八室',
    role: '开发人员',
    description: '',
    routes: routes.filter(i => i.path !== '/permission')// just a mock
  },
  {
    key: 'zhangsan',
    name: '张三',
    dept: '七室',
    role: '测试开发人员',
    description: '',
    routes: routes.filter(i => i.path !== '/permission')// just a mock
  },
  {
    key: 'lisi',
    name: '李四',
    dept: '五室',
    role: '课题人员',
    description: '',
    routes: routes.filter(i => i.path !== '/permission')// just a mock
  },
  {
    key: 'wangwu',
    name: '王五',
    dept: '外协',
    role: 'visitor',
    description: '仅拥有查看大屏看板的权限',
    routes: [{
      path: '',
      redirect: 'dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          meta: { title: 'dashboard', icon: 'dashboard' }
        }
      ]
    }]
  }
]
module.exports = [
  // mock get all routes form server
  {
    url: '/vue-element-admin/routes',
    type: 'get',
    response: _ => {
      return {
        code: 20000,
        data: routes
      }
    }
  },

  // mock get all roles form server
  {
    url: '/vue-element-admin/roles',
    type: 'get',
    response: _ => {
      return {
        code: 20000,
        data: roles
      }
    }
  },
  {
    url: '/vue-element-admin/users',
    type: 'get',
    response: _ => {
      return {
        code: 20000,
        data: users
      }
    }
  },
  // add role
  {
    url: '/vue-element-admin/role',
    type: 'post',
    response: {
      code: 20000,
      data: {
        key: Mock.mock('@integer(300, 5000)')
      }
    }
  },

  // update role
  {
    url: '/vue-element-admin/role/[A-Za-z0-9]',
    type: 'put',
    response: {
      code: 20000,
      data: {
        status: 'success'
      }
    }
  },

  // delete role
  {
    url: '/vue-element-admin/role/[A-Za-z0-9]',
    type: 'delete',
    response: {
      code: 20000,
      data: {
        status: 'success'
      }
    }
  }
]
