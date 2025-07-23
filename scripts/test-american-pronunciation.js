#!/usr/bin/env node
// 美式发音功能测试脚本 - 更新于 2024-01-21 05:35:00

// 使用内置fetch（Node.js 18+）
const fetch = globalThis.fetch

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001' // 注意端口是3001

// 测试词汇列表
const testWords = [
  'schedule',    // 美式: /ˈskɛdʒuːl/ vs 英式: /ˈʃɛdjuːl/
  'tomato',      // 美式: /təˈmeɪtoʊ/ vs 英式: /təˈmɑːtəʊ/
  'vitamin',     // 美式: /ˈvaɪtəmɪn/ vs 英式: /ˈvɪtəmɪn/
  'aluminum',    // 美式: /əˈluːmɪnəm/ vs 英式: /ˌæljʊˈmɪniəm/
  'laboratory',  // 美式: /ˈlæbərəˌtɔri/ vs 英式: /ləˈbɒrətəri/
  'advertisement', // 美式: /ˌædvərˈtaɪzmənt/ vs 英式: /ədˈvɜːtɪsmənt/
  'privacy',     // 美式: /ˈpraɪvəsi/ vs 英式: /ˈprɪvəsi/
  'leisure',     // 美式: /ˈliːʒər/ vs 英式: /ˈleʒə/
  'garage',      // 美式: /ɡəˈrɑːʒ/ vs 英式: /ˈɡærɑːʒ/
  'herb'         // 美式: /ɜːrb/ vs 英式: /hɜːb/
]

// 测试AI生成词汇内容
async function testVocabularyGeneration(word) {
  try {
    console.log(`\n🔤 测试词汇: ${word}`)
    
    const response = await fetch(`${BASE_URL}/api/vocabulary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: word,
        userId: 'demo-user-123',
        context: 'Testing American pronunciation',
        source: 'pronunciation_test'
      })
    })
    
    const data = await response.json()
    
    if (data.success) {
      console.log(`✅ 成功生成词汇内容`)
      console.log(`   发音: ${data.flashcard?.pronunciation || 'N/A'}`)
      console.log(`   定义: ${data.flashcard?.definition || 'N/A'}`)
      console.log(`   词性: ${data.flashcard?.part_of_speech || 'N/A'}`)
      
      // 检查发音是否为美式
      const pronunciation = data.flashcard?.pronunciation || ''
      const isAmerican = checkAmericanPronunciation(word, pronunciation)
      
      if (isAmerican) {
        console.log(`✅ 发音符合美式标准`)
      } else {
        console.log(`⚠️  发音可能不是美式标准`)
      }
      
      return {
        success: true,
        word,
        pronunciation,
        isAmerican,
        flashcard: data.flashcard
      }
    } else {
      console.log(`❌ 生成失败: ${data.error}`)
      return {
        success: false,
        word,
        error: data.error
      }
    }
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}`)
    return {
      success: false,
      word,
      error: error.message
    }
  }
}

// 检查发音是否为美式
function checkAmericanPronunciation(word, pronunciation) {
  const americanPatterns = {
    'schedule': /skɛdʒ/,
    'tomato': /meɪtoʊ/,
    'vitamin': /vaɪtəmɪn/,
    'aluminum': /luːmɪnəm/,
    'laboratory': /læbərəˌtɔri/,
    'advertisement': /ædvərˈtaɪz/,
    'privacy': /praɪvəsi/,
    'leisure': /liːʒər/,
    'garage': /ɡəˈrɑːʒ/,
    'herb': /ɜːrb/
  }
  
  const pattern = americanPatterns[word.toLowerCase()]
  if (pattern) {
    return pattern.test(pronunciation)
  }
  
  // 通用检查：美式发音通常不使用某些英式音素
  const britishPatterns = [
    /ʃɛdjuːl/,  // schedule 英式
    /təˈmɑːtəʊ/, // tomato 英式
    /ˈvɪtəmɪn/,  // vitamin 英式
    /ˌæljʊˈmɪniəm/, // aluminum 英式
    /ləˈbɒrətəri/, // laboratory 英式
    /ədˈvɜːtɪsmənt/, // advertisement 英式
    /ˈprɪvəsi/,  // privacy 英式
    /ˈleʒə/,     // leisure 英式
    /ˈɡærɑːʒ/,   // garage 英式
    /hɜːb/       // herb 英式
  ]
  
  // 如果不包含英式模式，可能是美式
  return !britishPatterns.some(pattern => pattern.test(pronunciation))
}

