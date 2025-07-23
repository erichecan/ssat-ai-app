#!/usr/bin/env node
// 生产环境Custom Practice题目数量验证脚本 - 更新于 2024-01-21 05:45:00

const { chromium } = require('playwright')

const PRODUCTION_URL = 'https://ssat.netlify.app'

// 测试配置
const TEST_CONFIG = {
  timeout: 30000,
  headless: false, // 设置为false以便观察测试过程
  slowMo: 1000 // 放慢操作速度，便于观察
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
    console.log('\n📊 生产环境测试报告')
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

// 测试Custom Practice页面
async function testCustomPractice(browser) {
  const page = await browser.newPage()
  const results = new TestResult()
  
  try {
    console.log('\n🔍 开始测试Custom Practice页面...')
    
    // 1. 访问生产环境
    console.log('1. 访问生产环境...')
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' })
    console.log('✅ 成功访问生产环境')
    
    // 2. 导航到Practice页面
    console.log('2. 导航到Practice页面...')
    await page.click('a[href="/practice"]')
    await page.waitForLoadState('networkidle')
    console.log('✅ 成功导航到Practice页面')
    
    // 3. 等待页面加载完成
    await page.waitForTimeout(2000)
    
    // 4. 检查是否有Custom Practice选项
    console.log('3. 检查Custom Practice选项...')
    const customPracticeButton = await page.locator('text=Custom Practice').first()
    if (await customPracticeButton.isVisible()) {
      console.log('✅ 找到Custom Practice按钮')
      await customPracticeButton.click()
    } else {
      console.log('⚠️  未找到Custom Practice按钮，尝试其他方式')
      // 尝试直接点击可能存在的按钮
      const buttons = await page.locator('button').all()
      for (const button of buttons) {
        const text = await button.textContent()
        if (text && text.toLowerCase().includes('custom')) {
          await button.click()
          console.log('✅ 通过文本匹配找到Custom Practice按钮')
          break
        }
      }
    }
    
    // 5. 等待Custom Practice页面加载
    await page.waitForTimeout(3000)
    
    // 6. 检查题目数量设置
    console.log('4. 检查题目数量设置...')
    const questionCountInput = await page.locator('input[type="number"], select').first()
    if (await questionCountInput.isVisible()) {
      const tagName = await questionCountInput.evaluate(el => el.tagName.toLowerCase())
      
      if (tagName === 'select') {
        const currentValue = await questionCountInput.evaluate(el => el.value)
        console.log(`当前题目数量设置: ${currentValue}`)
        
        // 对于select元素，使用selectOption
        await questionCountInput.selectOption('20')
        await page.waitForTimeout(1000)
        console.log('✅ 已设置题目数量为20')
      } else {
        const currentValue = await questionCountInput.inputValue()
        console.log(`当前题目数量设置: ${currentValue}`)
        
        // 对于input元素，使用fill
        await questionCountInput.fill('20')
        await page.waitForTimeout(1000)
        console.log('✅ 已设置题目数量为20')
      }
    } else {
      console.log('⚠️  未找到题目数量输入框')
    }
    
    // 7. 开始练习
    console.log('5. 开始练习...')
    const startButton = await page.locator('button:has-text("Start"), button:has-text("开始"), button:has-text("Practice")').first()
    if (await startButton.isVisible()) {
      await startButton.click()
      console.log('✅ 点击开始练习按钮')
    } else {
      console.log('⚠️  未找到开始练习按钮')
    }
    
    // 8. 等待练习页面加载
    await page.waitForTimeout(5000)
    
    // 9. 检查题目数量
    console.log('6. 检查实际题目数量...')
    
    // 尝试多种方式检查题目数量
    let questionCount = 0
    let questionElements = []
    
    // 方法1: 检查题目计数器
    const counterElement = await page.locator('[class*="counter"], [class*="progress"], [class*="question"]').first()
    if (await counterElement.isVisible()) {
      const counterText = await counterElement.textContent()
      console.log(`计数器文本: ${counterText}`)
      
      // 提取数字
      const match = counterText.match(/(\d+)\s*\/\s*(\d+)/)
      if (match) {
        questionCount = parseInt(match[2])
        console.log(`从计数器提取的题目数量: ${questionCount}`)
      }
    }
    
    // 方法2: 检查题目元素
    questionElements = await page.locator('[class*="question"], [class*="card"], [class*="item"]').all()
    if (questionElements.length > 0) {
      console.log(`找到 ${questionElements.length} 个题目元素`)
      questionCount = Math.max(questionCount, questionElements.length)
    }
    
    // 方法3: 检查页面文本中的数字
    const pageText = await page.textContent('body')
    const numberMatches = pageText.match(/(\d+)\s*questions?/gi)
    if (numberMatches) {
      console.log(`页面文本中的题目数量信息: ${numberMatches.join(', ')}`)
    }
    
    // 10. 验证题目数量
    console.log(`实际题目数量: ${questionCount}`)
    const isCorrectCount = questionCount >= 20
    
    results.addTest('Custom Practice题目数量', isCorrectCount, {
      expected: 20,
      actual: questionCount,
      questionElements: questionElements.length,
      pageUrl: page.url()
    })
    
    // 11. 截图保存
    const screenshotPath = `test-results/custom-practice-${Date.now()}.png`
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`📸 截图已保存: ${screenshotPath}`)
    
    // 12. 检查页面URL和状态
    const currentUrl = page.url()
    console.log(`当前页面URL: ${currentUrl}`)
    
    if (currentUrl.includes('practice') || currentUrl.includes('session')) {
      results.addTest('页面导航', true, { url: currentUrl })
    } else {
      results.addTest('页面导航', false, { url: currentUrl })
    }
    
    // 13. 检查是否有错误信息
    const errorElements = await page.locator('[class*="error"], [class*="alert"], [class*="warning"]').all()
    if (errorElements.length > 0) {
      console.log('⚠️  发现错误信息:')
      for (const error of errorElements) {
        const errorText = await error.textContent()
        console.log(`  - ${errorText}`)
      }
      results.addTest('错误检查', false, { errors: errorElements.length })
    } else {
      results.addTest('错误检查', true, { errors: 0 })
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error)
    results.addTest('测试执行', false, { error: error.message })
  } finally {
    await page.close()
  }
  
  return results
}

