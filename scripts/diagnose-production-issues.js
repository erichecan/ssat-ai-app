#!/usr/bin/env node
// 生产环境问题诊断脚本 - 更新于 2024-01-21 05:55:00

const { chromium } = require('playwright')

const PRODUCTION_URL = 'https://ssat.netlify.app'

async function diagnoseProductionIssues() {
  console.log('🔍 生产环境问题诊断...')
  console.log(`目标网站: ${PRODUCTION_URL}`)
  
  let browser
  try {
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000 
    })
    
    const page = await browser.newPage()
    
    // 启用网络请求监听
    const requests = []
    const responses = []
    const errors = []
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      })
    })
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      })
    })
    
    page.on('pageerror', error => {
      errors.push({
        message: error.message,
        stack: error.stack
      })
    })
    
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
    
    // 4. 开始练习并监听网络请求
    console.log('\n3. 开始练习并监听网络请求...')
    await page.click('button:has-text("Start AI Practice")')
    
    // 等待API调用
    await page.waitForTimeout(10000)
    
    // 5. 分析网络请求
    console.log('\n4. 分析网络请求...')
    console.log(`总请求数: ${requests.length}`)
    console.log(`总响应数: ${responses.length}`)
    console.log(`错误数: ${errors.length}`)
    
    // 查找API请求
    const apiRequests = requests.filter(req => 
      req.url.includes('/api/') || 
      req.url.includes('generate-questions') ||
      req.url.includes('practice')
    )
    
    console.log(`\nAPI请求数: ${apiRequests.length}`)
    apiRequests.forEach((req, index) => {
      console.log(`  API请求 ${index + 1}: ${req.method} ${req.url}`)
    })
    
    // 查找失败的响应
    const failedResponses = responses.filter(resp => resp.status >= 400)
    console.log(`\n失败响应数: ${failedResponses.length}`)
    failedResponses.forEach((resp, index) => {
      console.log(`  失败响应 ${index + 1}: ${resp.status} ${resp.statusText} - ${resp.url}`)
    })
    
    // 6. 检查控制台错误
    console.log('\n5. 检查控制台错误...')
    if (errors.length > 0) {
      console.log(`发现 ${errors.length} 个JavaScript错误:`)
      errors.forEach((error, index) => {
        console.log(`  错误 ${index + 1}: ${error.message}`)
        if (error.stack) {
          console.log(`    堆栈: ${error.stack.split('\n')[0]}`)
        }
      })
    } else {
      console.log('✅ 未发现JavaScript错误')
    }
    
    // 7. 检查页面状态
    console.log('\n6. 检查页面状态...')
    const currentUrl = page.url()
    console.log(`当前URL: ${currentUrl}`)
    
    // 检查页面内容
    const pageText = await page.textContent('body')
    
    // 查找错误信息
    const errorPatterns = [
      /error/i,
      /failed/i,
      /timeout/i,
      /network/i,
      /connection/i,
      /api/i
    ]
    
    const foundErrors = []
    errorPatterns.forEach(pattern => {
      const matches = pageText.match(new RegExp(pattern.source, 'gi'))
      if (matches) {
        foundErrors.push(...matches)
      }
    })
    
    if (foundErrors.length > 0) {
      console.log(`页面中发现错误相关文本: ${foundErrors.slice(0, 10).join(', ')}`)
    }
    
    // 8. 检查题目数量
    console.log('\n7. 检查题目数量...')
    const questionMatches = pageText.match(/(\d+)\s*\/\s*(\d+)/g)
    if (questionMatches) {
      console.log(`题目数量信息: ${questionMatches.join(', ')}`)
      
      const totalMatch = questionMatches[0].match(/(\d+)\s*\/\s*(\d+)/)
      if (totalMatch) {
        const current = parseInt(totalMatch[1])
        const total = parseInt(totalMatch[2])
        console.log(`当前题目: ${current}, 总题目: ${total}`)
        
        if (total === 0) {
          console.log('❌ 问题确认: 总题目数为0')
          console.log('可能的原因:')
          console.log('1. API调用失败')
          console.log('2. 数据库连接问题')
          console.log('3. 环境变量缺失')
          console.log('4. AI服务超时')
        }
      }
    }
    
    // 9. 尝试手动触发API调用
    console.log('\n8. 尝试手动触发API调用...')
    try {
      const apiResponse = await page.evaluate(async () => {
        const response = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'demo-user-123',
            questionType: 'mixed',
            count: 20
          })
        })
        
        const data = await response.json()
        return {
          status: response.status,
          ok: response.ok,
          data: data
        }
      })
      
      console.log(`API响应状态: ${apiResponse.status}`)
      console.log(`API响应成功: ${apiResponse.ok}`)
      
      if (apiResponse.data) {
        console.log(`API响应数据: ${JSON.stringify(apiResponse.data, null, 2)}`)
      }
      
    } catch (apiError) {
      console.log(`API调用失败: ${apiError.message}`)
    }
    
    // 10. 截图保存
    const screenshotPath = `test-results/diagnosis-${Date.now()}.png`
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`\n📸 诊断截图已保存: ${screenshotPath}`)
    
    // 11. 生成诊断报告
    console.log('\n📊 诊断报告')
    console.log('=' * 50)
    console.log(`网络请求: ${requests.length}`)
    console.log(`API请求: ${apiRequests.length}`)
    console.log(`失败响应: ${failedResponses.length}`)
    console.log(`JavaScript错误: ${errors.length}`)
    console.log(`页面错误文本: ${foundErrors.length}`)
    
    if (failedResponses.length > 0 || errors.length > 0) {
      console.log('\n🔧 建议解决方案:')
      console.log('1. 检查Netlify环境变量设置')
      console.log('2. 检查Supabase数据库连接')
      console.log('3. 检查AI API密钥配置')
      console.log('4. 查看Netlify部署日志')
      console.log('5. 检查API超时设置')
    }
    
    // 等待用户观察
    console.log('\n⏳ 等待15秒供观察...')
    await page.waitForTimeout(15000)
    
  } catch (error) {
    console.error('诊断过程中发生错误:', error)
  } finally {
    if (browser) {
      await browser.close()
      console.log('\n✅ 浏览器已关闭')
    }
  }
}

// 运行诊断
if (require.main === module) {
  diagnoseProductionIssues()
    .then(() => {
      console.log('\n🎯 诊断完成')
    })
    .catch(error => {
      console.error('诊断失败:', error)
      process.exit(1)
    })
}

module.exports = { diagnoseProductionIssues } 