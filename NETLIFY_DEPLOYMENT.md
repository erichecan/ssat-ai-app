# 🚀 SSAT AI学习平台 - Netlify部署指南

## 📋 部署前检查列表

### ✅ 必需的环境变量

在Netlify仪表板的 **Site settings > Environment variables** 中设置：

```bash
# 数据库配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI服务
GEMINI_API_KEY=your-gemini-api-key

# 应用配置
NEXT_PUBLIC_APP_URL=https://your-app.netlify.app
JWT_SECRET=your-super-secret-jwt-key

# 功能开关
NEXT_PUBLIC_ENABLE_AI_CHAT=true
NEXT_PUBLIC_ENABLE_PINECONE=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### ⚙️ 可选环境变量 (高级功能)

```bash
# Pinecone 向量数据库 (如果启用AI搜索)
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment
PINECONE_INDEX_NAME=ssat-knowledge-base

# 安全配置
ALLOWED_ORIGINS=https://your-app.netlify.app
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# 调试配置
DEBUG=false
VERBOSE_LOGGING=false
```

### 🔧 Netlify构建设置

1. **构建命令**: `npm run build`
2. **发布目录**: `.next`
3. **Node.js版本**: `18.x`
4. **包管理器**: `npm`

### 🗄️ 数据库设置

1. **创建Supabase项目**
2. **运行SQL脚本**:
   ```sql
   -- 在Supabase SQL编辑器中运行
   -- 使用项目根目录的 database-setup-complete.sql
   ```

### 🔌 第三方服务配置

#### Google Gemini API
1. 访问 [Google AI Studio](https://makersuite.google.com/)
2. 创建API密钥
3. 添加到环境变量

#### Supabase
1. 创建新项目
2. 获取项目URL和API密钥
3. 配置RLS策略

## 🚀 部署步骤

### 1. 准备代码
```bash
# 确保所有更改已提交
git add .
git commit -m "准备Netlify部署"
git push origin main
```

### 2. 在Netlify中部署
1. 登录 [Netlify](https://netlify.com)
2. 点击 "New site from Git"
3. 连接GitHub仓库
4. 配置构建设置:
   - **Repository**: 你的GitHub仓库
   - **Branch**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

### 3. 配置环境变量
1. 转到 **Site settings > Environment variables**
2. 添加所有必需的环境变量
3. 保存设置

### 4. 触发重新部署
1. 转到 **Deploys** 标签
2. 点击 **Trigger deploy**

## 🔍 部署后验证

### ✅ 功能检查
- [ ] 主页正常加载
- [ ] 用户注册/登录
- [ ] AI聊天功能
- [ ] 练习功能
- [ ] 闪卡系统
- [ ] 数据持久化
- [ ] 响应式设计

### 🔧 性能检查
- [ ] 页面加载速度 < 3秒
- [ ] 图片正常显示
- [ ] API响应正常
- [ ] 无控制台错误

### 🛡️ 安全检查
- [ ] HTTPS启用
- [ ] 环境变量保护
- [ ] CORS配置正确
- [ ] CSP头部设置

## 🎯 优化建议

### 性能优化
1. **启用Netlify Analytics**
2. **配置CDN缓存**
3. **使用Netlify Image Optimization**
4. **启用Asset Optimization**

### 监控设置
1. **设置Uptime监控**
2. **配置错误通知**
3. **启用性能监控**

## 🐛 常见问题解决

### 构建失败
```bash
# 检查Node版本
node --version  # 应该是18.x

# 清理依赖
rm -rf node_modules package-lock.json
npm install

# 本地测试构建
npm run build
```

### 环境变量问题
1. 确保所有变量名正确
2. 检查值是否包含特殊字符
3. 重新部署以应用更改

### 数据库连接问题
1. 验证Supabase URL和密钥
2. 检查网络设置
3. 确认RLS策略

### API路由不工作
1. 检查Netlify Functions配置
2. 验证重定向规则
3. 查看部署日志

## 📞 支持资源

- [Netlify文档](https://docs.netlify.com/)
- [Next.js部署指南](https://nextjs.org/docs/deployment)
- [Supabase文档](https://supabase.com/docs)
- [项目GitHub仓库](https://github.com/your-username/ssat-ai-app)

---

**部署日期**: 2024-01-20  
**版本**: v1.0.0  
**状态**: ✅ 可以部署 