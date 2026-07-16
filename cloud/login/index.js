// 云函数入口文件 - 微信静默登录，返回 openID
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  return {
    openID: wxContext.OPENID,
    appID: wxContext.APPID,
    unionID: wxContext.UNIONID || '',
  }
}
