#!/usr/bin/env node

/**
 * 自动词汇生成脚本
 * 目标: 2天内生成3000个词汇
 * 策略: 持续小批次生成，避免API限制
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function generateBatch(batchSize = 10) {
  try {
    console.log(`🚀 Generating batch of ${batchSize} words...`);
    
    const response = await fetch(`${baseUrl}/api/vocabulary/generate-optimized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '00000000-0000-0000-0000-000000000001',
        batchSize,
        difficulty: 'mixed'
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ Generated ${result.stats.inserted} words successfully`);
      return result.stats.inserted;
    } else {
      console.error(`❌ Generation failed:`, result.error);
      return 0;
    }
  } catch (error) {
    console.error(`💥 Network error:`, error.message);
    return 0;
  }
}

async function checkProgress() {
  try {
    const response = await fetch(`${baseUrl}/api/vocabulary/cleanup-duplicates`);
    const result = await response.json();
    
    if (result.success) {
      return {
        total: result.currentStatus.totalRecords,
        unique: result.currentStatus.uniqueWords,
        duplicates: result.currentStatus.duplicateRecords
      };
    }
  } catch (error) {
    console.error('Error checking progress:', error.message);
  }
  
  return { total: 0, unique: 0, duplicates: 0 };
}

async function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function main() {
  const targetWords = 3000;
  let totalGenerated = 0;
  let consecutiveFailures = 0;
  let batchSize = 10;
  const maxFailures = 5;
  
  console.log('🎯 Auto Vocabulary Generation Started');
  console.log(`Target: ${targetWords} words`);
  console.log('Strategy: Continuous small batch generation\n');
  
  // 检查初始状态
  const initialProgress = await checkProgress();
  console.log(`📊 Initial status: ${initialProgress.unique} unique words\n`);
  
  while (true) {
    try {
      // 检查当前进度
      const progress = await checkProgress();
      const remaining = targetWords - progress.unique;
      
      console.log(`📈 Progress: ${progress.unique}/${targetWords} (${Math.round(progress.unique/targetWords*100)}%)`);
      
      if (remaining <= 0) {
        console.log('🎉 TARGET REACHED! Generation complete!');
        break;
      }
      
      // 动态调整批次大小
      if (consecutiveFailures > 2) {
        batchSize = Math.max(5, batchSize - 2); // 减少批次大小
      } else if (consecutiveFailures === 0) {
        batchSize = Math.min(15, batchSize + 1); // 增加批次大小
      }
      
      // 生成一批词汇
      const generated = await generateBatch(batchSize);
      
      if (generated > 0) {
        totalGenerated += generated;
        consecutiveFailures = 0;
        console.log(`📊 Session total: ${totalGenerated} words generated`);
        
        // 成功后短暂休息
        await sleep(3);
      } else {
        consecutiveFailures++;
        console.log(`⚠️  Consecutive failures: ${consecutiveFailures}/${maxFailures}`);
        
        if (consecutiveFailures >= maxFailures) {
          console.log('🛑 Too many failures, taking a longer break...');
          await sleep(60); // 1分钟休息
          consecutiveFailures = 0;
        } else {
          await sleep(10); // 10秒休息
        }
      }
      
      // 每100个词汇显示详细统计
      if (totalGenerated > 0 && totalGenerated % 100 === 0) {
        const currentProgress = await checkProgress();
        const timePerWord = totalGenerated > 0 ? Date.now() / totalGenerated : 0;
        const estimatedTime = (targetWords - currentProgress.unique) * timePerWord / 1000 / 60; // 分钟
        
        console.log(`\n🏆 MILESTONE: ${totalGenerated} words generated this session!`);
        console.log(`⏰ Estimated time to completion: ${Math.round(estimatedTime)} minutes\n`);
      }
      
    } catch (error) {
      console.error('💥 Main loop error:', error.message);
      consecutiveFailures++;
      await sleep(30); // 30秒休息
    }
  }
  
  // 最终统计
  const finalProgress = await checkProgress();
  console.log('\n🎯 GENERATION COMPLETE!');
  console.log(`📊 Final count: ${finalProgress.unique} unique words`);
  console.log(`🚀 Session generated: ${totalGenerated} words`);
  console.log(`🏁 Target achieved: ${finalProgress.unique >= targetWords ? 'YES' : 'NO'}`);
}

// 启动脚本
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { generateBatch, checkProgress };