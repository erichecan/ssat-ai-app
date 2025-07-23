#!/usr/bin/env node
// 简化版题目数量验证脚本 - 更新于 2024-01-21 05:50:00

const { chromium } = require('playwright')

const PRODUCTION_URL = 'https://ssat.netlify.app'

async function verifyQuestionCount() {
  console.log('🔍 验证Custom Practice题目数量...')
  console.log(`目标网站: ${PRODUCTION_URL}`)
  
  let browser
  try {
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 2000 
    })
    
    const page = await browser.newPage()
    
    // 1. 访问生产环境
    console.log('\n1. 访问生产环境...')
    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' })
    console.log('✅ 成功访问生产环境')
    
    // 2. 导航到Practice页面
    console.log('\n2. 导航到Practice页面...')
    await page.click('a[href="/practice"]')
    await page.waitForLoadState('networkidle')
    console.log('✅ 成功导航到Practice页面')
    
    // 3. 等待页面加载
    await page.waitForTimeout(3000)
    
    // 4. 检查页面内容
    console.log('\n3. 检查页面内容...')
    const pageText = await page.textContent('body')
    console.log('页面包含的文本片段:')
    
    // 查找题目数量相关信息
    const questionMatches = pageText.match(/(\d+)\s*questions?/gi)
    if (questionMatches) {
      console.log(`找到题目数量信息: ${questionMatches.join(', ')}`)
    }
    
    const numberMatches = pageText.match(/(\d+)/g)
    if (numberMatches) {
      console.log(`页面中的数字: ${numberMatches.slice(0, 10).join(', ')}...`)
    }
    
    // 5. 查找Custom Practice相关元素
    console.log('\n4. 查找Custom Practice元素...')
    const customElements = await page.locator('text=Custom, text=Practice, text=20').all()
    console.log(`找到 ${customElements.length} 个相关元素`)
    
    // 6. 检查表单元素
    console.log('\n5. 检查表单元素...')
    const inputs = await page.locator('input, select').all()
    console.log(`找到 ${inputs.length} 个输入元素`)
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      const tagName = await input.evaluate(el => el.tagName.toLowerCase())
      const type = await input.evaluate(el => el.type || 'N/A')
      const value = await input.evaluate(el => el.value || 'N/A')
      const placeholder = await input.evaluate(el => el.placeholder || 'N/A')
      
      console.log(`  元素 ${i + 1}: ${tagName} (type: ${type}, value: ${value}, placeholder: ${placeholder})`)
    }
    
    // 7. 尝试开始练习
    console.log('\n6. 尝试开始练习...')
    const startButtons = await page.locator('button').all()
    console.log(`找到 ${startButtons.length} 个按钮`)
    
    for (let i = 0; i < startButtons.length; i++) {
      const button = startButtons[i]
      const text = await button.textContent()
      console.log(`  按钮 ${i + 1}: "${text}"`)
      
      if (text && (text.toLowerCase().includes('start') || text.toLowerCase().includes('practice') || text.toLowerCase().includes('开始'))) {
        console.log(`  尝试点击按钮: "${text}"`)
        await button.click()
        await page.waitForTimeout(3000)
        break
      }
    }
    
    // 8. 检查练习页面
    console.log('\n7. 检查练习页面...')
    const currentUrl = page.url()
    console.log(`当前URL: ${currentUrl}`)
    
    if (currentUrl.includes('session') || currentUrl.includes('practice')) {
      console.log('✅ 成功进入练习页面')
      
      // 等待页面加载
      await page.waitForTimeout(5000)
      
      // 检查题目数量
      const sessionText = await page.textContent('body')
      const sessionQuestionMatches = sessionText.match(/(\d+)\s*\/\s*(\d+)/g)
      if (sessionQuestionMatches) {
        console.log(`练习页面题目信息: ${sessionQuestionMatches.join(', ')}`)
        
        // 提取总题目数
        const totalMatch = sessionQuestionMatches[0].match(/(\d+)\s*\/\s*(\d+)/)
        if (totalMatch) {
          const totalQuestions = parseInt(totalMatch[2])
          console.log(`\n🎯 实际题目数量: ${totalQuestions}`)
          
          if (totalQuestions >= 20) {
            console.log('✅ 题目数量符合预期 (≥20)')
          } else {
            console.log(`❌ 题目数量不足 (期望≥20, 实际${totalQuestions})`)
          }
        }
      } else {
        console.log('⚠️  未找到题目数量信息')
      }
    } else {
      console.log('⚠️  未能进入练习页面')
    }
    
    // 9. 截图保存
    const screenshotPath = `test-results/question-count-${Date.now()}.png`
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`\n📸 截图已保存: ${screenshotPath}`)
    
    // 10. 等待用户观察
    console.log('\n⏳ 等待10秒供观察...')
    await page.waitForTimeout(10000)
    
  } catch (error) {
    console.error('测试过程中发生错误:', error)
  } finally {
    if (browser) {
      await browser.close()
      console.log('\n✅ 浏览器已关闭')
    }
  }
}

// 运行验证
if (require.main === module) {
  verifyQuestionCount()
    .then(() => {
      console.log('\n🎯 验证完成')
    })
    .catch(error => {
      console.error('验证失败:', error)
      process.exit(1)
    })
}

module.exports = { verifyQuestionCount } 