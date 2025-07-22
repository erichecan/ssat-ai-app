-- 完整的SSAT AI学习平台数据库初始化脚本
-- 2024-01-20 23:45:00

-- 用户表 (已存在，但确保有完整结构)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL, 
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_expires_at TIMESTAMP WITH TIME ZONE
);

-- 知识库表 (用于存储上传的文档内容)
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

-- 题目表 (用于存储动态题目)
CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('vocabulary', 'reading', 'math', 'writing')),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topic VARCHAR(100) NOT NULL,
  passage TEXT,
  tags JSONB DEFAULT '[]',
  time_limit INTEGER DEFAULT 120,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 用户答题记录表 (需要添加answered_at列)
CREATE TABLE IF NOT EXISTS user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id VARCHAR(50) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent INTEGER, -- 答题用时(秒)
  session_id UUID, -- 练习会话ID
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 添加缺失的列
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 用户设置表 (新增)
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language VARCHAR(10) DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  auto_play_pronunciation BOOLEAN DEFAULT false,
  preferred_difficulty VARCHAR(10) DEFAULT 'medium' CHECK (preferred_difficulty IN ('easy', 'medium', 'hard')),
  study_reminders_enabled BOOLEAN DEFAULT true,
  daily_goal_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 用户闪卡进度表 (新增)
CREATE TABLE IF NOT EXISTS user_flashcard_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flashcard_id VARCHAR(50) NOT NULL,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  last_reviewed TIMESTAMP WITH TIME ZONE,
  next_review TIMESTAMP WITH TIME ZONE,
  review_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  is_starred BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, flashcard_id)
);

-- 练习会话表 (新增)
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('practice', 'test', 'review', 'flashcard')),
  topic VARCHAR(100),
  difficulty VARCHAR(10) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- 总用时(秒)
  score DECIMAL(5,2), -- 得分百分比
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI对话记录表 (新增)
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_data JSONB NOT NULL DEFAULT '[]',
  topic VARCHAR(200),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 用户成就表 (新增)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL,
  achievement_data JSONB DEFAULT '{}',
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_knowledge_base_topic ON knowledge_base(topic);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_difficulty ON knowledge_base(difficulty);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_source ON knowledge_base(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_created_at ON knowledge_base(created_at);

CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_answered_at ON user_answers(answered_at);
CREATE INDEX IF NOT EXISTS idx_user_answers_session_id ON user_answers(session_id);

CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_user_id ON user_flashcard_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_next_review ON user_flashcard_progress(next_review);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON practice_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_last_message_at ON ai_conversations(last_message_at);

CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);

-- 创建演示用户和数据
INSERT INTO users (id, email, username, first_name, last_name) 
VALUES ('12345678-1234-1234-1234-123456789012', 'demo@ssatmaster.com', 'demo', 'Demo', 'User')
ON CONFLICT (id) DO NOTHING;

-- 为演示用户创建默认设置
INSERT INTO user_settings (user_id) 
VALUES ('12345678-1234-1234-1234-123456789012')
ON CONFLICT (user_id) DO NOTHING;

-- 添加修改列的语句（如果列已存在则跳过）
DO $$ 
BEGIN 
    -- 添加answered_at列到user_answers表
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_answers' AND column_name = 'answered_at') THEN
        ALTER TABLE user_answers ADD COLUMN answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- 其他可能需要的列修改...
    
END $$; 