import 'dotenv/config'
import { Pinecone } from '@pinecone-database/pinecone'

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })

async function checkPineconeEmpty() {
  console.log('🔍 检查 Pinecone 索引是否为空...\n')
  
  const indexName = process.env.PINECONE_INDEX_NAME
  
  try {
    const index = pinecone.index(indexName)
    const stats = await index.describeIndexStats()
    
    console.log(`📊 索引统计信息:`)
    console.log(`   索引名称: ${indexName}`)
    console.log(`   维度: ${stats.dimension}`)
    console.log(`   向量数量: ${stats.totalVectorCount}`)
    console.log(`   索引填充度: ${stats.indexFullness}`)
    console.log(`   命名空间: ${JSON.stringify(stats.namespaces || {})}`)
    
    // 尝试查询一个向量看看是否真的为空
    try {
      const queryResult = await index.query({
        vector: new Array(stats.dimension).fill(0.1),
        topK: 1,
        includeMetadata: true
      })
      
      console.log(`\n🔍 查询结果:`)
      console.log(`   匹配数量: ${queryResult.matches?.length || 0}`)
      
      if (queryResult.matches && queryResult.matches.length > 0) {
        console.log('❌ 索引包含数据，不能自动删除')
        return false
      } else {
        console.log('✅ 索引为空，可以安全删除')
        return true
      }
    } catch (queryError) {
      console.log(`⚠️  查询失败: ${queryError.message}`)
      if (stats.totalVectorCount === 0) {
        console.log('✅ 根据统计信息，索引为空')
        return true
      } else {
        console.log('❌ 无法确定索引是否为空，请手动检查')
        return false
      }
    }
    
  } catch (error) {
    console.error('❌ 检查过程中出错:', error.message)
    return false
  }
}

// 运行检查
checkPineconeEmpty().then(isEmpty => {
  if (isEmpty) {
    console.log('\n🎯 索引为空，可以运行: npm run fix-pinecone')
  } else {
    console.log('\n⚠️  索引包含数据，需要手动处理')
  }
  process.exit(0)
})