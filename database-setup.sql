-- SSAT AI App Database Setup
-- 请在 Supabase SQL Editor 中执行这些命令

-- 1. 创建用户答案表
CREATE TABLE IF NOT EXISTS public.user_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    question_id VARCHAR(255) NOT NULL,
    question_type VARCHAR(50),
    user_answer TEXT,
    correct_answer TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    time_spent INTEGER DEFAULT 0,
    difficulty VARCHAR(20),
    session_id VARCHAR(255),
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建练习会话表
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_type VARCHAR(50) NOT NULL,
    settings JSONB,
    questions TEXT[],
    status VARCHAR(20) DEFAULT 'active',
    current_question_index INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建用户设置表
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    reminder_enabled BOOLEAN DEFAULT FALSE,
    reminder_time VARCHAR(10) DEFAULT '18:00',
    reminder_frequency VARCHAR(20) DEFAULT 'daily',
    reminder_days TEXT[],
    difficulty_level VARCHAR(20) DEFAULT 'adaptive',
    study_goal_minutes INTEGER DEFAULT 30,
    preferred_subjects TEXT[] DEFAULT ARRAY['vocabulary', 'reading'],
    time_limit_enabled BOOLEAN DEFAULT TRUE,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    font_size VARCHAR(20) DEFAULT 'medium',
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    practice_reminders BOOLEAN DEFAULT TRUE,
    achievement_notifications BOOLEAN DEFAULT TRUE,
    data_sharing BOOLEAN DEFAULT FALSE,
    analytics_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建单词卡进度表
CREATE TABLE IF NOT EXISTS public.user_flashcard_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    flashcard_id VARCHAR(255) NOT NULL,
    mastery_level DECIMAL(3,2) DEFAULT 0.0,
    times_seen INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_review TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    difficulty_rating INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, flashcard_id)
);

-- 5. 创建AI对话表
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON public.user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_session_id ON public.user_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_user_id ON public.user_flashcard_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);

-- 启用行级安全策略 (RLS)
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 创建基本的RLS策略（允许所有操作，实际项目中应该更严格）
CREATE POLICY "Allow all operations for authenticated users" ON public.user_answers FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.practice_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.user_settings FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.user_flashcard_progress FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.conversations FOR ALL USING (true);