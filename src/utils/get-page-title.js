import defaultSettings from '@/settings'

const title = defaultSettings.title || '维护系统测试工具'

export default function getPageTitle(pageTitle) {
  if (pageTitle) {
    return `${pageTitle} - ${title}`
  }
  return `${title}`
}
