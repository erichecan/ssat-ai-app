#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupWizard() {
  console.log('🚀 SSAT AI 学习平台配置向导\n');
  
  // 检查当前环境变量
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ 找到现有的 .env 文件\n');
  } else {
    console.log('❌ 没有找到 .env 文件，将创建新的配置文件\n');
  }
  
  // 检查Pinecone配置
  const hasPineconeKey = envContent.includes('PINECONE_API_KEY=') && 
                        !envContent.includes('PINECONE_API_KEY=your_pinecone_api_key');
  
  if (!hasPineconeKey) {
    console.log('🔧 需要配置 Pinecone 向量数据库\n');
    console.log('请选择配置方式：');
    console.log('1. 配置 Pinecone (推荐，功能更强大)');
    console.log('2. 使用本地向量存储 (简单，但功能有限)');
    
    const choice = await question('\n请选择 (1 或 2): ');
    
    if (choice === '1') {
      // Pinecone配置
      console.log('\n📋 Pinecone 配置步骤：');
      console.log('1. 访问 https://www.pinecone.io/');
      console.log('2. 注册免费账户');
      console.log('3. 创建索引：');
      console.log('   - Name: ssat-knowledge-base');
      console.log('   - Dimensions: 768');
      console.log('   - Metric: cosine');
      console.log('   - Environment: gcp-starter (免费版)');
      console.log('4. 获取 API Key\n');
      
      const apiKey = await question('请输入你的 Pinecone API Key: ');
      const environment = await question('请输入 Environment (通常是 gcp-starter): ');
      
      // 更新环境变量
      let newEnvContent = envContent.replace(
        /PINECONE_API_KEY=.*$/m,
        `PINECONE_API_KEY=${apiKey}`
      ).replace(
        /PINECONE_ENVIRONMENT=.*$/m,
        `PINECONE_ENVIRONMENT=${environment}`
      );
      
      if (!newEnvContent.includes('PINECONE_API_KEY=')) {
        newEnvContent += `\nPINECONE_API_KEY=${apiKey}`;
      }
      if (!newEnvContent.includes('PINECONE_ENVIRONMENT=')) {
        newEnvContent += `\nPINECONE_ENVIRONMENT=${environment}`;
      }
      if (!newEnvContent.includes('PINECONE_INDEX_NAME=')) {
        newEnvContent += `\nPINECONE_INDEX_NAME=ssat-knowledge-base`;
      }
      
      fs.writeFileSync(envPath, newEnvContent);
      console.log('\n✅ Pinecone 配置已保存到 .env 文件');
      
      // 测试配置
      console.log('\n🧪 测试 Pinecone 配置...');
      try {
        require('dotenv').config({ path: envPath });
        const { spawn } = require('child_process');
        const test = spawn('node', ['scripts/test-pinecone-config.js'], { stdio: 'inherit' });
        
        test.on('close', (code) => {
          if (code === 0) {
            console.log('\n🎉 Pinecone 配置测试通过！');
          } else {
            console.log('\n❌ Pinecone 配置测试失败，将使用本地向量存储作为后备');
          }
        });
      } catch (error) {
        console.log('\n⚠️  配置测试跳过，请手动运行: npm run test-pinecone');
      }
      
    } else if (choice === '2') {
      // 本地向量存储配置
      console.log('\n📝 配置本地向量存储...');
      
      // 在环境变量中添加标记
      let newEnvContent = envContent;
      if (!newEnvContent.includes('USE_LOCAL_VECTOR_STORE=')) {
        newEnvContent += `\nUSE_LOCAL_VECTOR_STORE=true`;
      }
      
      fs.writeFileSync(envPath, newEnvContent);
      console.log('✅ 本地向量存储配置已保存');
      console.log('注意：本地向量存储功能有限，建议后续升级到 Pinecone');
    }
  } else {
    console.log('✅ Pinecone 配置已存在');
  }
  
  // 检查Gemini配置
  const hasGeminiKey = envContent.includes('GOOGLE_GEMINI_API_KEY=') && 
                      !envContent.includes('GOOGLE_GEMINI_API_KEY=your_gemini_api_key');
  
  if (!hasGeminiKey) {
    console.log('\n🔧 需要配置 Google Gemini API');
    console.log('1. 访问 https://makersuite.google.com/app/apikey');
    console.log('2. 创建 API Key');
    
    const geminiKey = await question('\n请输入你的 Gemini API Key: ');
    
    let newEnvContent = fs.readFileSync(envPath, 'utf8');
    newEnvContent = newEnvContent.replace(
      /GOOGLE_GEMINI_API_KEY=.*$/m,
      `GOOGLE_GEMINI_API_KEY=${geminiKey}`
    );
    
    if (!newEnvContent.includes('GOOGLE_GEMINI_API_KEY=')) {
      newEnvContent += `\nGOOGLE_GEMINI_API_KEY=${geminiKey}`;
    }
    
    fs.writeFileSync(envPath, newEnvContent);
    console.log('✅ Gemini API Key 已保存');
  } else {
    console.log('✅ Gemini API 配置已存在');
  }
  
  // 下一步指导
  console.log('\n🎯 配置完成！下一步：');
  console.log('1. 运行 npm install 安装依赖');
  console.log('2. 运行 npm run dev 启动开发服务器');
  console.log('3. 初始化知识库: npx ts-node scripts/initialize-knowledge-base.ts');
  console.log('4. 访问 http://localhost:3000 查看应用');
  
  rl.close();
}

if (require.main === module) {
  setupWizard().catch(console.error);
}