import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Index() {
  const handleStart = () => {
    Taro.navigateTo({ url: '/pages/test/index' })
  }

  return (
    <View className='home'>
      {/* 头部装饰区 */}
      <View className='home__hero'>
        <View className='home__hero-bg' />
        <View className='home__hero-content'>
          <Text className='home__badge'>SBTI</Text>
          <Text className='home__title'>人格类型测试</Text>
          <Text className='home__subtitle'>Soul-Behavior-Thinking-Identity</Text>
        </View>
      </View>

      {/* 介绍区 */}
      <View className='home__intro'>
        <View className='home__intro-card'>
          <Text className='home__intro-title'>什么是 SBTI？</Text>
          <Text className='home__intro-text'>
            SBTI 是一套基于五大心理模型的人格评估体系，从自我认知、情感模式、态度倾向、行动驱力、社交风格五个维度，全面解析你的内心世界。
          </Text>
        </View>

        <View className='home__stats'>
          <View className='home__stat-item'>
            <Text className='home__stat-num'>15</Text>
            <Text className='home__stat-label'>心理维度</Text>
          </View>
          <View className='home__stat-item'>
            <Text className='home__stat-num'>30+</Text>
            <Text className='home__stat-label'>测试题目</Text>
          </View>
          <View className='home__stat-item'>
            <Text className='home__stat-num'>27</Text>
            <Text className='home__stat-label'>人格类型</Text>
          </View>
        </View>

        <View className='home__models'>
          <Text className='home__models-title'>五大心理模型</Text>
          <View className='home__model-list'>
            {['自我模型', '情感模型', '态度模型', '行动驱力模型', '社交模型'].map((m) => (
              <View className='home__model-tag' key={m}>
                <Text>{m}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 开始按钮 */}
      <View className='home__action'>
        <View className='btn btn-primary home__start-btn' onClick={handleStart}>
          <Text>开始测试</Text>
        </View>
        <Text className='home__tip'>测试约需 3-5 分钟，请认真作答</Text>
      </View>
    </View>
  )
}
