import request from '@/utils/request'

export function uploadScript(formData) {
  return request({
    url: '/api/scripts/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取服务器上已上传的脚本文件列表
export function getScriptList() {
  return request({
    url: '/api/scripts/list',
    method: 'get'
  })
}

// 读取菜单配置从数据库
export function getMenuConfig() {
  return request({
    url: '/api/scripts/config',
    method: 'get'
  })
}

// 保存菜单配置到数据库
export function saveMenuConfig(configData) {
  return request({
    url: '/api/scripts/config',
    method: 'post',
    data: configData
  })
}

// 获取全部需求列表
export function getRequirementList() {
  return request({
    url: '/api/requirements',
    method: 'get'
  })
}

// 保存需求列表到数据库
export function saveRequirementList(requirementsData) {
  return request({
    url: '/api/requirements',
    method: 'post',
    data: requirementsData
  })
}
