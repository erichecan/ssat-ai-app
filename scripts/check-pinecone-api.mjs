import 'dotenv/config'
import { Pinecone } from '@pinecone-database/pinecone'

async function checkPineconeAPI() {
  console.log('🔍 检查 Pinecone API 连接...\n')
  
  try {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    
    console.log('✅ Pinecone 客户端初始化成功')
    console.log(`🔑 API Key: ${process.env.PINECONE_API_KEY?.substring(0, 10)}...`)
    
    // 尝试列出索引
    console.log('\n🔍 尝试列出索引...')
    const indexList = await pinecone.listIndexes()
    
    console.log('✅ API 连接成功')
    console.log(`📊 现有索引数量: ${indexList.indexes?.length || 0}`)
    
    if (indexList.indexes && indexList.indexes.length > 0) {
      console.log('\n📋 现有索引:')
      indexList.indexes.forEach((index, i) => {
        console.log(`   ${i + 1}. ${index.name}`)
        console.log(`      维度: ${index.dimension}`)
        console.log(`      指标: ${index.metric}`)
        console.log(`      状态: ${index.status?.ready ? '就绪' : '创建中'}`)
        console.log(`      主机: ${index.host}`)
      })
    }
    
    return true
    
  } catch (error) {
    console.error('❌ API 连接失败:', error.message)
    console.error('错误详情:', error)
    return false
  }
}

// 运行检查
checkPineconeAPI().then(success => {
  if (success) {
    console.log('\n✅ Pinecone API 工作正常')
  } else {
    console.log('\n❌ Pinecone API 连接失败')
  }
  process.exit(success ? 0 : 1)
})