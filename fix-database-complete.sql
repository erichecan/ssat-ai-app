-- 完整数据库修复脚本 - 更新于 2024-01-21 02:25:00
-- 修复knowledge_base表的所有缺失字段

-- 首先启用pgvector扩展（如果可用）
CREATE EXTENSION IF NOT EXISTS vector;

-- 删除现有表（如果存在）并重新创建
DROP TABLE IF EXISTS knowledge_base CASCADE;

-- 创建完整的knowledge_base表
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  topic VARCHAR(100),
  difficulty VARCHAR(20) DEFAULT 'medium',
  type VARCHAR(50) DEFAULT 'concept',
  tags TEXT[] DEFAULT '{}',
  source VARCHAR(255),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'processed',
  vector_embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_knowledge_base_topic ON knowledge_base(topic);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_difficulty ON knowledge_base(difficulty);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_source ON knowledge_base(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_created_at ON knowledge_base(created_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_file_name ON knowledge_base(file_name);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_status ON knowledge_base(status);

-- 启用行级安全策略 (RLS)
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- 创建基本的RLS策略（允许所有操作，实际项目中应该更严格）
CREATE POLICY "Allow all operations for authenticated users" ON knowledge_base FOR ALL USING (true);

-- 显示表结构
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'knowledge_base' 
ORDER BY ordinal_position; 