import 'dotenv/config'
import { Pinecone } from '@pinecone-database/pinecone'

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })

async function fixPineconeDimensions() {
  console.log('🔧 修复 Pinecone 索引维度...\n')
  
  const indexName = process.env.PINECONE_INDEX_NAME
  
  try {
    // 检查当前索引
    const index = pinecone.index(indexName)
    const stats = await index.describeIndexStats()
    
    console.log(`🔍 当前索引信息:`)
    console.log(`   索引名称: ${indexName}`)
    console.log(`   当前维度: ${stats.dimension}`)
    console.log(`   向量数量: ${stats.totalVectorCount}`)
    console.log(`   需要维度: 768 (Gemini text-embedding-004)\n`)
    
    if (stats.dimension === 768) {
      console.log('✅ 索引维度已正确，无需修复')
      return true
    }
    
    console.log('❌ 维度不匹配，需要重新创建索引')
    
    // 如果索引为空，直接删除重建
    if (stats.totalVectorCount === 0 || stats.totalVectorCount === undefined) {
      console.log('🗑️  删除现有空索引...')
      await pinecone.deleteIndex(indexName)
      console.log('✅ 空索引删除成功')
      
      // 等待删除完成
      console.log('⏳ 等待索引删除完成...')
      await new Promise(resolve => setTimeout(resolve, 30000))
      
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
      
      console.log('✅ 新索引创建成功')
      
      // 等待索引准备就绪
      console.log('⏳ 等待索引准备就绪...')
      await new Promise(resolve => setTimeout(resolve, 30000))
      
      // 验证新索引
      const newStats = await index.describeIndexStats()
      console.log(`\n🎉 新索引验证:`)
      console.log(`   维度: ${newStats.dimension}`)
      console.log(`   向量数量: ${newStats.totalVectorCount}`)
      
      return true
    } else {
      console.log('⚠️  索引包含数据，请手动处理:')
      console.log('1. 备份现有数据')
      console.log('2. 删除现有索引')
      console.log('3. 创建新索引（维度 768）')
      console.log('4. 重新运行初始化脚本')
      return false
    }
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error.message)
    return false
  }
}

// 运行修复
fixPineconeDimensions().then(success => {
  if (success) {
    console.log('\n🚀 下一步: 运行 npm run init-knowledge')
  } else {
    console.log('\n❌ 修复失败，请检查错误信息')
  }
  process.exit(success ? 0 : 1)
})