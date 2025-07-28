#!/usr/bin/env node

/**
 * 监控词汇生成进度
 */

import { readFileSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function checkDatabaseCount() {
  try {
    const { stdout } = await execAsync('node scripts/check-generated-vocabulary.mjs')
    
    // 从输出中提取数字
    const totalMatch = stdout.match(/Total vocabulary words: (\d+)/)
    const uploadMatch = stdout.match(/From uploaded files: (\d+)/)
    
    return {
      total: totalMatch ? parseInt(totalMatch[1]) : 0,
      fromUploads: uploadMatch ? parseInt(uploadMatch[1]) : 0
    }
  } catch (error) {
    console.error('Error checking database:', error.message)
    return { total: 0, fromUploads: 0 }
  }
}

function checkLogProgress() {
  try {
    const log = readFileSync('vocabulary-generation.log', 'utf8')
    const lines = log.split('\n')
    
    // 统计完成的批次
    const completedBatches = lines.filter(line => line.includes('completed in')).length
    const lastBatchLine = lines.filter(line => line.includes('Processing batch')).pop()
    const currentBatch = lastBatchLine ? 
      lastBatchLine.match(/batch (\d+)/)?.[1] || '0' : '0'
    
    // 计算总生成数量
    const generatedLines = lines.filter(line => line.includes('Generated: '))
    let totalGenerated = 0
    generatedLines.forEach(line => {
      const match = line.match(/Generated: (\d+) words/)
      if (match) {
        totalGenerated += parseInt(match[1])
      }
    })
    
    return {
      completedBatches,
      currentBatch: parseInt(currentBatch),
      totalGenerated,
      lastActivity: getLastActivity(lines)
    }
  } catch (error) {
    return {
      completedBatches: 0,
      currentBatch: 0,
      totalGenerated: 0,
      lastActivity: 'Log file not found'
    }
  }
}

function getLastActivity(lines) {
  const recentLines = lines.slice(-5).filter(line => line.trim())
  return recentLines.length > 0 ? recentLines[recentLines.length - 1] : 'No recent activity'
}

function checkProcessStatus() {
  try {
    const { execSync } = require('child_process')
    const result = execSync('ps aux | grep "batch-generate-vocabulary" | grep -v grep', { encoding: 'utf8' })
    return result.trim() ? 'Running' : 'Stopped'
  } catch (error) {
    return 'Stopped'
  }
}

async function main() {
  console.log('📊 Vocabulary Generation Progress Monitor')
  console.log('=' * 50)
  
  // 检查进程状态
  const processStatus = checkProcessStatus()
  console.log(`🔄 Process Status: ${processStatus}`)
  
  if (processStatus === 'Stopped') {
    console.log('⚠️  Background process is not running!')
    return
  }
  
  // 检查日志进度
  const logProgress = checkLogProgress()
  console.log(`📝 Completed Batches: ${logProgress.completedBatches}`)
  console.log(`🎯 Current Batch: ${logProgress.currentBatch}`)
  console.log(`📚 Generated This Session: ${logProgress.totalGenerated} words`)
  
  // 检查数据库状态
  console.log('\n📊 Checking database...')
  const dbStats = await checkDatabaseCount()
  console.log(`💾 Total in Database: ${dbStats.total} words`)
  console.log(`📁 From SSAT Files: ${dbStats.fromUploads} words`)
  
  // 计算进度
  const targetWords = 2887 // 提取的总词汇数
  const progress = Math.round((dbStats.fromUploads / targetWords) * 100)
  console.log(`📈 Progress: ${progress}% (${dbStats.fromUploads}/${targetWords})`)
  
  // 估算剩余时间
  if (logProgress.completedBatches > 0) {
    const avgWordsPerBatch = logProgress.totalGenerated / logProgress.completedBatches
    const avgTimePerBatch = 2 // 分钟
    const remainingWords = targetWords - dbStats.fromUploads
    const remainingBatches = Math.ceil(remainingWords / avgWordsPerBatch)
    const estimatedTime = remainingBatches * avgTimePerBatch
    
    console.log(`⏱️  Estimated Remaining: ${remainingBatches} batches (~${estimatedTime} minutes)`)
  }
  
  console.log(`\n🔍 Last Activity: ${logProgress.lastActivity}`)
  
  console.log('\n💡 Commands:')
  console.log('  - View live log: tail -f vocabulary-generation.log')
  console.log('  - Stop process: pkill -f "batch-generate-vocabulary"')
  console.log('  - Check this status: node scripts/monitor-vocabulary-progress.mjs')
}

main().catch(console.error)