# Pinecone 配置指南

## 1. 注册Pinecone账户
访问 https://www.pinecone.io/ 并注册免费账户

## 2. 获取配置信息
登录后，你需要获取以下信息：

### API Key
- 在控制台左侧菜单点击 "API Keys"
- 复制 API Key（格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）

### Environment 
- 在控制台中查看你的环境名称
- 免费版通常是：`gcp-starter` 或 `aws-starter`

## 3. 创建索引
- 点击 "Create Index"
- Index Name: `ssat-knowledge-base`
- Dimensions: `768`
- Metric: `cosine`
- Environment: 选择你的环境（如 `gcp-starter`）

## 4. 更新 .env 文件
将获取的信息填入以下格式：

```env
PINECONE_API_KEY=你的API密钥
PINECONE_ENVIRONMENT=你的环境名称
PINECONE_INDEX_NAME=ssat-knowledge-base
```

## 5. 测试配置
配置完成后，可以运行以下命令测试：

```bash
npm run dev
```

## 6. 初始化知识库
配置成功后，运行以下命令初始化知识库：

```bash
npx ts-node scripts/initialize-knowledge-base.ts
```

## 注意事项
- 免费版Pinecone有使用限制（1个索引，最多100MB存储）
- 如果遇到问题，检查API Key是否正确复制
- 确保索引名称与环境变量中的名称一致

## 常见问题

### 1. API Key无效
- 确保API Key完整复制，没有多余空格
- 检查是否使用了正确的环境变量名称

### 2. 索引创建失败
- 确认维度设置为768
- 确认metric设置为cosine
- 检查索引名称是否符合要求（只能包含小写字母、数字和连字符）

### 3. 连接超时
- 检查网络连接
- 确认环境名称正确
- 尝试重新创建索引

需要帮助？请查看 Pinecone 官方文档：https://docs.pinecone.io/