const express = require('express')
const cloudbase = require('@cloudbase/node-sdk')

const app = express()
const port = Number(process.env.PORT || 80)
const collectionName = process.env.COLLECTION_NAME || 'test_results'
const allowedCollections = new Set(['test_results'])

const tcbApp = cloudbase.init({
  env: process.env.TCB_ENV_ID || process.env.TCB_ENV || process.env.CLOUDBASE_ENV_ID,
})
const db = tcbApp.database()

app.use(express.json({ limit: '1mb' }))

function send(res, statusCode, payload) {
  res.status(statusCode).json(payload)
}

function getOpenId(req) {
  return req.headers['x-wx-openid'] || req.headers['x-openid'] || ''
}

function assertCollection() {
  if (!allowedCollections.has(collectionName)) {
    throw new Error(`Invalid collection name: ${collectionName}`)
  }
}

app.get('/healthz', (_req, res) => {
  send(res, 200, { ok: true, service: process.env.K_SERVICE || 'stbi-prod' })
})

app.get('/api/login', (req, res) => {
  const openID = getOpenId(req)
  if (!openID) {
    return send(res, 401, { success: false, error: '未获取到 openID' })
  }

  return send(res, 200, {
    success: true,
    openID,
    unionID: req.headers['x-wx-unionid'] || '',
  })
})

app.post('/api/test-results', async (req, res) => {
  try {
    assertCollection()

    const openID = getOpenId(req)
    if (!openID) {
      return send(res, 401, { success: false, error: '未获取到 openID' })
    }

    const { result } = req.body || {}
    if (!result || !result.bestMatch) {
      return send(res, 400, { success: false, error: '缺少 result 参数' })
    }

    const record = {
      _openid: openID,
      code: result.bestMatch.code,
      name: result.bestMatch.name,
      matchPercent: result.bestMatch.matchPercent,
      userPattern: result.userPattern,
      isSpecial: result.isSpecial,
      result,
      createdAt: db.serverDate(),
    }

    const addRes = await db.collection(collectionName).add(record)
    return send(res, 200, { success: true, _id: addRes.id || addRes._id })
  } catch (err) {
    console.error('save test result failed:', err)
    return send(res, 500, { success: false, error: err.message || '保存失败' })
  }
})

app.get('/api/test-results', async (req, res) => {
  try {
    assertCollection()

    const openID = getOpenId(req)
    if (!openID) {
      return send(res, 401, { success: false, error: '未获取到 openID' })
    }

    const limit = Math.min(Number(req.query.limit || 50), 100)
    const queryRes = await db
      .collection(collectionName)
      .where({ _openid: openID })
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    return send(res, 200, { success: true, data: queryRes.data || [] })
  } catch (err) {
    console.error('get test history failed:', err)
    return send(res, 500, { success: false, error: err.message || '获取失败' })
  }
})

app.delete('/api/test-results', async (req, res) => {
  try {
    assertCollection()

    const openID = getOpenId(req)
    if (!openID) {
      return send(res, 401, { success: false, error: '未获取到 openID' })
    }

    const queryRes = await db
      .collection(collectionName)
      .where({ _openid: openID })
      .limit(100)
      .get()

    const records = queryRes.data || []
    for (const record of records) {
      await db.collection(collectionName).doc(record._id).remove()
    }

    return send(res, 200, { success: true, removed: records.length })
  } catch (err) {
    console.error('clear test history failed:', err)
    return send(res, 500, { success: false, error: err.message || '清空失败' })
  }
})

app.use((_req, res) => {
  send(res, 404, { success: false, error: 'Not Found' })
})

app.listen(port, () => {
  console.log(`SBTI cloudrun service listening on ${port}`)
})