// 测试Flashcard页面
async function testFlashcardPage(browser) {
  const page = await browser.newPage()
  const results = new TestResult()
  
  try {
    console.log('\n🔍 开始测试Flashcard页面...')
    
    // 1. 访问Flashcard页面
    await page.goto(`${PRODUCTION_URL}/flashcard`, { waitUntil: 'networkidle' })
    console.log('✅ 成功访问Flashcard页面')
    
    // 2. 等待页面加载
    await page.waitForTimeout(3000)
    
    // 3. 检查发音功能
    console.log('2. 检查发音功能...')
    const pronounceButton = await page.locator('[class*="volume"], [class*="speak"], button:has-text("🔊")').first()
    if (await pronounceButton.isVisible()) {
      console.log('✅ 找到发音按钮')
      
      // 点击发音按钮
      await pronounceButton.click()
      await page.waitForTimeout(2000)
      console.log('✅ 发音功能测试完成')
      
      results.addTest('发音功能', true, { buttonFound: true })
    } else {
      console.log('⚠️  未找到发音按钮')
      results.addTest('发音功能', false, { buttonFound: false })
    }
    
    // 4. 截图保存
    const screenshotPath = `test-results/flashcard-${Date.now()}.png`
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`📸 截图已保存: ${screenshotPath}`)
    
  } catch (error) {
    console.error('Flashcard测试过程中发生错误:', error)
    results.addTest('Flashcard测试执行', false, { error: error.message })
  } finally {
    await page.close()
  }
  
  return results
}

// 主测试函数
async function runProductionTests() {
  console.log('🚀 生产环境功能验证开始')
  console.log('=' * 50)
  console.log(`目标网站: ${PRODUCTION_URL}`)
  
  let browser
  let allResults = new TestResult()
  
  try {
    // 启动浏览器
    browser = await chromium.launch(TEST_CONFIG)
    console.log('✅ 浏览器启动成功')
    
    // 创建测试结果目录
    const fs = require('fs')
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results')
    }
    
    // 运行Custom Practice测试
    const customPracticeResults = await testCustomPractice(browser)
    allResults.details.push(...customPracticeResults.details)
    allResults.passed += customPracticeResults.passed
    allResults.failed += customPracticeResults.failed
    
    // 运行Flashcard测试
    const flashcardResults = await testFlashcardPage(browser)
    allResults.details.push(...flashcardResults.details)
    allResults.passed += flashcardResults.passed
    allResults.failed += flashcardResults.failed
    
  } catch (error) {
    console.error('测试执行失败:', error)
    allResults.addTest('测试环境', false, { error: error.message })
  } finally {
    if (browser) {
      await browser.close()
      console.log('✅ 浏览器已关闭')
    }
  }
  
  // 生成最终报告
  allResults.generateReport()
  
  return {
    totalTests: allResults.passed + allResults.failed,
    passed: allResults.passed,
    failed: allResults.failed,
    successRate: (allResults.passed / (allResults.passed + allResults.failed)) * 100
  }
}

// 运行测试
if (require.main === module) {
  runProductionTests()
    .then(results => {
      console.log('\n🎯 生产环境测试完成')
      console.log(`成功率: ${results.successRate.toFixed(2)}%`)
      
      // 如果Custom Practice题目数量测试失败，给出建议
      const customPracticeTest = results.details?.find(d => d.name === 'Custom Practice题目数量')
      if (customPracticeTest && !customPracticeTest.passed) {
        console.log('\n⚠️  Custom Practice题目数量问题:')
        console.log('建议检查以下内容:')
        console.log('1. 生产环境部署是否包含最新的代码修改')
        console.log('2. API路由是否正确配置')
        console.log('3. 数据库连接是否正常')
        console.log('4. 查看Netlify部署日志')
      }
      
      process.exit(results.failed > 0 ? 1 : 0)
    })
    .catch(error => {
      console.error('测试执行失败:', error)
      process.exit(1)
    })
}

module.exports = { runProductionTests } 