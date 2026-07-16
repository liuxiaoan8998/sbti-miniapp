export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/test/index',
    'pages/result/index',
    'pages/ranking/index',
    'pages/profile/index',
    'pages/privacy/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#6C63FF',
    navigationBarTitleText: 'SBTI人格测试',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#6C63FF',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
      },
      {
        pagePath: 'pages/ranking/index',
        text: '排行榜',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
      },
    ]
  }
})
