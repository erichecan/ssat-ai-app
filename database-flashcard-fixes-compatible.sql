-- 修复Flashcard数据库表结构 (兼容版本)
-- 解决缺失的user_flashcard_progress表并优化flashcards表结构

-- 1. 创建user_flashcard_progress表 (解决API中引用的缺失表)
CREATE TABLE IF NOT EXISTS public.user_flashcard_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  flashcard_id TEXT NOT NULL, -- 对应flashcard-bank.ts中的word ID
  mastery_level INTEGER DEFAULT 0, -- 0=新词, 1=困难, 2=一般, 3=简单, 4=已掌握
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  difficulty_rating INTEGER DEFAULT 0, -- 用户主观难度评分 1-5
  last_seen TIMESTAMP WITH TIME ZONE,
  next_review TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  interval_days INTEGER DEFAULT 1, -- 艾宾浩斯间隔天数
  ease_factor DECIMAL(3,2) DEFAULT 2.50, -- 艾宾浩斯难度系数
  is_mastered BOOLEAN DEFAULT false, -- 是否已掌握（不再复习）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, flashcard_id)
);

-- 2. 升级现有flashcards表以支持动态词汇
-- 添加列来支持从practice中保存生词
DO $$ 
BEGIN
    -- 安全地添加列（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='word') THEN
        ALTER TABLE public.flashcards ADD COLUMN word TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='definition') THEN
        ALTER TABLE public.flashcards ADD COLUMN definition TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='pronunciation') THEN
        ALTER TABLE public.flashcards ADD COLUMN pronunciation TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='part_of_speech') THEN
        ALTER TABLE public.flashcards ADD COLUMN part_of_speech TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='example_sentence') THEN
        ALTER TABLE public.flashcards ADD COLUMN example_sentence TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='memory_tip') THEN
        ALTER TABLE public.flashcards ADD COLUMN memory_tip TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='synonyms') THEN
        ALTER TABLE public.flashcards ADD COLUMN synonyms TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='antonyms') THEN
        ALTER TABLE public.flashcards ADD COLUMN antonyms TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='etymology') THEN
        ALTER TABLE public.flashcards ADD COLUMN etymology TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='category') THEN
        ALTER TABLE public.flashcards ADD COLUMN category TEXT DEFAULT 'vocabulary';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='frequency_score') THEN
        ALTER TABLE public.flashcards ADD COLUMN frequency_score INTEGER DEFAULT 50;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='source_type') THEN
        ALTER TABLE public.flashcards ADD COLUMN source_type TEXT DEFAULT 'user_added';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='source_context') THEN
        ALTER TABLE public.flashcards ADD COLUMN source_context TEXT;
    END IF;
END $$;

-- 3. 修改user_answers表以支持生词保存功能
DO $$
BEGIN
    -- 安全地添加列到user_answers表
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='selected_answer') THEN
        ALTER TABLE public.user_answers ADD COLUMN selected_answer TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='correct_answer') THEN
        ALTER TABLE public.user_answers ADD COLUMN correct_answer TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='time_spent') THEN
        ALTER TABLE public.user_answers ADD COLUMN time_spent INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='question_text') THEN
        ALTER TABLE public.user_answers ADD COLUMN question_text TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='question_type') THEN
        ALTER TABLE public.user_answers ADD COLUMN question_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='difficulty') THEN
        ALTER TABLE public.user_answers ADD COLUMN difficulty TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='options') THEN
        ALTER TABLE public.user_answers ADD COLUMN options TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='explanation') THEN
        ALTER TABLE public.user_answers ADD COLUMN explanation TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='passage_text') THEN
        ALTER TABLE public.user_answers ADD COLUMN passage_text TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='answered_at') THEN
        ALTER TABLE public.user_answers ADD COLUMN answered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
    
    -- 修改session_id列为TEXT类型（如果是UUID类型）
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='session_id' AND data_type != 'text') THEN
        ALTER TABLE public.user_answers ALTER COLUMN session_id TYPE TEXT;
    END IF;
END $$;

-- 4. 启用RLS
ALTER TABLE public.user_flashcard_progress ENABLE ROW LEVEL SECURITY;

-- 5. 创建RLS策略（先删除可能存在的同名策略）
DROP POLICY IF EXISTS "Users can view own flashcard progress" ON public.user_flashcard_progress;
DROP POLICY IF EXISTS "Users can create own flashcard progress" ON public.user_flashcard_progress;
DROP POLICY IF EXISTS "Users can update own flashcard progress" ON public.user_flashcard_progress;

