const { Pinecone } = require('@pinecone-database/pinecone');
const fs = require('fs');
const path = require('path');

async function autoSetupPinecone() {
  console.log('🚀 自动配置 Pinecone...\n');
  
  // 读取当前环境变量
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // 提取API Key
  const apiKeyMatch = envContent.match(/PINECONE_API_KEY=([^\s\n]+)/);
  
  if (!apiKeyMatch || apiKeyMatch[1] === 'your_pinecone_api_key') {
    console.error('❌ 未找到有效的 Pinecone API Key');
    return false;
  }
  
  const apiKey = apiKeyMatch[1];
  console.log(`✅ 找到 API Key: ${apiKey.substring(0, 10)}...`);
  
  try {
    // 初始化 Pinecone 客户端
    const pinecone = new Pinecone({
      apiKey: apiKey,
    });
    
    console.log('✅ Pinecone 客户端初始化成功');
    
    // 获取可用的环境
    let environment = 'gcp-starter'; // 默认免费环境
    console.log(`🔍 使用环境: ${environment}`);
    
    // 检查索引是否存在
    const indexName = 'ssat-knowledge-base';
    let indexExists = false;
    
    try {
      const indexList = await pinecone.listIndexes();
      indexExists = indexList.indexes && indexList.indexes.some(idx => idx.name === indexName);
      console.log(`🔍 检查索引 "${indexName}": ${indexExists ? '已存在' : '不存在'}`);
    } catch (error) {
      console.log('⚠️  无法列出索引，将尝试创建新索引');
    }
    
    if (!indexExists) {
      console.log('🔧 创建新索引...');
      try {
        await pinecone.createIndex({
          name: indexName,
          dimension: 768, // Gemini text-embedding-004 的维度
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'gcp',
              region: 'us-central1'
            }
          }
        });
        console.log('✅ 索引创建成功');
        
        // 等待索引准备就绪
        console.log('⏳ 等待索引准备就绪...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
      } catch (createError) {
        console.error('❌ 创建索引失败:', createError.message);
        if (createError.message.includes('already exists')) {
          console.log('✅ 索引已存在，继续配置...');
        } else {
          return false;
        }
      }
    }
    
    // 测试索引连接
    try {
      const index = pinecone.index(indexName);
      const stats = await index.describeIndexStats();
      console.log('✅ 索引连接测试成功');
      console.log(`   维度: ${stats.dimension || 'Unknown'}`);
      console.log(`   向量数量: ${stats.totalVectorCount || 0}`);
    } catch (error) {
      console.error('❌ 索引连接测试失败:', error.message);
      return false;
    }
    
    // 自动检测环境
    try {
      // 由于新版本Pinecone使用serverless，环境配置有所不同
      environment = 'serverless'; // 或者根据实际情况调整
    } catch (error) {
      console.log('⚠️  使用默认环境配置');
    }
    
    // 更新环境变量文件
    envContent = envContent.replace(
      /PINECONE_ENVIRONMENT=.*/,
      `PINECONE_ENVIRONMENT=${environment}`
    );
    
    // 确保索引名称正确
    if (!envContent.includes('PINECONE_INDEX_NAME=ssat-knowledge-base')) {
      envContent = envContent.replace(
        /PINECONE_INDEX_NAME=.*/,
        'PINECONE_INDEX_NAME=ssat-knowledge-base'
      );
    }
    
    // 写入更新的环境变量
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n🎉 Pinecone 配置完成！');
    console.log('✅ 环境变量已更新');
    console.log('✅ 索引已创建并可用');
    
    return true;
    
  } catch (error) {
    console.error('❌ 配置过程中出错:', error.message);
    
    // 提供错误解决建议
    if (error.message.includes('Unauthorized')) {
      console.log('💡 建议: 检查 API Key 是否正确');
    } else if (error.message.includes('quota')) {
      console.log('💡 建议: 检查免费额度是否已用完');
    } else if (error.message.includes('region')) {
      console.log('💡 建议: 尝试使用不同的区域');
    }
    
    return false;
  }
}

// 运行自动配置
if (require.main === module) {
  autoSetupPinecone().then((success) => {
    if (success) {
      console.log('\n🚀 下一步:');
      console.log('1. 运行 npm run dev 启动开发服务器');
      console.log('2. 运行 npm run init-knowledge 初始化知识库');
      console.log('3. 访问 http://localhost:3000 测试应用');
    } else {
      console.log('\n❌ 配置失败。请检查错误信息或手动配置。');
      console.log('💡 你也可以使用本地向量存储作为替代方案。');
    }
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ 意外错误:', error);
    process.exit(1);
  });
}

module.exports = { autoSetupPinecone };