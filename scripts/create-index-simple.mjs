import 'dotenv/config'
import { Pinecone } from '@pinecone-database/pinecone'

async function createIndex() {
  console.log('🔧 创建 Pinecone 索引...\n')
  
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
  const indexName = process.env.PINECONE_INDEX_NAME
  
  try {
    console.log(`📝 创建索引: ${indexName}`)
    console.log('   维度: 768')
    console.log('   指标: cosine')
    console.log('   类型: serverless')
    console.log('   云: gcp')
    console.log('   区域: us-east1\n')
    
    await pinecone.createIndex({
      name: indexName,
      dimension: 768,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'gcp',
          region: 'us-east1'
        }
      }
    })
    
    console.log('✅ 索引创建请求已发送')
    console.log('⏳ 正在等待索引准备就绪...')
    
    // 等待索引准备就绪
    let ready = false
    let attempts = 0
    const maxAttempts = 20
    
    while (!ready && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      try {
        const indexList = await pinecone.listIndexes()
        const ourIndex = indexList.indexes?.find(idx => idx.name === indexName)
        
        if (ourIndex) {
          console.log(`   尝试 ${attempts + 1}: 状态 ${ourIndex.status?.ready ? '就绪' : '创建中'}`)
          
          if (ourIndex.status?.ready) {
            ready = true
            console.log('🎉 索引已准备就绪!')
            console.log(`   名称: ${ourIndex.name}`)
            console.log(`   维度: ${ourIndex.dimension}`)
            console.log(`   主机: ${ourIndex.host}`)
          }
        } else {
          console.log(`   尝试 ${attempts + 1}: 索引仍在创建中...`)
        }
      } catch (error) {
        console.log(`   尝试 ${attempts + 1}: 检查状态中...`)
      }
      
      attempts++
    }
    
    if (!ready) {
      console.log('⚠️  索引创建需要更长时间，请稍后手动检查')
      console.log('💡 可以运行 npm run test-pinecone 来检查状态')
    }
    
    return true
    
  } catch (error) {
    console.error('❌ 创建索引失败:', error.message)
    
    if (error.message.includes('already exists')) {
      console.log('✅ 索引已存在')
      return true
    }
    
    return false
  }
}

// 运行创建
createIndex().then(success => {
  if (success) {
    console.log('\n🚀 下一步: 运行 npm run init-knowledge')
  } else {
    console.log('\n❌ 创建失败')
  }
  process.exit(success ? 0 : 1)
})