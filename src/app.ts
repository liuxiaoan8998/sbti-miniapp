import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { login } from './services/cloud'

import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(async () => {
    console.log('App launched.')

    // 初始化云开发
    if (!process.env.TARO_APP_CLOUD_ENV_ID) {
      console.warn('TARO_APP_CLOUD_ENV_ID not set, cloud features disabled.')
      return
    }

    Taro.cloud.init({
      env: process.env.TARO_APP_CLOUD_ENV_ID,
      traceUser: true,
    })
    console.log('Cloud initialized, env:', process.env.TARO_APP_CLOUD_ENV_ID)

    // 隐私授权被动监听（安全兆底）
    // 注册后如果未响应 resolve，微信会自动弹出官方默认授权弹窗
    if (typeof Taro.onNeedPrivacyAuthorization === 'function') {
      Taro.onNeedPrivacyAuthorization((_resolve: Function, eventInfo: { referrer: string }) => {
        console.log('[privacy] Need authorization for:', eventInfo.referrer)
        // 不调用 resolve，让微信官方隐私弹窗自动弹出处理
      })
    }

    // 静默登录，获取 openID
    const loginRes = await login()
    if (loginRes.success) {
      console.log('Silent login done, openID:', loginRes.openID)
    } else {
      console.warn('Silent login failed:', loginRes.error)
    }
  })

  // children 是将要会渲染的页面
  return children
}

export default App
