# 数据库设置指南

## 方法1：自动设置（推荐）

由于 Supabase 的限制，请手动执行以下步骤：

### 步骤1：打开 Supabase Dashboard
1. 访问 https://supabase.com/dashboard
2. 选择你的项目（项目名称应该包含 "owyxjtodppkclsxhhbcu"）
3. 在左侧菜单中点击 "SQL Editor"

### 步骤2：执行数据库设置脚本
1. 点击 "New query"
2. 将以下 SQL 代码复制并粘贴到编辑器中：

```sql
-- 创建 knowledge_base 表
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  type TEXT NOT NULL CHECK (type IN ('concept', 'strategy', 'example', 'common_mistake')),
  tags TEXT[] DEFAULT '{}',
  source TEXT,
  vector_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_knowledge_base_topic ON public.knowledge_base(topic);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_difficulty ON public.knowledge_base(difficulty);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_type ON public.knowledge_base(type);

-- 启用 RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_base' AND policyname = 'Anyone can view knowledge base') THEN
    CREATE POLICY "Anyone can view knowledge base" ON public.knowledge_base FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- 创建 mistake_questions 表
CREATE TABLE IF NOT EXISTS public.mistake_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  question_id TEXT NOT NULL,
  mistake_count INTEGER DEFAULT 1,
  last_mistake_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  next_review_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '1 day'),
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 3),
  tags TEXT[] DEFAULT '{}',
  user_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, question_id)
);

-- 启用 RLS
ALTER TABLE public.mistake_questions ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mistake_questions' AND policyname = 'Users can view own mistakes') THEN
    CREATE POLICY "Users can view own mistakes" ON public.mistake_questions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mistake_questions' AND policyname = 'Users can insert own mistakes') THEN
    CREATE POLICY "Users can insert own mistakes" ON public.mistake_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mistake_questions' AND policyname = 'Users can update own mistakes') THEN
    CREATE POLICY "Users can update own mistakes" ON public.mistake_questions FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mistake_questions' AND policyname = 'Users can delete own mistakes') THEN
    CREATE POLICY "Users can delete own mistakes" ON public.mistake_questions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 创建 ai_conversations 表
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  question_id TEXT,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  context_data JSONB,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 启用 RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_conversations' AND policyname = 'Users can view own conversations') THEN
    CREATE POLICY "Users can view own conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_conversations' AND policyname = 'Users can insert own conversations') THEN
    CREATE POLICY "Users can insert own conversations" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_conversations' AND policyname = 'Users can update own conversations') THEN
    CREATE POLICY "Users can update own conversations" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 创建触发器函数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建更新触发器
DROP TRIGGER IF EXISTS handle_mistake_questions_updated_at ON public.mistake_questions;
CREATE TRIGGER handle_mistake_questions_updated_at 
  BEFORE UPDATE ON public.mistake_questions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_knowledge_base_updated_at ON public.knowledge_base;
CREATE TRIGGER handle_knowledge_base_updated_at 
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mistake_questions_user_id ON public.mistake_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_mistake_questions_next_review ON public.mistake_questions(next_review_at);
CREATE INDEX IF NOT EXISTS idx_mistake_questions_mastery_level ON public.mistake_questions(mastery_level);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON public.ai_conversations(created_at);
```

### 步骤3：运行查询
1. 点击右下角的 "Run" 按钮
2. 等待查询完成（应该显示 "Success. No rows returned"）

### 步骤4：验证设置
在同一个 SQL Editor 中运行以下查询来验证表已创建：
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('knowledge_base', 'mistake_questions', 'ai_conversations');
```

你应该看到这三个表名返回。

### 步骤5：初始化知识库
回到终端，运行：
```bash
npm run init-knowledge
```

## 方法2：使用 Supabase CLI（高级用户）

如果你安装了 Supabase CLI：
```bash
supabase db reset
supabase db push
```

## 故障排除

如果遇到问题：
1. 确认你有项目的正确权限
2. 检查 SQL 语法是否正确
3. 确认所有表都已创建
4. 检查 RLS 策略是否正确应用

## 完成后

数据库设置完成后，你可以运行：
- `npm run init-knowledge` - 初始化知识库
- `npm run dev` - 启动开发服务器
- 访问 `http://localhost:3000` 测试应用