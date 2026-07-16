import { useState, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { CloudTestRecord, getTestHistory, clearTestHistory } from '../../services/cloud'
import './index.scss'

export default function ProfilePage() {
  const [history, setHistory] = useState<CloudTestRecord[]>([])
  const [loading, setLoading] = useState(false)

  // 每次页面显示时从云数据库加载历史
  useDidShow(async () => {
    setLoading(true)
    const list = await getTestHistory()
    setHistory(list)
    setLoading(false)
  })

  const handleViewDetail = useCallback((item: CloudTestRecord) => {
    Taro.setStorageSync('latestResult', JSON.stringify(item.result))
    Taro.navigateTo({ url: '/pages/result/index' })
  }, [])

  const handleClearHistory = useCallback(() => {
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有测试历史吗？此操作不可恢复。',
      success: async (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '清空中...', mask: true })
          const result = await clearTestHistory()
          Taro.hideLoading()
          if (result.success) {
            setHistory([])
            Taro.showToast({ title: '已清空', icon: 'success' })
          } else {
            Taro.showToast({ title: '清空失败', icon: 'none' })
          }
        }
      },
    })
  }, [])

  const handleStartTest = () => {
    Taro.navigateTo({ url: '/pages/test/index' })
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const min = date.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${hour}:${min}`
  }

  return (
    <View className='profile-page'>
      {/* 头部 */}
      <View className='profile-page__header'>
        <Text className='profile-page__title'>测试记录</Text>
        {history.length > 0 && (
          <Text className='profile-page__count'>共 {history.length} 次测试</Text>
        )}
      </View>

      {/* 加载中 */}
      {loading && (
        <View className='profile-page__loading'>
          <Text>加载中...</Text>
        </View>
      )}

      {/* 历史列表 */}
      {!loading && history.length > 0 && (
        <View className='profile-page__list'>
          {history.map((item) => (
            <View
              className='profile-page__item'
              key={item._id}
              onClick={() => handleViewDetail(item)}
            >
              <View className='profile-page__item-left'>
                <View className='profile-page__item-info'>
                  <Text className='profile-page__item-name'>{item.name}</Text>
                  <Text className='profile-page__item-code'>{item.code}</Text>
                  <Text className='profile-page__item-time'>{formatTime(item.createdAt)}</Text>
                </View>
              </View>
              <View className='profile-page__item-right'>
                <Text className='profile-page__item-percent'>{item.matchPercent}%</Text>
                <Text className='profile-page__item-label'>匹配度</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 空状态 */}
      {!loading && history.length === 0 && (
        <View className='profile-page__empty'>
          <Text className='profile-page__empty-icon'>📋</Text>
          <Text className='profile-page__empty-text'>暂无测试记录</Text>
          <View className='btn btn-primary profile-page__empty-btn' onClick={handleStartTest}>
            <Text>去测一测</Text>
          </View>
        </View>
      )}

      {/* 清空按钮 */}
      {history.length > 0 && (
        <View className='profile-page__footer'>
          <View className='btn btn-ghost profile-page__clear-btn' onClick={handleClearHistory}>
            <Text>清空历史记录</Text>
          </View>
        </View>
      )}

      {/* 隐私政策入口 */}
      <View className='profile-page__privacy'>
        <Text
          className='profile-page__privacy-link'
          onClick={() => Taro.navigateTo({ url: '/pages/privacy/index' })}
        >
          隐私政策
        </Text>
      </View>
    </View>
  )
}
