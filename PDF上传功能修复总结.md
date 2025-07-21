# PDF 上传功能修复总结

## 🚨 修复的问题

**问题**: PDF 上传时出现 "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" 错误  
**根本原因**: 
1. 服务器返回 HTML 错误页面而不是 JSON 响应
2. PDF 解析库在 Netlify 环境中的兼容性问题
3. 错误处理不完善

## 🔧 修复方案

### 1. 前端响应检查 (`app/upload/page.tsx`)
```typescript
// 检查响应类型
const contentType = response.headers.get('content-type');
if (!contentType || !contentType.includes('application/json')) {
  const text = await response.text();
  console.error('Non-JSON response:', text);
  throw new Error('Server returned an invalid response. Please check if the API is working correctly.');
}
```

### 2. 后端 PDF 解析优化 (`app/api/upload/route.ts`)

#### 改进的动态导入机制:
```typescript
async function getPdfParser() {
  if (!pdfParse) {
    try {
      console.log('Loading pdf-parse module...')
      let pdfModule
      try {
        pdfModule = await import('pdf-parse')
      } catch (e1) {
        console.log('First import attempt failed, trying alternative...')
        try {
          pdfModule = require('pdf-parse')
        } catch (e2) {
          console.error('All import methods failed:', e1, e2)
          throw new Error('PDF parsing library could not be loaded')
        }
      }
      
      pdfParse = pdfModule.default || pdfModule
      console.log('PDF parser loaded successfully')
    } catch (error) {
      console.error('Failed to load pdf-parse:', error)
      throw new Error(`PDF parsing is not available: ${error.message}`)
    }
  }
  return pdfParse
}
```

#### 添加超时处理和更好的错误消息:
```typescript
// 添加超时处理，防止长时间阻塞
const parsePromise = pdfParser(buffer)
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('PDF parsing timeout')), 30000)
)

const pdfData = await Promise.race([parsePromise, timeoutPromise])
content = pdfData.text

if (!content || content.trim().length === 0) {
  throw new Error('PDF appears to be empty or contains no extractable text')
}
```

#### 改进的错误处理:
```typescript
return NextResponse.json(
  { 
    error: 'Failed to parse PDF file. This could be due to: 1) The PDF is password protected, 2) The PDF contains only images/scanned content, 3) The PDF is corrupted. Please ensure your PDF contains selectable text.',
    details: pdfError instanceof Error ? pdfError.message : 'Unknown PDF parsing error'
  },
  { 
    status: 400,
    headers: {
      'Content-Type': 'application/json',
    }
  }
)
```

### 3. Next.js 配置优化 (`next.config.js`)
```javascript
// Webpack配置支持pdf-parse
webpack: (config, { isServer }) => {
  if (isServer) {
    // 确保pdf-parse在服务器端正确工作
    config.externals = config.externals || []
    config.externals.push({
      'pdf-parse': 'commonjs pdf-parse',
    })
  }
  return config
},
```

### 4. Netlify 环境配置 (`netlify.toml`)
```toml
[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--legacy-peer-deps"
  NODE_OPTIONS = "--max-old-space-size=4096"
  AWS_LAMBDA_JS_RUNTIME = "nodejs18.x"
```

### 5. CORS 支持
```typescript
// 添加OPTIONS方法支持CORS预检请求
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
```

## 📋 修复的文件列表

1. **`app/upload/page.tsx`** - 添加响应类型检查
2. **`app/api/upload/route.ts`** - 完全重构PDF解析和错误处理
3. **`next.config.js`** - 添加webpack配置支持pdf-parse
4. **`netlify.toml`** - 优化Netlify环境配置

## 🎯 功能验证

### 支持的PDF类型:
- ✅ 文本型PDF（可选择复制文本的PDF）
- ✅ 混合型PDF（文本+图片）
- ❌ 纯图片扫描PDF（需要OCR，暂不支持）
- ❌ 加密/密码保护的PDF

### 错误处理改进:
- ✅ 网络错误友好提示
- ✅ PDF解析失败详细说明
- ✅ 文件类型/大小限制提示
- ✅ 超时处理（30秒）
- ✅ 空内容检测

### 兼容性:
- ✅ 本地开发环境
- ✅ Netlify生产环境
- ✅ AWS Lambda函数
- ✅ Node.js 18

## 🚀 部署建议

1. **环境变量确认**:
   - 确保所有Supabase和API密钥正确设置
   
2. **PDF文件要求**:
   - 文件大小: ≤ 10MB
   - 格式: PDF文件必须包含可选择的文本
   - 不支持: 扫描版PDF、加密PDF

3. **错误监控**:
   - 查看Netlify函数日志
   - 监控上传成功率
   - 用户反馈收集

## 🎉 预期结果

修复完成后，PDF上传功能应该能够：
1. ✅ 正确解析包含文本的PDF文件
2. ✅ 提供清晰的错误消息和用户指导
3. ✅ 在Netlify环境中稳定运行
4. ✅ 处理各种边缘情况（空文件、超时等）
5. ✅ 返回正确的JSON响应格式

**注意**: 如果仍然遇到问题，可能需要检查具体的PDF文件是否包含可提取的文本内容。