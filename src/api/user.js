import request from '@/utils/request'

// export function login(data) {
//   console.log("data,",data);
//   return request({
//     url: '/vue-element-admin/user/login',
//     method: 'post',
//     data
//   })
// }

export function getInfo(token) {
  return request({
    url: '/vue-element-admin/user/info',
    method: 'get',
    params: { token }
  })
}

export function logout() {
  return request({
    url: '/vue-element-admin/user/logout',
    method: 'post'
  })
}

export function login(query) {
  console.log(query);
  return request({
    url: '/vue-element-admin/user/login',
    method: 'get',
    params: query
  })
}