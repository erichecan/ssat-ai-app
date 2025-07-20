-- 创建新的知识条目表
CREATE TABLE IF NOT EXISTS public.knowledge_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  topic text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  type text NOT NULL CHECK (type IN ('concept', 'strategy', 'example', 'common_mistake')),
  tags text[] DEFAULT '{}',
  source text,
  vector_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_topic ON public.knowledge_entries(topic);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_difficulty ON public.knowledge_entries(difficulty);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_type ON public.knowledge_entries(type);

-- 启用 RLS
ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_entries' AND policyname = 'Anyone can view knowledge entries') THEN
    CREATE POLICY "Anyone can view knowledge entries" ON public.knowledge_entries 
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- 创建更新触发器
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_knowledge_entries_updated_at ON public.knowledge_entries;
CREATE TRIGGER handle_knowledge_entries_updated_at 
  BEFORE UPDATE ON public.knowledge_entries
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 检查是否已有 mistake_questions 表，如果没有则创建
CREATE TABLE IF NOT EXISTS public.mistake_questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  question_id text NOT NULL,
  mistake_count integer DEFAULT 1,
  last_mistake_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  next_review_at timestamp with time zone DEFAULT timezone('utc'::text, now() + interval '1 day'),
  mastery_level integer DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 3),
  tags text[] DEFAULT '{}',
  user_notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, question_id)
);

-- 检查是否已有 ai_conversations 表，如果没有则创建
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  question_id text,
  user_message text NOT NULL,
  ai_response text NOT NULL,
  context_data jsonb,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 启用 RLS 对新表
ALTER TABLE public.mistake_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略 for mistake_questions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mistake_questions' AND policyname = 'Users can view own mistakes') THEN
    CREATE POLICY "Users can view own mistakes" ON public.mistake_questions 
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mistake_questions' AND policyname = 'Users can insert own mistakes') THEN
    CREATE POLICY "Users can insert own mistakes" ON public.mistake_questions 
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mistake_questions' AND policyname = 'Users can update own mistakes') THEN
    CREATE POLICY "Users can update own mistakes" ON public.mistake_questions 
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mistake_questions' AND policyname = 'Users can delete own mistakes') THEN
    CREATE POLICY "Users can delete own mistakes" ON public.mistake_questions 
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 创建 RLS 策略 for ai_conversations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_conversations' AND policyname = 'Users can view own conversations') THEN
    CREATE POLICY "Users can view own conversations" ON public.ai_conversations 
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_conversations' AND policyname = 'Users can insert own conversations') THEN
    CREATE POLICY "Users can insert own conversations" ON public.ai_conversations 
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_conversations' AND policyname = 'Users can update own conversations') THEN
    CREATE POLICY "Users can update own conversations" ON public.ai_conversations 
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;