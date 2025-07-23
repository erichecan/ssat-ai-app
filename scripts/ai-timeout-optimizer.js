#!/usr/bin/env node
// AI超时问题诊断和优化脚本 - 更新于 2024-01-21 05:05:00

const fs = require('fs')
const path = require('path')

// 配置选项
const CONFIG = {
  // 超时阈值（毫秒）
  TIMEOUT_THRESHOLDS: {
    WARNING: 8000,    // 8秒警告
    CRITICAL: 12000,  // 12秒严重
    MAX: 15000        // 15秒最大
  },
  
  // 重试配置
  RETRY_CONFIG: {
    MAX_RETRIES: 3,
    BASE_DELAY: 1000,
    MAX_DELAY: 5000,
    BACKOFF_MULTIPLIER: 2
  },
  
  // 缓存配置
  CACHE_CONFIG: {
    MAX_SIZE: 1000,
    DEFAULT_TTL: 3600000, // 1小时
    CLEANUP_INTERVAL: 300000 // 5分钟
  },
  
  // 模型配置
  MODEL_CONFIG: {
    TEMPERATURE: 0.7,
    TOP_K: 40,
    TOP_P: 0.95,
    MAX_OUTPUT_TOKENS: 8192
  }
}

// 诊断结果
class TimeoutDiagnostic {
  constructor() {
    this.issues = []
    this.recommendations = []
    this.stats = {
      totalRequests: 0,
      timeoutCount: 0,
      averageResponseTime: 0,
      cacheHitRate: 0
    }
  }

  addIssue(severity, message, details = {}) {
    this.issues.push({
      severity,
      message,
      details,
      timestamp: new Date().toISOString()
    })
  }

  addRecommendation(priority, message, action = '') {
    this.recommendations.push({
      priority,
      message,
      action,
      timestamp: new Date().toISOString()
    })
  }

  generateReport() {
    console.log('\n🔍 AI超时问题诊断报告')
    console.log('=' * 50)
    
    // 统计信息
    console.log('\n📊 统计信息:')
    console.log(`总请求数: ${this.stats.totalRequests}`)
    console.log(`超时次数: ${this.stats.timeoutCount}`)
    console.log(`超时率: ${this.stats.totalRequests > 0 ? (this.stats.timeoutCount / this.stats.totalRequests * 100).toFixed(2) : 0}%`)
    console.log(`平均响应时间: ${this.stats.averageResponseTime.toFixed(2)}ms`)
    console.log(`缓存命中率: ${(this.stats.cacheHitRate * 100).toFixed(2)}%`)
    
    // 问题列表
    if (this.issues.length > 0) {
      console.log('\n⚠️  发现的问题:')
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`)
        if (Object.keys(issue.details).length > 0) {
          console.log(`   详情: ${JSON.stringify(issue.details, null, 2)}`)
        }
      })
    } else {
      console.log('\n✅ 未发现严重问题')
    }
    
    // 建议列表
    if (this.recommendations.length > 0) {
      console.log('\n💡 优化建议:')
      this.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`)
        if (rec.action) {
          console.log(`   操作: ${rec.action}`)
        }
      })
    }
    
    // 配置建议
    console.log('\n⚙️  推荐配置:')
    console.log('```javascript')
    console.log('// 优化的超时配置')
    console.log('const TIMEOUT_CONFIG = {')
    console.log(`  initialTimeout: ${CONFIG.TIMEOUT_THRESHOLDS.WARNING},`)
    console.log(`  retryTimeout: ${CONFIG.TIMEOUT_THRESHOLDS.CRITICAL},`)
    console.log(`  maxTimeout: ${CONFIG.TIMEOUT_THRESHOLDS.MAX}`)
    console.log('}')
    console.log('')
    console.log('// 重试配置')
    console.log('const RETRY_CONFIG = {')
    console.log(`  maxRetries: ${CONFIG.RETRY_CONFIG.MAX_RETRIES},`)
    console.log(`  baseDelay: ${CONFIG.RETRY_CONFIG.BASE_DELAY},`)
    console.log(`  maxDelay: ${CONFIG.RETRY_CONFIG.MAX_DELAY}`)
    console.log('}')
    console.log('```')
  }
}

