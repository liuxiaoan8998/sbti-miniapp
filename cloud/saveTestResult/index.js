// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()
const ALLOWED_COLLECTIONS = new Set(['test_results', 'test_results_dev'])

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { result, collectionName = 'test_results' } = event

  if (!result) {
    return { success: false, error: '缺少 result 参数' }
  }

  if (!ALLOWED_COLLECTIONS.has(collectionName)) {
    return { success: false, error: '非法集合名' }
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

    const res = await db.collection(collectionName).add({
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
