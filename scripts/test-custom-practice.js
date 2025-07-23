#!/usr/bin/env node
// Custom Practice功能测试脚本 - 更新于 2024-01-21 05:20:00

// 使用内置fetch（Node.js 18+）
const fetch = globalThis.fetch

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// 测试配置
const TEST_CONFIG = {
  userId: 'demo-user-123',
  questionCount: 20,
  questionType: 'mixed',
  timeout: 30000
}

// 测试结果
class TestResult {
  constructor() {
    this.passed = 0
    this.failed = 0
    this.details = []
  }

  addTest(name, passed, details = {}) {
    if (passed) {
      this.passed++
      console.log(`✅ ${name}: PASSED`)
    } else {
      this.failed++
      console.log(`❌ ${name}: FAILED`)
    }
    
    this.details.push({
      name,
      passed,
      details,
      timestamp: new Date().toISOString()
    })
  }

  generateReport() {
    console.log('\n📊 测试报告')
    console.log('=' * 50)
    console.log(`总测试数: ${this.passed + this.failed}`)
    console.log(`通过: ${this.passed}`)
    console.log(`失败: ${this.failed}`)
    console.log(`成功率: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(2)}%`)
    
    if (this.failed > 0) {
      console.log('\n❌ 失败的测试:')
      this.details.filter(d => !d.passed).forEach(d => {
        console.log(`- ${d.name}: ${JSON.stringify(d.details)}`)
      })
    }
  }
}

// 测试AI性能监控
async function testAIPerformance() {
  try {
    const response = await fetch(`${BASE_URL}/api/ai/performance`)
    const data = await response.json()
    
    return {
      success: data.success,
      cacheStats: data.data?.cache,
      recommendations: data.data?.recommendations
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// 测试题目生成API
async function testQuestionGeneration() {
  try {
    const startTime = Date.now()
    const response = await fetch(`${BASE_URL}/api/generate-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: TEST_CONFIG.userId,
        questionType: TEST_CONFIG.questionType,
        count: TEST_CONFIG.questionCount
      })
    })
    
    const data = await response.json()
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    return {
      success: data.success,
      questionCount: data.questions?.length || 0,
      responseTime,
      isFallback: data.metadata?.isFallback,
      fallbackType: data.metadata?.fallbackType,
      metadata: data.metadata
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// 测试Custom Practice Session
async function testCustomPracticeSession() {
  try {
    const sessionId = `practice_${Date.now()}_test`
    
    // 创建session
    const createResponse = await fetch(`${BASE_URL}/api/practice/${sessionId}`, {
      method: 'GET'
    })
    
    const sessionData = await createResponse.json()
    
    return {
      success: sessionData.success,
      sessionId,
      questionCount: sessionData.session?.questions?.length || 0,
      sessionType: sessionData.session?.session_type,
      settings: sessionData.session?.settings
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// 测试词汇重点出题
async function testVocabularyFocusedQuestions() {
  try {
    const response = await fetch(`${BASE_URL}/api/questions/vocabulary-focused`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: TEST_CONFIG.userId,
        count: 10
      })
    })
    
    const data = await response.json()
    
    return {
      success: data.success,
      questionCount: data.questions?.length || 0,
      focusWords: data.focusWords?.length || 0,
      message: data.message
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 Custom Practice功能测试开始')
  console.log('=' * 50)
  
  const results = new TestResult()
  
  // 测试1: AI性能监控
  console.log('\n1. 测试AI性能监控...')
  const aiPerformance = await testAIPerformance()
  results.addTest('AI性能监控', aiPerformance.success, aiPerformance)
  
  // 测试2: 题目生成API
  console.log('\n2. 测试题目生成API...')
  const questionGen = await testQuestionGeneration()
  results.addTest('题目生成API', questionGen.success, questionGen)
  
  // 测试3: 题目数量验证
  console.log('\n3. 测试题目数量...')
  const countTest = questionGen.questionCount >= TEST_CONFIG.questionCount
  results.addTest('题目数量验证', countTest, {
    expected: TEST_CONFIG.questionCount,
    actual: questionGen.questionCount,
    responseTime: questionGen.responseTime
  })
  
  // 测试4: Custom Practice Session
  console.log('\n4. 测试Custom Practice Session...')
  const sessionTest = await testCustomPracticeSession()
  results.addTest('Custom Practice Session', sessionTest.success, sessionTest)
  
  // 测试5: Session题目数量
  console.log('\n5. 测试Session题目数量...')
  const sessionCountTest = sessionTest.questionCount >= TEST_CONFIG.questionCount
  results.addTest('Session题目数量', sessionCountTest, {
    expected: TEST_CONFIG.questionCount,
    actual: sessionTest.questionCount
  })
  
  // 测试6: 词汇重点出题
  console.log('\n6. 测试词汇重点出题...')
  const vocabTest = await testVocabularyFocusedQuestions()
  results.addTest('词汇重点出题', vocabTest.success, vocabTest)
  
  // 生成报告
  results.generateReport()
  
  // 返回测试结果
  return {
    totalTests: results.passed + results.failed,
    passed: results.passed,
    failed: results.failed,
    successRate: (results.passed / (results.passed + results.failed)) * 100
  }
}

// 运行测试
if (require.main === module) {
  runTests()
    .then(results => {
      console.log('\n🎯 测试完成')
      console.log(`成功率: ${results.successRate.toFixed(2)}%`)
      process.exit(results.failed > 0 ? 1 : 0)
    })
    .catch(error => {
      console.error('测试执行失败:', error)
      process.exit(1)
    })
}

module.exports = { runTests } 