// 测试浏览器发音功能（模拟）
function testBrowserPronunciation() {
  console.log('\n🔊 测试浏览器发音功能')
  
  // 模拟浏览器环境
  const mockSpeechSynthesis = {
    getVoices: () => [
      { name: 'Samantha', lang: 'en-US', voiceURI: 'com.apple.speech.synthesis.voice.samantha' },
      { name: 'Alex', lang: 'en-US', voiceURI: 'com.apple.speech.synthesis.voice.alex' },
      { name: 'Daniel', lang: 'en-GB', voiceURI: 'com.apple.speech.synthesis.voice.daniel' }
    ],
    speak: (utterance) => {
      console.log(`   播放: ${utterance.text}`)
      console.log(`   语言: ${utterance.lang}`)
      console.log(`   语音: ${utterance.voice?.name || 'default'}`)
      console.log(`   语速: ${utterance.rate}`)
      console.log(`   音调: ${utterance.pitch}`)
      console.log(`   音量: ${utterance.volume}`)
    }
  }
  
  // 测试美式发音设置
  const testWord = 'schedule'
  const utterance = {
    text: testWord,
    lang: 'en-US',
    rate: 0.8,
    pitch: 1.0,
    volume: 1.0,
    voice: null
  }
  
  const voices = mockSpeechSynthesis.getVoices()
  const usVoice = voices.find(voice => 
    voice.lang === 'en-US' && 
    (voice.name.includes('US') || voice.name.includes('American') || voice.name.includes('Samantha'))
  )
  
  if (usVoice) {
    utterance.voice = usVoice
    console.log(`✅ 找到美式语音: ${usVoice.name}`)
  } else {
    console.log(`⚠️  未找到美式语音，使用默认语音`)
  }
  
  mockSpeechSynthesis.speak(utterance)
  
  return {
    success: true,
    hasUSVoice: !!usVoice,
    voiceName: usVoice?.name || 'default'
  }
}

// 主测试函数
async function runTests() {
  console.log('🇺🇸 美式发音功能测试开始')
  console.log('=' * 50)
  
  let results = {
    vocabularyTests: [],
    browserTest: null,
    summary: {
      total: 0,
      successful: 0,
      american: 0,
      failed: 0
    }
  }
  
  // 测试AI生成词汇内容
  console.log('\n🤖 测试AI生成美式发音...')
  for (const word of testWords) {
    const result = await testVocabularyGeneration(word)
    results.vocabularyTests.push(result)
    
    if (result.success) {
      results.summary.successful++
      if (result.isAmerican) {
        results.summary.american++
      }
    } else {
      results.summary.failed++
    }
    results.summary.total++
    
    // 添加延迟避免API限制
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // 测试浏览器发音功能
  results.browserTest = testBrowserPronunciation()
  
  // 生成报告
  console.log('\n📊 测试报告')
  console.log('=' * 50)
  console.log(`总测试词汇: ${results.summary.total}`)
  console.log(`成功生成: ${results.summary.successful}`)
  console.log(`美式发音: ${results.summary.american}`)
  console.log(`生成失败: ${results.summary.failed}`)
  console.log(`美式发音准确率: ${results.summary.successful > 0 ? (results.summary.american / results.summary.successful * 100).toFixed(1) : 0}%`)
  
  if (results.browserTest) {
    console.log(`\n浏览器发音测试:`)
    console.log(`美式语音可用: ${results.browserTest.hasUSVoice ? '✅' : '⚠️'}`)
    console.log(`使用语音: ${results.browserTest.voiceName}`)
  }
  
  // 详细结果
  console.log('\n📋 详细结果:')
  results.vocabularyTests.forEach((test, index) => {
    if (test.success) {
      console.log(`${index + 1}. ${test.word}: ${test.isAmerican ? '✅' : '⚠️'} ${test.pronunciation}`)
    } else {
      console.log(`${index + 1}. ${test.word}: ❌ ${test.error}`)
    }
  })
  
  return results
}

// 运行测试
if (require.main === module) {
  runTests()
    .then(results => {
      console.log('\n🎯 测试完成')
      const successRate = results.summary.successful / results.summary.total * 100
      const americanRate = results.summary.successful > 0 ? results.summary.american / results.summary.successful * 100 : 0
      
      console.log(`成功率: ${successRate.toFixed(1)}%`)
      console.log(`美式发音率: ${americanRate.toFixed(1)}%`)
      
      process.exit(results.summary.failed > results.summary.total / 2 ? 1 : 0)
    })
    .catch(error => {
      console.error('测试执行失败:', error)
      process.exit(1)
    })
}

module.exports = { runTests, checkAmericanPronunciation } 