CREATE POLICY "Users can view own flashcard progress" 
ON public.user_flashcard_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own flashcard progress" 
ON public.user_flashcard_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard progress" 
ON public.user_flashcard_progress FOR UPDATE USING (auth.uid() = user_id);

-- 6. 为升级后的flashcards表添加RLS策略
DROP POLICY IF EXISTS "Users can view own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can create own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can update own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can delete own flashcards" ON public.flashcards;

CREATE POLICY "Users can view own flashcards" 
ON public.flashcards FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own flashcards" 
ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards" 
ON public.flashcards FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards" 
ON public.flashcards FOR DELETE USING (auth.uid() = user_id);

-- 7. 创建更新时间触发器（如果函数存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
        DROP TRIGGER IF EXISTS handle_user_flashcard_progress_updated_at ON public.user_flashcard_progress;
        CREATE TRIGGER handle_user_flashcard_progress_updated_at 
        BEFORE UPDATE ON public.user_flashcard_progress
        FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END $$;

-- 8. 创建艾宾浩斯复习算法的辅助函数
CREATE OR REPLACE FUNCTION public.calculate_next_review_date(
  ease_factor DECIMAL(3,2),
  interval_days INTEGER,
  quality INTEGER -- 0-5质量评分，3以上为正确
)
RETURNS TABLE (
  next_interval INTEGER,
  next_ease_factor DECIMAL(3,2),
  next_review_date DATE
) AS $$
DECLARE
  new_interval INTEGER;
  new_ease_factor DECIMAL(3,2);
BEGIN
  -- 艾宾浩斯遗忘曲线算法实现
  new_ease_factor := ease_factor;
  
  IF quality < 3 THEN
    -- 答错了，重新开始间隔
    new_interval := 1;
  ELSE
    -- 答对了，根据艾宾浩斯曲线计算
    IF interval_days = 1 THEN
      new_interval := 6;
    ELSIF interval_days = 6 THEN
      new_interval := 15;
    ELSE
      new_interval := ROUND(interval_days * new_ease_factor);
    END IF;
    
    -- 调整难度系数
    new_ease_factor := new_ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    new_ease_factor := GREATEST(new_ease_factor, 1.30);
  END IF;
  
  RETURN QUERY SELECT 
    new_interval,
    new_ease_factor,
    (CURRENT_DATE + new_interval)::DATE;
END;
$$ LANGUAGE plpgsql;

-- 9. 插入静态flashcard数据到user_flashcard_progress表（为demo用户）
INSERT INTO public.user_flashcard_progress (user_id, flashcard_id, mastery_level, next_review, created_at)
SELECT 
  'demo-user-123'::UUID,
  word_id,
  0, -- 新词状态
  timezone('utc'::text, now()),
  timezone('utc'::text, now())
FROM (
  VALUES 
    ('sophisticated'),
    ('ambiguous'),
    ('meticulous'),
    ('pragmatic'),
    ('eloquent'),
    ('tenacious'),
    ('fastidious'),
    ('perspicacious'),
    ('magnanimous'),
    ('ubiquitous'),
    ('ephemeral'),
    ('sanguine'),
    ('perfunctory'),
    ('cogent'),
    ('intrepid')
) AS static_words(word_id)
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_flashcard_progress 
  WHERE user_id = 'demo-user-123'::UUID AND flashcard_id = static_words.word_id
);

-- 10. 创建视图来简化查询待复习的单词
DROP VIEW IF EXISTS public.flashcards_due_for_review;
CREATE VIEW public.flashcards_due_for_review AS
SELECT 
  ufp.user_id,
  ufp.flashcard_id,
  ufp.mastery_level,
  ufp.times_seen,
  ufp.times_correct,
  ufp.next_review,
  ufp.interval_days,
  ufp.ease_factor,
  ufp.is_mastered
FROM public.user_flashcard_progress ufp
WHERE ufp.next_review <= CURRENT_DATE 
  AND ufp.is_mastered = false;

-- 11. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_user_id ON public.user_flashcard_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_next_review ON public.user_flashcard_progress(next_review);
CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_mastered ON public.user_flashcard_progress(is_mastered);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_source_type ON public.flashcards(source_type);