// 分析日志文件
function analyzeLogs(logFile) {
  const diagnostic = new TimeoutDiagnostic()
  
  try {
    if (!fs.existsSync(logFile)) {
      console.log(`日志文件不存在: ${logFile}`)
      return diagnostic
    }
    
    const logContent = fs.readFileSync(logFile, 'utf8')
    const lines = logContent.split('\n')
    
    let timeoutCount = 0
    let totalRequests = 0
    let responseTimes = []
    
    lines.forEach(line => {
      // 检测超时错误
      if (line.includes('timeout') || line.includes('TIMEOUT')) {
        timeoutCount++
        diagnostic.addIssue('error', '检测到超时错误', { line: line.trim() })
      }
      
      // 检测AI请求
      if (line.includes('Calling Gemini API') || line.includes('AI generation attempt')) {
        totalRequests++
      }
      
      // 检测响应时间
      const responseTimeMatch = line.match(/response time[:\s]+(\d+)ms/i)
      if (responseTimeMatch) {
        responseTimes.push(parseInt(responseTimeMatch[1]))
      }
    })
    
    // 更新统计信息
    diagnostic.stats.totalRequests = totalRequests
    diagnostic.stats.timeoutCount = timeoutCount
    diagnostic.stats.averageResponseTime = responseTimes.length > 0 ? 
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0
    
    // 分析问题
    if (timeoutCount > 0) {
      const timeoutRate = timeoutCount / totalRequests
      if (timeoutRate > 0.1) {
        diagnostic.addIssue('critical', `超时率过高: ${(timeoutRate * 100).toFixed(2)}%`)
        diagnostic.addRecommendation('high', '增加重试次数和退避延迟')
        diagnostic.addRecommendation('high', '启用AI响应缓存')
      } else if (timeoutRate > 0.05) {
        diagnostic.addIssue('warning', `超时率较高: ${(timeoutRate * 100).toFixed(2)}%`)
        diagnostic.addRecommendation('medium', '优化提示词长度')
      }
    }
    
    if (diagnostic.stats.averageResponseTime > CONFIG.TIMEOUT_THRESHOLDS.WARNING) {
      diagnostic.addIssue('warning', `平均响应时间过长: ${diagnostic.stats.averageResponseTime.toFixed(2)}ms`)
      diagnostic.addRecommendation('medium', '考虑使用更快的模型或优化提示词')
    }
    
  } catch (error) {
    console.error('分析日志时出错:', error)
  }
  
  return diagnostic
}

// 生成优化配置
function generateOptimizedConfig() {
  const config = {
    gemini: {
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
      generationConfig: CONFIG.MODEL_CONFIG,
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    },
    timeout: CONFIG.TIMEOUT_THRESHOLDS,
    retry: CONFIG.RETRY_CONFIG,
    cache: CONFIG.CACHE_CONFIG
  }
  
  return config
}

// 主函数
function main() {
  console.log('🚀 AI超时问题诊断和优化工具')
  console.log('=' * 40)
  
  const args = process.argv.slice(2)
  const command = args[0]
  
  switch (command) {
    case 'analyze':
      const logFile = args[1] || 'logs/ai-performance.log'
      console.log(`分析日志文件: ${logFile}`)
      const diagnostic = analyzeLogs(logFile)
      diagnostic.generateReport()
      break
      
    case 'config':
      console.log('生成优化配置...')
      const config = generateOptimizedConfig()
      console.log(JSON.stringify(config, null, 2))
      break
      
    case 'help':
    default:
      console.log(`
使用方法:
  node ai-timeout-optimizer.js analyze [logfile]  - 分析日志文件
  node ai-timeout-optimizer.js config             - 生成优化配置
  node ai-timeout-optimizer.js help               - 显示帮助信息

示例:
  node ai-timeout-optimizer.js analyze logs/ai.log
  node ai-timeout-optimizer.js config > optimized-config.json
      `)
      break
  }
}

// 运行主函数
if (require.main === module) {
  main()
}

module.exports = {
  TimeoutDiagnostic,
  analyzeLogs,
  generateOptimizedConfig,
  CONFIG
} 