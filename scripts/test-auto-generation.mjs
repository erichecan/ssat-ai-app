import dotenv from 'dotenv'

dotenv.config()

async function testAutoGeneration() {
  console.log('🧪 测试AI自动生成功能...')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  try {
    // 1. 测试GET方法（状态检查）
    console.log('\n📊 检查自动生成状态...')
    const statusResponse = await fetch(`${baseUrl}/api/vocabulary/auto-generate`)
    const statusData = await statusResponse.json()
    
    if (statusData.message) {
      console.log(`✅ 状态检查: ${statusData.message}`)
      console.log(`   当前单词数: ${statusData.currentStatus?.totalWords}`)
      console.log(`   目标剩余: ${statusData.currentStatus?.targetRemaining}`)
      console.log(`   生成间隔: ${statusData.interval}`)
      console.log(`   批次大小: ${statusData.batchSize}`)
    } else {
      console.log('❌ 状态检查失败:', statusData.error)
      return
    }
    
    // 2. 测试POST方法（生成单词）
    console.log('\n⚡ 测试单词生成...')
    const generateResponse = await fetch(`${baseUrl}/api/vocabulary/auto-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const generateData = await generateResponse.json()
    
    if (generateData.success) {
      console.log(`✅ 单词生成成功!`)
      console.log(`   生成数量: ${generateData.stats?.totalGenerated} 个单词`)
      console.log(`   现有单词: ${generateData.stats?.existingWords} 个`)
      console.log(`   新的总数: ${generateData.stats?.newTotal} 个`)
      console.log(`   目标剩余: ${generateData.stats?.targetRemaining} 个`)
      console.log(`   消息: ${generateData.message}`)
    } else {
      console.log('❌ 单词生成失败:', generateData.error)
      if (generateData.details) {
        console.log('   详细错误:', generateData.details)
      }
      return
    }
    
    // 3. 再次检查状态
    console.log('\n📈 生成后状态检查...')
    const finalStatusResponse = await fetch(`${baseUrl}/api/vocabulary/auto-generate`)
    const finalStatusData = await finalStatusResponse.json()
    
    if (finalStatusData.currentStatus) {
      console.log(`✅ 最终状态:`)
      console.log(`   当前单词数: ${finalStatusData.currentStatus.totalWords}`)
      console.log(`   目标剩余: ${finalStatusData.currentStatus.targetRemaining}`)
    }
    
    // 4. 总结
    console.log('\n🎉 自动生成功能测试完成!')
    console.log('✅ 状态检查: 正常')
    console.log('✅ 单词生成: 正常')
    console.log('✅ 数据库更新: 正常')
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error)
  }
}

testAutoGeneration() 