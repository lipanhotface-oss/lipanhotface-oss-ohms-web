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
