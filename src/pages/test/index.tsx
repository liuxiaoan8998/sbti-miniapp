import { useState, useMemo, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import questionsData from '../../data/questions.json'
import { calculateSBTI, UserAnswers } from '../../utils/sbtiScoring'
import { saveTestResult } from '../../services/cloud'
import './index.scss'

interface QuestionItem {
  id: string
  text: string
  options: { label: string; value: number }[]
  isSpecial?: boolean
}

export default function TestPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<UserAnswers>({})

  // 完成测试：计算结果、保存到本地+云端、跳转结果页
  const finishTest = useCallback(async (finalAnswers: UserAnswers) => {
    Taro.showLoading({ title: '生成报告中...', mask: true })

    const result = calculateSBTI(finalAnswers)

    // 本地存储最新结果
    Taro.setStorageSync('latestResult', JSON.stringify(result))

    // 前端直写云数据库
    try {
      const res = await saveTestResult(result)
      if (res.success) {
        console.log('[test] Cloud save OK, _id:', res._id)
      } else {
        console.error('[test] Cloud save failed:', res.error)
        Taro.showToast({ title: `保存失败: ${res.error}`, icon: 'none', duration: 3000 })
      }
    } catch (err: any) {
      console.error('[test] Cloud save error:', err)
      Taro.showToast({ title: '云存储异常，结果仅保存在本地', icon: 'none', duration: 3000 })
    }

    Taro.hideLoading()
    Taro.redirectTo({ url: '/pages/result/index' })
  }, [])

  // 构建题目列表：30道常规题 + 特殊题动态插入
  const allQuestions = useMemo<QuestionItem[]>(() => {
    const list: QuestionItem[] = questionsData.questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options,
    }))
    // 特殊题：drink_gate_q1 始终加入，drink_gate_q2 根据条件动态显示
    const specials = questionsData.specialQuestions || []
    specials.forEach((sq) => {
      list.push({
        id: sq.id,
        text: sq.text,
        options: sq.options,
        isSpecial: true,
      })
    })
    return list
  }, [])

  // 过滤出当前应显示的题目（drink_gate_q2 只在选了饮酒后出现）
  const visibleQuestions = useMemo<QuestionItem[]>(() => {
    return allQuestions.filter((q) => {
      if (q.id === 'drink_gate_q2') {
        return answers['drink_gate_q1'] === 3
      }
      return true
    })
  }, [allQuestions, answers])

  const totalQuestions = visibleQuestions.length
  const currentQuestion = visibleQuestions[currentIndex]
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0

  const handleSelect = useCallback((value: number) => {
    if (!currentQuestion) return

    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)

    // 自动跳下一题（延迟让用户看到选中效果）
    if (currentIndex < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
      }, 300)
    } else {
      // 最后一题，完成测试
      setTimeout(() => {
        finishTest(newAnswers)
      }, 400)
    }
  }, [answers, currentIndex, currentQuestion, totalQuestions])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }, [currentIndex])

  const handleNext = useCallback(() => {
    if (!currentQuestion) return

    if (currentIndex < totalQuestions - 1) {
      // 直接跳到下一题，当前题可以未回答，后续可通过上一题返回补答
      setCurrentIndex((prev) => prev + 1)
    } else {
      // 最后一题，完成测试（未回答的题目计为0分）
      finishTest(answers)
    }
  }, [answers, currentIndex, currentQuestion, totalQuestions])

  if (!currentQuestion) {
    return (
      <View className='test-page'>
        <Text>加载中...</Text>
      </View>
    )
  }

  const selectedValue = answers[currentQuestion.id]

  return (
    <View className='test-page'>
      {/* 进度条 */}
      <View className='test-page__progress'>
        <View className='test-page__progress-bar'>
          <View className='test-page__progress-fill' style={{ width: `${progress}%` }} />
        </View>
        <Text className='test-page__progress-text'>
          {currentIndex + 1} / {totalQuestions}
        </Text>
      </View>

      {/* 题目区域 */}
      <View className='test-page__question-card'>
        <Text className='test-page__question-text'>{currentQuestion.text}</Text>
      </View>

      {/* 选项区域 */}
      <View className='test-page__options'>
        {currentQuestion.options.map((opt) => (
          <View
            key={opt.value}
            className={`test-page__option ${selectedValue === opt.value ? 'test-page__option--selected' : ''}`}
            onClick={() => handleSelect(opt.value)}
          >
            <Text className='test-page__option-text'>{opt.label}</Text>
            <View className={`test-page__option-radio ${selectedValue === opt.value ? 'test-page__option-radio--active' : ''}`}>
              {selectedValue === opt.value && <View className='test-page__option-radio-dot' />}
            </View>
          </View>
        ))}
      </View>

      {/* 底部导航：上一题 + 下一题 */}
      <View className='test-page__nav'>
        {currentIndex > 0 ? (
          <View className='btn btn-ghost test-page__nav-btn' onClick={handlePrev}>
            <Text>上一题</Text>
          </View>
        ) : (
          <View className='test-page__nav-placeholder' />
        )}
        <View
          className='btn btn-primary test-page__nav-btn'
          onClick={handleNext}
        >
          <Text>{currentIndex < totalQuestions - 1 ? '下一题' : '查看结果'}</Text>
        </View>
      </View>
    </View>
  )
}
