-- 简化版knowledge_base表结构修复
-- 2024-01-21 02:05:00
-- 不包含vector_embedding列，避免pgvector扩展问题

-- 检查表是否存在，如果不存在则创建
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

-- 如果表存在但缺少列，则添加缺失的列
DO $$ 
BEGIN 
    -- 添加content列（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'knowledge_base' AND column_name = 'content') THEN
        ALTER TABLE knowledge_base ADD COLUMN content TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added content column to knowledge_base table';
    END IF;
    
    -- 添加topic列（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'knowledge_base' AND column_name = 'topic') THEN
        ALTER TABLE knowledge_base ADD COLUMN topic VARCHAR(100);
        RAISE NOTICE 'Added topic column to knowledge_base table';
    END IF;
    
    -- 添加difficulty列（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'knowledge_base' AND column_name = 'difficulty') THEN
        ALTER TABLE knowledge_base ADD COLUMN difficulty VARCHAR(20) DEFAULT 'medium';
        RAISE NOTICE 'Added difficulty column to knowledge_base table';
    END IF;
    
    -- 添加type列（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'knowledge_base' AND column_name = 'type') THEN
        ALTER TABLE knowledge_base ADD COLUMN type VARCHAR(50) DEFAULT 'concept';
        RAISE NOTICE 'Added type column to knowledge_base table';
    END IF;
    
    -- 添加tags列（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'knowledge_base' AND column_name = 'tags') THEN
        ALTER TABLE knowledge_base ADD COLUMN tags TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added tags column to knowledge_base table';
    END IF;
    
    -- 添加source列（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'knowledge_base' AND column_name = 'source') THEN
        ALTER TABLE knowledge_base ADD COLUMN source VARCHAR(255);
        RAISE NOTICE 'Added source column to knowledge_base table';
    END IF;
    
    -- 添加created_at列（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'knowledge_base' AND column_name = 'created_at') THEN
        ALTER TABLE knowledge_base ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added created_at column to knowledge_base table';
    END IF;
    
    -- 添加updated_at列（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'knowledge_base' AND column_name = 'updated_at') THEN
        ALTER TABLE knowledge_base ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column to knowledge_base table';
    END IF;
    
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_knowledge_base_topic ON knowledge_base(topic);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_difficulty ON knowledge_base(difficulty);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_source ON knowledge_base(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_created_at ON knowledge_base(created_at);

-- 启用行级安全策略 (RLS)
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- 创建基本的RLS策略（允许所有操作，实际项目中应该更严格）
CREATE POLICY "Allow all operations for authenticated users" ON knowledge_base FOR ALL USING (true);

-- 显示表结构
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'knowledge_base' 
ORDER BY ordinal_position; 