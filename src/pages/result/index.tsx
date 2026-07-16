import { useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { SBTIResult } from '../../utils/sbtiScoring'
import './index.scss'

export default function ResultPage() {
  const [showDimensions, setShowDimensions] = useState(false)

  // 从 storage 读取结果
  const resultStr = Taro.getStorageSync('latestResult')
  const result: SBTIResult | null = resultStr ? JSON.parse(resultStr) : null

  const shareTitle = result
    ? `我的SBTI人格是「${result.bestMatch.name}(${result.bestMatch.code})」，匹配度${result.bestMatch.matchPercent}%！你呢？赶紧来测测吧！`
    : 'SBTI人格测试，赶紧来测测吧！'

  // 转发给好友 / 发送给聊天会话
  useShareAppMessage(() => ({
    title: shareTitle,
    path: '/pages/index/index',
  }))

  // 分享到朋友圈
  useShareTimeline(() => ({
    title: shareTitle,
    query: '',
  }))

  const handleRetake = () => {
    Taro.redirectTo({ url: '/pages/test/index' })
  }

  const handleBackHome = () => {
    Taro.switchTab({ url: '/pages/index/index' })
  }

  if (!result) {
    return (
      <View className='result-page'>
        <View className='result-page__empty'>
          <Text>暂无测试结果</Text>
          <View className='btn btn-primary' onClick={handleRetake} style={{ marginTop: '32px', width: '300px' }}>
            <Text>开始测试</Text>
          </View>
        </View>
      </View>
    )
  }

  const { bestMatch, allMatches, dimensions, userPattern, isSpecial, specialReason } = result
  const top5 = allMatches.slice(0, 5)

  return (
    <View className='result-page'>
      {/* 主结果卡片 */}
      <View className='result-page__main-card'>
        <Text className='result-page__name'>{bestMatch.name}</Text>
        <View className='result-page__code-badge'>
          <Text className='result-page__code-text'>{bestMatch.code}</Text>
        </View>
        <Text className='result-page__intro'>{bestMatch.intro}</Text>

        <View className='result-page__match-ring'>
          <Text className='result-page__match-num'>{bestMatch.matchPercent}</Text>
          <Text className='result-page__match-unit'>%</Text>
          <Text className='result-page__match-label'>匹配度</Text>
        </View>

        {isSpecial && specialReason && (
          <View className='result-page__special-tag'>
            <Text>特殊人格</Text>
          </View>
        )}
      </View>

      {/* 描述卡片 */}
      <View className='result-page__card'>
        <Text className='result-page__card-title'>人格解析</Text>
        <Text className='result-page__description'>{bestMatch.description}</Text>
      </View>

      {/* TOP 5 匹配 */}
      <View className='result-page__card'>
        <Text className='result-page__card-title'>TOP 5 匹配类型</Text>
        <View className='result-page__top-list'>
          {top5.map((item, idx) => (
            <View className='result-page__top-item' key={item.code}>
              <View className='result-page__top-rank'>
                <Text className={`result-page__top-rank-num result-page__top-rank-num--${idx + 1}`}>
                  {idx + 1}
                </Text>
              </View>
              <View className='result-page__top-info'>
                <Text className='result-page__top-name'>{item.name}</Text>
                <Text className='result-page__top-code'>{item.code}</Text>
              </View>
              <View className='result-page__top-bar-wrap'>
                <View className='result-page__top-bar'>
                  <View className='result-page__top-bar-fill' style={{ width: `${item.matchPercent}%` }} />
                </View>
                <Text className='result-page__top-percent'>{item.matchPercent}%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 15维度详情 */}
      <View className='result-page__card'>
        <View className='result-page__dim-header' onClick={() => setShowDimensions(!showDimensions)}>
          <Text className='result-page__card-title'>15维度详情</Text>
          <Text className='result-page__dim-toggle'>{showDimensions ? '收起' : '展开'}</Text>
        </View>

        {showDimensions && (
          <>
            <View className='result-page__pattern'>
              <Text className='result-page__pattern-label'>你的模式</Text>
              <Text className='result-page__pattern-value'>{userPattern}</Text>
            </View>
            <View className='result-page__dim-list'>
              {dimensions.map((dim) => (
                <View className='result-page__dim-item' key={dim.dimension}>
                  <View className='result-page__dim-head'>
                    <Text className='result-page__dim-name'>{dim.name}</Text>
                    <Text className={`result-page__dim-level result-page__dim-level--${dim.level}`}>
                      {dim.level === 'H' ? '高' : dim.level === 'M' ? '中' : '低'}
                    </Text>
                  </View>
                  <Text className='result-page__dim-explain'>{dim.explanation}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      {/* 操作按钮 */}
      <View className='result-page__actions'>
        <Button className='btn btn-primary result-page__action-btn result-page__share-btn' openType='share'>
          转发给好友
        </Button>
        <Button className='btn btn-outline result-page__action-btn result-page__share-btn' openType='share'>
          分享到朋友圈
        </Button>
        <View className='btn btn-ghost result-page__action-btn' onClick={handleRetake}>
          <Text>再测一次</Text>
        </View>
        <View className='btn btn-ghost result-page__action-btn' onClick={handleBackHome}>
          <Text>返回首页</Text>
        </View>
      </View>
    </View>
  )
}
