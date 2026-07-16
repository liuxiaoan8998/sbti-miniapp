import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import personalityData from '../../data/personalityTypes.json'
import './index.scss'

export default function RankingPage() {
  const [expandedCode, setExpandedCode] = useState<string | null>(null)

  const types = personalityData.types

  const toggleExpand = (code: string) => {
    setExpandedCode((prev) => (prev === code ? null : code))
  }

  // 分类：常规、兜底、特殊
  const normalTypes = types.filter((t) => !t.isFallback && !t.isSpecial)
  const specialTypes = types.filter((t) => t.isFallback || t.isSpecial)

  return (
    <View className='ranking-page'>
      {/* 标题 */}
      <View className='ranking-page__header'>
        <Text className='ranking-page__title'>全部人格类型</Text>
        <Text className='ranking-page__count'>共 {types.length} 种人格</Text>
      </View>

      {/* 常规人格列表 */}
      <View className='ranking-page__section'>
        <Text className='ranking-page__section-title'>常规人格 ({normalTypes.length})</Text>
        {normalTypes.map((type, idx) => (
          <View
            className={`ranking-page__card ${expandedCode === type.code ? 'ranking-page__card--expanded' : ''}`}
            key={type.code}
            onClick={() => toggleExpand(type.code)}
          >
            <View className='ranking-page__card-header'>
              <View className='ranking-page__card-index'>
                <Text>{idx + 1}</Text>
              </View>
              <View className='ranking-page__card-main'>
                <View className='ranking-page__card-row'>
                  <Text className='ranking-page__card-name'>{type.name}</Text>
                  <Text className='ranking-page__card-code'>{type.code}</Text>
                </View>
                <Text className='ranking-page__card-intro'>{type.intro}</Text>
              </View>
              <Text className='ranking-page__card-arrow'>
                {expandedCode === type.code ? '收起' : '详情'}
              </Text>
            </View>
            {expandedCode === type.code && (
              <View className='ranking-page__card-body'>
                <Text className='ranking-page__card-desc'>{type.description}</Text>
                {type.pattern && (
                  <View className='ranking-page__card-pattern'>
                    <Text className='ranking-page__card-pattern-label'>模式</Text>
                    <Text className='ranking-page__card-pattern-value'>{type.pattern}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* 特殊人格 */}
      <View className='ranking-page__section'>
        <Text className='ranking-page__section-title'>特殊人格 ({specialTypes.length})</Text>
        {specialTypes.map((type) => (
          <View
            className={`ranking-page__card ranking-page__card--special ${expandedCode === type.code ? 'ranking-page__card--expanded' : ''}`}
            key={type.code}
            onClick={() => toggleExpand(type.code)}
          >
            <View className='ranking-page__card-header'>
              <View className='ranking-page__card-index ranking-page__card-index--special'>
                <Text>*</Text>
              </View>
              <View className='ranking-page__card-main'>
                <View className='ranking-page__card-row'>
                  <Text className='ranking-page__card-name'>{type.name}</Text>
                  <Text className='ranking-page__card-code'>{type.code}</Text>
                  <View className='ranking-page__special-badge'>
                    <Text>{type.isFallback ? '兜底' : '隐藏'}</Text>
                  </View>
                </View>
                <Text className='ranking-page__card-intro'>{type.intro}</Text>
              </View>
              <Text className='ranking-page__card-arrow'>
                {expandedCode === type.code ? '收起' : '详情'}
              </Text>
            </View>
            {expandedCode === type.code && (
              <View className='ranking-page__card-body'>
                <Text className='ranking-page__card-desc'>{type.description}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  )
}
