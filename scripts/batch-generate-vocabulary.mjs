#!/usr/bin/env node

/**
 * 批量生成词汇脚本 - 连续调用API直到处理完所有提取的词汇
 */

// 使用原生fetch (Node.js 18+)

const API_URL = 'http://localhost:3000/api/vocabulary/generate-from-uploads'
const BATCH_SIZE = 50 // 每批处理50个词汇
const MAX_BATCHES = 60 // 最多处理60批（3000个词汇）
const DELAY_BETWEEN_BATCHES = 5000 // 批次间延迟5秒

async function generateBatch(batchNumber) {
  console.log(`\n📝 Processing batch ${batchNumber}...`)
  
  try {
    const startTime = Date.now()
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        batchSize: BATCH_SIZE
      })
    })
    
    const endTime = Date.now()
    const duration = Math.round((endTime - startTime) / 1000)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ Batch ${batchNumber} completed in ${duration}s`)
      console.log(`   Generated: ${result.stats.totalGenerated} words`)
      console.log(`   Sample words: ${result.sampleWords?.slice(0, 3).map(w => w.word).join(', ')}...`)
      
      return {
        success: true,
        generated: result.stats.totalGenerated,
        hasMore: result.stats.totalGenerated > 0
      }
    } else {
      console.log(`❌ Batch ${batchNumber} failed: ${result.message}`)
      return {
        success: false,
        generated: 0,
        hasMore: false
      }
    }
    
  } catch (error) {
    console.error(`💥 Batch ${batchNumber} error:`, error.message)
    return {
      success: false,
      generated: 0,
      hasMore: false
    }
  }
}

async function main() {
  console.log('🚀 Starting batch vocabulary generation...')
  console.log(`📊 Will process up to ${MAX_BATCHES} batches of ${BATCH_SIZE} words each`)
  
  let totalGenerated = 0
  let successfulBatches = 0
  let failedBatches = 0
  
  for (let i = 1; i <= MAX_BATCHES; i++) {
    const result = await generateBatch(i)
    
    if (result.success) {
      successfulBatches++
      totalGenerated += result.generated
      
      // 如果这批没有生成新词汇，说明可能已经处理完了
      if (!result.hasMore) {
        console.log(`\n🎉 All vocabulary processed! No more words to generate.`)
        break
      }
      
    } else {
      failedBatches++
      
      // 连续失败3次就停止
      if (failedBatches >= 3) {
        console.log(`\n🛑 Stopping due to consecutive failures`)
        break
      }
    }
    
    // 批次间延迟，避免过载
    if (i < MAX_BATCHES && result.hasMore) {
      console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES/1000}s before next batch...`)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }
  
  // 最终统计
  console.log(`\n` + '='.repeat(60))
  console.log(`📊 BATCH PROCESSING SUMMARY`)
  console.log(`=`.repeat(60))
  console.log(`✅ Successful batches: ${successfulBatches}`)
  console.log(`❌ Failed batches: ${failedBatches}`)
  console.log(`📚 Total words generated: ${totalGenerated}`)
  console.log(`⏱️  Average per batch: ${successfulBatches > 0 ? Math.round(totalGenerated / successfulBatches) : 0}`)
  
  if (totalGenerated > 0) {
    console.log(`\n🎯 Recommendation: Check the database to see current vocabulary count!`)
  }
}

// 运行脚本
main().catch(console.error)