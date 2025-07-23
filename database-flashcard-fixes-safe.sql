-- 修复Flashcard数据库表结构 (安全版本)
-- 首先创建必需的表和列，然后再添加约束和策略

-- 1. 创建user_flashcard_progress表 (解决API中引用的缺失表)
CREATE TABLE IF NOT EXISTS public.user_flashcard_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- 暂时不添加外键约束，稍后处理
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

-- 2. 安全地升级flashcards表
DO $$ 
BEGIN
    RAISE NOTICE 'Starting flashcards table upgrade...';
    
    -- 首先检查flashcards表是否存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flashcards') THEN
        RAISE NOTICE 'flashcards table does not exist, creating it...';
        CREATE TABLE public.flashcards (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL,
            front_text TEXT NOT NULL,
            back_text TEXT NOT NULL,
            difficulty_level INTEGER DEFAULT 0,
            next_review_date DATE DEFAULT CURRENT_DATE,
            review_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;
    
    -- 安全地添加user_id列（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='user_id') THEN
        ALTER TABLE public.flashcards ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column to flashcards table';
    END IF;
    
    -- 安全地添加其他列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='word') THEN
        ALTER TABLE public.flashcards ADD COLUMN word TEXT;
        RAISE NOTICE 'Added word column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='definition') THEN
        ALTER TABLE public.flashcards ADD COLUMN definition TEXT;
        RAISE NOTICE 'Added definition column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='pronunciation') THEN
        ALTER TABLE public.flashcards ADD COLUMN pronunciation TEXT;
        RAISE NOTICE 'Added pronunciation column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='part_of_speech') THEN
        ALTER TABLE public.flashcards ADD COLUMN part_of_speech TEXT;
        RAISE NOTICE 'Added part_of_speech column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='example_sentence') THEN
        ALTER TABLE public.flashcards ADD COLUMN example_sentence TEXT;
        RAISE NOTICE 'Added example_sentence column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='memory_tip') THEN
        ALTER TABLE public.flashcards ADD COLUMN memory_tip TEXT;
        RAISE NOTICE 'Added memory_tip column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='synonyms') THEN
        ALTER TABLE public.flashcards ADD COLUMN synonyms TEXT[];
        RAISE NOTICE 'Added synonyms column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='antonyms') THEN
        ALTER TABLE public.flashcards ADD COLUMN antonyms TEXT[];
        RAISE NOTICE 'Added antonyms column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='etymology') THEN
        ALTER TABLE public.flashcards ADD COLUMN etymology TEXT;
        RAISE NOTICE 'Added etymology column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='category') THEN
        ALTER TABLE public.flashcards ADD COLUMN category TEXT DEFAULT 'vocabulary';
        RAISE NOTICE 'Added category column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='frequency_score') THEN
        ALTER TABLE public.flashcards ADD COLUMN frequency_score INTEGER DEFAULT 50;
        RAISE NOTICE 'Added frequency_score column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='source_type') THEN
        ALTER TABLE public.flashcards ADD COLUMN source_type TEXT DEFAULT 'user_added';
        RAISE NOTICE 'Added source_type column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='source_context') THEN
        ALTER TABLE public.flashcards ADD COLUMN source_context TEXT;
        RAISE NOTICE 'Added source_context column';
    END IF;
    
    RAISE NOTICE 'Flashcards table upgrade completed';
END $$;

-- 3. 安全地升级user_answers表
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    RAISE NOTICE 'Starting user_answers table upgrade...';
    
    -- 检查user_answers表是否存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_answers') THEN
        RAISE NOTICE 'user_answers table does not exist, creating basic structure...';
        CREATE TABLE public.user_answers (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL,
            question_id UUID,
            user_answer TEXT NOT NULL,
            is_correct BOOLEAN NOT NULL,
            time_taken INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
    END IF;
    
    -- 安全地添加列
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='selected_answer') THEN
        ALTER TABLE public.user_answers ADD COLUMN selected_answer TEXT;
        RAISE NOTICE 'Added selected_answer column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='correct_answer') THEN
        ALTER TABLE public.user_answers ADD COLUMN correct_answer TEXT;
        RAISE NOTICE 'Added correct_answer column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='time_spent') THEN
        ALTER TABLE public.user_answers ADD COLUMN time_spent INTEGER DEFAULT 0;
        RAISE NOTICE 'Added time_spent column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='question_text') THEN
        ALTER TABLE public.user_answers ADD COLUMN question_text TEXT;
        RAISE NOTICE 'Added question_text column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='question_type') THEN
        ALTER TABLE public.user_answers ADD COLUMN question_type TEXT;
        RAISE NOTICE 'Added question_type column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='difficulty') THEN
        ALTER TABLE public.user_answers ADD COLUMN difficulty TEXT;
        RAISE NOTICE 'Added difficulty column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='options') THEN
        ALTER TABLE public.user_answers ADD COLUMN options TEXT;
        RAISE NOTICE 'Added options column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='explanation') THEN
        ALTER TABLE public.user_answers ADD COLUMN explanation TEXT;
        RAISE NOTICE 'Added explanation column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='passage_text') THEN
        ALTER TABLE public.user_answers ADD COLUMN passage_text TEXT;
        RAISE NOTICE 'Added passage_text column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='answered_at') THEN
        ALTER TABLE public.user_answers ADD COLUMN answered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
        RAISE NOTICE 'Added answered_at column';
    END IF;
    
    -- 添加session_id_text列（避免外键冲突）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_answers' AND column_name='session_id_text') THEN
        ALTER TABLE public.user_answers ADD COLUMN session_id_text TEXT;
        RAISE NOTICE 'Added session_id_text column';
    END IF;
    
    RAISE NOTICE 'user_answers table upgrade completed';
