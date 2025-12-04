import request from '@/utils/request'

export function getRoutes() {
  return request({
    url: '/vue-element-admin/routes',
    method: 'get'
  })
}
export function  getUserInfo(params) {
  console.log(111111111111111);
  console.log(params);
  return request({
    url: '/api/query',
    method: 'get',
    params: params
  })
}
export function getRoles() {
  return request({
    url: '/vue-element-admin/roles',
    method: 'get'
  })
}
export function getUsers() {
  return request({
    url: '/vue-element-admin/users',
    method: 'get'
  })
}
export function addRole(data) {
  return request({
    url: '/vue-element-admin/role',
    method: 'post',
    data
  })
}

export function updateRole(id, data) {
  return request({
    url: `/vue-element-admin/role/${id}`,
    method: 'put',
    data
  })
}

export function deleteRole(id) {
  return request({
    url: `/vue-element-admin/role/${id}`,
    method: 'delete'
  })
}
