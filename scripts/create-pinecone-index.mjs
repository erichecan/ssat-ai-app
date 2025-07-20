import 'dotenv/config'
import { Pinecone } from '@pinecone-database/pinecone'

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })

async function createPineconeIndex() {
  console.log('🔧 创建 Pinecone 索引...\n')
  
  const indexName = process.env.PINECONE_INDEX_NAME
  
  try {
    // 检查索引是否已存在
    try {
      const existingIndex = pinecone.index(indexName)
      const stats = await existingIndex.describeIndexStats()
      console.log(`✅ 索引 "${indexName}" 已存在`)
      console.log(`   维度: ${stats.dimension}`)
      console.log(`   向量数量: ${stats.totalVectorCount || 0}`)
      return true
    } catch (error) {
      if (error.message.includes('404')) {
        console.log(`📝 索引 "${indexName}" 不存在，开始创建...`)
      } else {
        throw error
      }
    }
    
    // 创建新索引
    console.log('🔧 创建新索引...')
    await pinecone.createIndex({
      name: indexName,
      dimension: 768, // Gemini text-embedding-004 的维度
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'gcp',
          region: 'us-east1'  // 免费计划支持的区域
        }
      }
    })
    
    console.log('✅ 索引创建请求已发送')
    
    // 等待索引准备就绪
    console.log('⏳ 等待索引准备就绪...')
    let ready = false
    let attempts = 0
    const maxAttempts = 12 // 最多等待 60 秒
    
    while (!ready && attempts < maxAttempts) {
      try {
        await new Promise(resolve => setTimeout(resolve, 5000))
        const index = pinecone.index(indexName)
        const stats = await index.describeIndexStats()
        
        console.log(`   尝试 ${attempts + 1}: 维度 ${stats.dimension}, 状态检查...`)
        
        if (stats.dimension === 768) {
          ready = true
          console.log('✅ 索引准备就绪!')
          console.log(`   维度: ${stats.dimension}`)
          console.log(`   向量数量: ${stats.totalVectorCount || 0}`)
        }
      } catch (error) {
        console.log(`   尝试 ${attempts + 1}: 仍在创建中...`)
      }
      attempts++
    }
    
    if (!ready) {
      console.log('⚠️  索引创建可能需要更长时间，请稍后手动检查')
      return true // 虽然没有完全准备好，但创建请求已发送
    }
    
    return true
    
  } catch (error) {
    console.error('❌ 创建索引时出错:', error.message)
    
    if (error.message.includes('INVALID_ARGUMENT')) {
      console.log('💡 可能的解决方案:')
      console.log('1. 检查免费计划的区域限制')
      console.log('2. 尝试使用不同的区域 (us-west1, us-east1)')
      console.log('3. 升级到付费计划')
    }
    
    return false
  }
}

// 运行创建
createPineconeIndex().then(success => {
  if (success) {
    console.log('\n🚀 下一步: 运行 npm run init-knowledge')
  } else {
    console.log('\n❌ 创建失败，请检查错误信息')
  }
  process.exit(success ? 0 : 1)
})