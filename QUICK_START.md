# 🚀 SSAT AI 学习平台快速启动指南

## 方法1：使用配置向导（推荐）

```bash
# 1. 运行配置向导
npm run setup

# 2. 启动开发服务器
npm run dev

# 3. 初始化知识库（可选）
npm run init-knowledge
```

## 方法2：手动配置

### 步骤1：配置Pinecone（推荐）

1. **注册Pinecone账户**
   - 访问 https://www.pinecone.io/
   - 注册免费账户

2. **创建索引**
   - Index Name: `ssat-knowledge-base`
   - Dimensions: `768`
   - Metric: `cosine`
   - Environment: `gcp-starter`

3. **获取API Key**
   - 在控制台中复制API Key

4. **更新.env文件**
   ```env
   PINECONE_API_KEY=你的API密钥
   PINECONE_ENVIRONMENT=gcp-starter
   PINECONE_INDEX_NAME=ssat-knowledge-base
   ```

### 步骤2：配置Gemini API

1. **获取API Key**
   - 访问 https://makersuite.google.com/app/apikey
   - 创建API Key

2. **更新.env文件**
   ```env
   GOOGLE_GEMINI_API_KEY=你的API密钥
   ```

### 步骤3：测试配置

```bash
# 测试Pinecone配置
npm run test-pinecone

# 启动开发服务器
npm run dev
```

## 方法3：仅使用本地向量存储

如果你不想配置Pinecone，可以使用本地向量存储：

1. **在.env文件中添加**
   ```env
   USE_LOCAL_VECTOR_STORE=true
   ```

2. **启动应用**
   ```bash
   npm run dev
   ```

> 注意：本地向量存储功能有限，建议后续升级到Pinecone

## 功能验证

启动后，你可以测试以下功能：

1. **主页** - http://localhost:3000
   - 查看学习分析仪表板
   - 测试AI助手按钮

2. **测试页面** - http://localhost:3000/test
   - 体验AI助手功能
   - 测试问答交互

3. **错题本** - http://localhost:3000/mistakes
   - 查看错题管理界面
   - 测试复习功能

## 常见问题

### Q: Pinecone连接失败
A: 检查以下几点：
- API Key是否正确
- 索引名称是否匹配
- 环境名称是否正确

### Q: AI助手无响应
A: 检查Gemini API配置：
- API Key是否有效
- 是否有API调用限制

### Q: 知识库为空
A: 运行初始化脚本：
```bash
npm run init-knowledge
```

### Q: 本地向量存储如何使用
A: 系统会自动检测Pinecone是否可用，如果不可用会自动降级到本地存储

## 技术支持

如果遇到问题：
1. 检查控制台错误信息
2. 查看 `docs/` 目录中的详细文档
3. 确认所有环境变量正确配置

## 下一步

配置完成后，建议：
1. 运行知识库初始化脚本
2. 测试所有核心功能
3. 根据需要调整配置
4. 部署到生产环境