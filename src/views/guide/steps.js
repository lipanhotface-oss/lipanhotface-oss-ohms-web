const steps = [
  {
    element: '#hamburger-container',
    popover: {
      title: '菜单',
      description: '打开并关闭侧边栏',
      position: 'bottom'
    }
  },
  {
    element: '#breadcrumb-container',
    popover: {
      title: '面包屑',
      description: '指示当前页面位置',
      position: 'bottom'
    }
  },
  {
    element: '#header-search',
    popover: {
      title: '页面搜索',
      description: '搜索页面，点击前往',
      position: 'left'
    }
  },
  {
    element: '#screenfull',
    popover: {
      title: '全屏',
      description: '设置页面全屏或退出全屏',
      position: 'left'
    }
  },
  {
    element: '#size-select',
    popover: {
      title: '字体大小',
      description: '切换系统字体大小',
      position: 'left'
    }
  },
  {
    element: '#tags-view-container',
    popover: {
      title: '已打开窗口管理',
      description: '您访问的页面的历史记录',
      position: 'bottom'
    },
    padding: 0
  }
]

export default steps
