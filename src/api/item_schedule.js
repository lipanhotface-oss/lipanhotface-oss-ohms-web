import request from '@/utils/request'

export function getItemWeekPlans(query) {
    return request({
      url: '/vue-element-admin/itemSchedule/get_item_week_plans',
      method: 'get',
      params: query
    })
  }