import Taro from '@tarojs/taro'
import { SBTIResult } from '../utils/sbtiScoring'

// ─── 本地存储 Key ──────────────────────────────────────────────
const OPENID_KEY = 'user_openid'
const TEST_RESULTS_COLLECTION = process.env.TARO_APP_TEST_RESULTS_COLLECTION || 'test_results'
const BACKEND_MODE = process.env.TARO_APP_BACKEND_MODE || 'cloudfunction'
const CLOUD_RUN_SERVICE = process.env.TARO_APP_CLOUD_RUN_SERVICE

// ─── 登录信息 ────────────────────────────────────────────────
export interface LoginInfo {
  openID: string
  appID?: string
  unionID: string
}

interface CloudRunResponse<T = any> {
  success: boolean
  data?: T
  openID?: string
  unionID?: string
  _id?: string
  removed?: number
  error?: string
}

function useCloudRun(): boolean {
  return BACKEND_MODE === 'cloudrun'
}

async function callCloudRun<T = any>(
  path: string,
  method: 'GET' | 'POST' | 'DELETE',
  data?: Record<string, any>,
): Promise<CloudRunResponse<T>> {
  if (!CLOUD_RUN_SERVICE) {
    return { success: false, error: '云托管服务名未配置' }
  }

  const res = await Taro.cloud.callContainer({
    path,
    method,
    data,
    header: {
      'content-type': 'application/json',
      'X-WX-SERVICE': CLOUD_RUN_SERVICE,
    },
  } as any)

  return res.data as CloudRunResponse<T>
}

// ─── 微信静默登录（调用云函数获取 openID） ─────────────────
export async function login(): Promise<{ success: boolean; openID?: string; error?: string }> {
  try {
    // Taro.login() 触发微信登录态，云函数可自动获取 openID
    await Taro.login()

    if (useCloudRun()) {
      const data = await callCloudRun('/api/login', 'GET')

      if (data && data.success && data.openID) {
        Taro.setStorageSync(OPENID_KEY, data.openID)
        console.log('[cloudrun] login OK, openID:', data.openID)
        return { success: true, openID: data.openID }
      }

      return { success: false, error: data?.error || '云托管未返回 openID' }
    }

    const res = await Taro.cloud.callFunction({
      name: 'login',
      data: {},
    })
    const data = res.result as LoginInfo

    if (data && data.openID) {
      Taro.setStorageSync(OPENID_KEY, data.openID)
      console.log('[cloud] login OK, openID:', data.openID)
      return { success: true, openID: data.openID }
    }

    return { success: false, error: '云函数未返回 openID' }
  } catch (err: any) {
    console.error('[cloud] login failed:', err)
    return { success: false, error: err.errMsg || err.message || '登录失败' }
  }
}

// ─── 获取本地缓存的 openID ──────────────────────────────────
export function getOpenID(): string {
  return Taro.getStorageSync(OPENID_KEY) || ''
}

// ─── 云数据库记录结构 ────────────────────────────────────────
export interface CloudTestRecord {
  _id: string
  _openid: string
  code: string
  name: string
  matchPercent: number
  userPattern: string
  isSpecial: boolean
  result: SBTIResult
  createdAt: string
}

// ─── 保存测试结果（调用云函数写入云数据库） ─────────────────
export async function saveTestResult(result: SBTIResult): Promise<{ success: boolean; _id?: string; error?: string }> {
  try {
    if (useCloudRun()) {
      const data = await callCloudRun('/api/test-results', 'POST', { result })

      if (data && data.success) {
        return { success: true, _id: data._id }
      }

      return { success: false, error: data?.error || '云托管保存失败' }
    }

    const res = await Taro.cloud.callFunction({
      name: 'saveTestResult',
      data: {
        result,
        collectionName: TEST_RESULTS_COLLECTION,
      },
    })
    const data = res.result as { success: boolean; _id?: string; error?: string }

    if (data && data.success) {
      return { success: true, _id: data._id }
    }

    return { success: false, error: (data && data.error) || '云函数保存失败' }
  } catch (err: any) {
    console.error('[cloud] saveTestResult failed:', err)
    return { success: false, error: err.errMsg || err.message || '写入云数据库失败' }
  }
}

// ─── 获取测试历史（从云数据库直读） ──────────────────────────
export async function getTestHistory(pageSize = 50): Promise<CloudTestRecord[]> {
  try {
    if (useCloudRun()) {
      const data = await callCloudRun<CloudTestRecord[]>(`/api/test-results?limit=${pageSize}`, 'GET')
      return data.success ? (data.data || []) : []
    }

    const db = Taro.cloud.database()
    const res = await db
      .collection(TEST_RESULTS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(pageSize)
      .get()

    return res.data as CloudTestRecord[]
  } catch (err) {
    console.error('[cloud] getTestHistory failed:', err)
    return []
  }
}

// ─── 清空测试历史（从云数据库删除当前用户所有记录） ─────────
export async function clearTestHistory(): Promise<{ success: boolean; removed?: number }> {
  try {
    if (useCloudRun()) {
      const data = await callCloudRun('/api/test-results', 'DELETE')
      return { success: data.success, removed: data.removed }
    }

    const db = Taro.cloud.database()
    const records = await getTestHistory(100)
    let removed = 0
    for (const record of records) {
      await db.collection(TEST_RESULTS_COLLECTION).doc(record._id).remove({})
      removed++
    }
    return { success: true, removed }
  } catch (err) {
    console.error('[cloud] clearTestHistory failed:', err)
    return { success: false }
  }
}
