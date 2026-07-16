// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { result } = event

  if (!result) {
    return { success: false, error: '缺少 result 参数' }
  }

  try {
    const record = {
      _openid: wxContext.OPENID,
      code: result.bestMatch.code,
      name: result.bestMatch.name,
      matchPercent: result.bestMatch.matchPercent,
      userPattern: result.userPattern,
      isSpecial: result.isSpecial,
      result: result,
      createdAt: db.serverDate(),
    }

    const res = await db.collection('test_results').add({
      data: record,
    })

    return {
      success: true,
      _id: res._id,
    }
  } catch (err) {
    console.error('saveTestResult error:', err)
    return {
      success: false,
      error: err.message || '保存失败',
    }
  }
}
