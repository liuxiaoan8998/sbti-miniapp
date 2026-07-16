import { View, Text } from '@tarojs/components'
import './index.scss'

export default function PrivacyPage() {
  return (
    <View className='privacy-page'>
      <Text className='privacy-page__title'>隐私政策</Text>
      <Text className='privacy-page__date'>更新日期：2026年7月16日</Text>

      <View className='privacy-page__section'>
        <Text className='privacy-page__subtitle'>一、信息收集</Text>
        <Text className='privacy-page__text'>
          我们仅收集您在使用本小程序时产生的测试作答数据和测试结果，用于为您提供个性化的测试报告和历史记录查询服务。我们不会收集您的真实姓名、手机号码、身份证号等个人敏感信息。
        </Text>
      </View>

      <View className='privacy-page__section'>
        <Text className='privacy-page__subtitle'>二、信息使用</Text>
        <Text className='privacy-page__text'>
          您的测试数据仅用于生成SBTI人格测试结果，帮助您了解自身人格特征。我们不会将您的数据用于广告投放、商业分析或任何与测试服务无关的目的。
        </Text>
      </View>

      <View className='privacy-page__section'>
        <Text className='privacy-page__subtitle'>三、信息存储</Text>
        <Text className='privacy-page__text'>
          您的测试数据通过微信云开发服务安全存储，数据访问受微信平台安全机制保护。您可以随时在"我的"页面中清空历史记录，清空后数据将被永久删除，无法恢复。
        </Text>
      </View>

      <View className='privacy-page__section'>
        <Text className='privacy-page__subtitle'>四、信息共享</Text>
        <Text className='privacy-page__text'>
          我们不会向任何第三方共享、转让或出售您的个人信息。您的测试结果仅在您主动使用分享功能时，以摘要形式（人格类型代号和匹配度）发送给指定的微信好友或朋友圈。
        </Text>
      </View>

      <View className='privacy-page__section'>
        <Text className='privacy-page__subtitle'>五、未成年人保护</Text>
        <Text className='privacy-page__text'>
          本小程序面向所有年龄段用户。如您为未满14周岁的未成年人，建议在监护人的陪同下使用本服务。
        </Text>
      </View>

      <View className='privacy-page__section'>
        <Text className='privacy-page__subtitle'>六、政策更新</Text>
        <Text className='privacy-page__text'>
          如本隐私政策发生变更，我们将在小程序内发布更新通知。继续使用本小程序即表示您同意更新后的隐私政策。
        </Text>
      </View>

      <View className='privacy-page__footer'>
        <Text className='privacy-page__contact'>
          如有任何疑问，欢迎通过小程序内反馈与我们联系。
        </Text>
      </View>
    </View>
  )
}
