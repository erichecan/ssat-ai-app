# pgvector扩展问题解决方案

## 问题描述

在执行数据库修复脚本时遇到错误：
```
ERROR: 42704: type "vector" does not exist
QUERY: ALTER TABLE knowledge_base ADD COLUMN vector_embedding VECTOR(1536)
```

## 问题原因

1. **pgvector扩展未安装**：Supabase数据库中没有启用pgvector扩展
2. **VECTOR类型不存在**：PostgreSQL默认不包含VECTOR数据类型
3. **扩展权限问题**：可能需要管理员权限来安装扩展

## 解决方案

### 方案1：启用pgvector扩展（推荐）

#### 步骤1：在Supabase中启用pgvector扩展
1. 登录 Supabase Dashboard
2. 进入 **Database** → **Extensions**
3. 搜索 "vector" 扩展
4. 点击启用 pgvector 扩展

#### 步骤2：执行完整版修复脚本
使用 `fix-knowledge-base-table.sql` 脚本，包含向量嵌入功能。

### 方案2：简化版解决方案（当前采用）

#### 步骤1：执行简化版修复脚本
使用 `fix-knowledge-base-table-simple.sql` 脚本，不包含向量嵌入功能。

#### 步骤2：手动执行SQL
```sql
-- 启用pgvector扩展（如果可用）
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建knowledge_base表（简化版）
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  topic VARCHAR(100),
  difficulty VARCHAR(20) DEFAULT 'medium',
  type VARCHAR(50) DEFAULT 'concept',
  tags TEXT[] DEFAULT '{}',
  source VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 添加缺失的列
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'knowledge_base' AND column_name = 'content') THEN
        ALTER TABLE knowledge_base ADD COLUMN content TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'knowledge_base' AND column_name = 'topic') THEN
        ALTER TABLE knowledge_base ADD COLUMN topic VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'knowledge_base' AND column_name = 'difficulty') THEN
        ALTER TABLE knowledge_base ADD COLUMN difficulty VARCHAR(20) DEFAULT 'medium';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'knowledge_base' AND column_name = 'type') THEN
        ALTER TABLE knowledge_base ADD COLUMN type VARCHAR(50) DEFAULT 'concept';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'knowledge_base' AND column_name = 'tags') THEN
        ALTER TABLE knowledge_base ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'knowledge_base' AND column_name = 'source') THEN
        ALTER TABLE knowledge_base ADD COLUMN source VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'knowledge_base' AND column_name = 'created_at') THEN
        ALTER TABLE knowledge_base ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'knowledge_base' AND column_name = 'updated_at') THEN
        ALTER TABLE knowledge_base ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_knowledge_base_topic ON knowledge_base(topic);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_difficulty ON knowledge_base(difficulty);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_source ON knowledge_base(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_created_at ON knowledge_base(created_at);

-- 启用RLS
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for authenticated users" ON knowledge_base FOR ALL USING (true);
```

## 当前状态

### ✅ 已完成的修复
1. **创建简化版修复脚本**：`fix-knowledge-base-table-simple.sql`
2. **更新数据库设置文件**：移除VECTOR类型依赖
3. **简化RAG系统**：暂时不使用向量嵌入
4. **更新upload API**：使用完整的字段插入

### ❌ 待解决的问题
1. **pgvector扩展未启用**：需要手动在Supabase中启用
2. **向量搜索功能缺失**：暂时无法使用向量相似性搜索
3. **RAG功能受限**：只能使用基本的文本搜索

## 执行步骤

### 立即执行
1. **登录Supabase Dashboard**
2. **进入SQL Editor**
3. **执行简化版脚本**：
   ```sql
   -- 复制并执行 fix-knowledge-base-table-simple.sql 的内容
   ```

### 验证修复
1. **测试数据库连接**：
   ```bash
   curl -X GET "http://localhost:3001/api/test-db"
   ```

2. **测试文件上传**：
   ```bash
   curl -X POST "http://localhost:3001/api/upload" \
     -F "file=@test-upload.txt" \
     -F "userId=demo-user-123"
   ```

3. **测试文件列表**：
   ```bash
   curl -X GET "http://localhost:3001/api/uploaded-files?userId=demo-user-123"
   ```

## 后续优化

### 启用pgvector扩展后
1. **重新启用向量嵌入功能**
2. **恢复完整的RAG系统**
3. **添加向量相似性搜索**

### 代码修改
```typescript
// 在 lib/rag.ts 中重新启用向量嵌入
const { data, error } = await supabase
  .from('knowledge_base')
  .insert({
    title,
    content,
    topic,
    difficulty,
    type,
    tags,
    source,
    vector_embedding: embedding // 重新启用
  })
  .select()
  .single()
```

## 总结

当前采用简化版解决方案，移除了pgvector扩展依赖，确保文件上传功能能够正常工作。一旦在Supabase中启用了pgvector扩展，可以重新启用完整的向量搜索功能。

**关键点**：
1. pgvector扩展需要手动在Supabase中启用
2. 简化版解决方案确保基本功能正常
3. 可以后续重新启用向量搜索功能

---
*更新时间：2024-01-21 02:10:00* 