END $$;

-- 4. 启用RLS
ALTER TABLE public.user_flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- 5. 创建RLS策略（安全方式）
DO $$
BEGIN
    -- user_flashcard_progress策略
    DROP POLICY IF EXISTS "Users can view own flashcard progress" ON public.user_flashcard_progress;
    DROP POLICY IF EXISTS "Users can create own flashcard progress" ON public.user_flashcard_progress;
    DROP POLICY IF EXISTS "Users can update own flashcard progress" ON public.user_flashcard_progress;
    
    CREATE POLICY "Users can view own flashcard progress" 
    ON public.user_flashcard_progress FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can create own flashcard progress" 
    ON public.user_flashcard_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own flashcard progress" 
    ON public.user_flashcard_progress FOR UPDATE USING (auth.uid() = user_id);
    
    -- flashcards策略
    DROP POLICY IF EXISTS "Users can view own flashcards" ON public.flashcards;
    DROP POLICY IF EXISTS "Users can create own flashcards" ON public.flashcards;
    DROP POLICY IF EXISTS "Users can update own flashcards" ON public.flashcards;
    DROP POLICY IF EXISTS "Users can delete own flashcards" ON public.flashcards;
    
    -- 只有在user_id列存在时才创建策略
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='user_id') THEN
        CREATE POLICY "Users can view own flashcards" 
        ON public.flashcards FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can create own flashcards" 
        ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own flashcards" 
        ON public.flashcards FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete own flashcards" 
        ON public.flashcards FOR DELETE USING (auth.uid() = user_id);
        
        RAISE NOTICE 'Created RLS policies for flashcards table';
    ELSE
        RAISE NOTICE 'Skipped flashcards RLS policies - user_id column not found';
    END IF;
    
END $$;

-- 6. 创建艾宾浩斯复习算法的辅助函数
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

-- 7. 创建视图来简化查询待复习的单词
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

-- 8. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_user_id ON public.user_flashcard_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_next_review ON public.user_flashcard_progress(next_review);
CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_mastered ON public.user_flashcard_progress(is_mastered);

-- 只有在user_id列存在时才创建flashcards索引
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id);
        RAISE NOTICE 'Created flashcards user_id index';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='source_type') THEN
        CREATE INDEX IF NOT EXISTS idx_flashcards_source_type ON public.flashcards(source_type);
        RAISE NOTICE 'Created flashcards source_type index';
    END IF;
END $$;

-- 9. 插入测试数据（使用更安全的方式）
DO $$
BEGIN
    -- 为测试创建一些基础的flashcard progress记录（不依赖auth.users）
    INSERT INTO public.user_flashcard_progress (user_id, flashcard_id, mastery_level, next_review, created_at)
    SELECT 
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::UUID, -- 测试用户ID
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
        ('eloquent')
    ) AS static_words(word_id)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_flashcard_progress 
      WHERE user_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::UUID 
        AND flashcard_id = static_words.word_id
    );
    
    RAISE NOTICE 'Inserted test flashcard progress data';
    
END $$;

-- 完成提示
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'SAFE Flashcard database upgrade completed!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Tables processed:';
    RAISE NOTICE '  ✓ user_flashcard_progress (created)';
    RAISE NOTICE '  ✓ flashcards (enhanced safely)';
    RAISE NOTICE '  ✓ user_answers (enhanced safely)';
    RAISE NOTICE 'Features added:';
    RAISE NOTICE '  ✓ Ebbinghaus algorithm function';
    RAISE NOTICE '  ✓ RLS security policies';
    RAISE NOTICE '  ✓ Performance indexes';
    RAISE NOTICE '  ✓ Due review view';
    RAISE NOTICE '  ✓ Test data inserted';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Ready for flashcard system to work!';
    RAISE NOTICE '===========================================';
END $$;