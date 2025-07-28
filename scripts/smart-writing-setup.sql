-- 智能写作功能数据库设置
-- 分析现有表结构，最大化重用，最小化冲突

-- 检查现有表并提供设置建议
DO $$ 
DECLARE
    table_exists boolean;
    rec record;
BEGIN
    RAISE NOTICE '=== SSAT写作功能数据库设置分析 ===';
    
    -- 检查关键表是否存在
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'knowledge_base'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ knowledge_base 表已存在 - 可以存储写作文章和教材';
    ELSE
        RAISE NOTICE '❌ knowledge_base 表不存在 - 需要创建';
    END IF;
    
    -- 检查 test_questions 表
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'test_questions'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ test_questions 表已存在 - 可以存储写作题目';
    ELSE
        RAISE NOTICE '❌ test_questions 表不存在 - 需要创建';
    END IF;
    
    -- 检查 user_sessions 表
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'test_sessions'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ test_sessions 表已存在 - 可以跟踪写作练习会话';
    ELSE
        RAISE NOTICE '❌ test_sessions 表不存在 - 需要创建';
    END IF;
    
END $$;

-- 方案1: 重用现有表结构 (推荐)
-- 如果上述表都存在，使用以下设置:

-- 为 knowledge_base 添加写作文章支持
ALTER TABLE knowledge_base 
ADD COLUMN IF NOT EXISTS standard_summary TEXT,
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS word_count INTEGER;

-- 为 test_questions 添加写作题目支持 
-- (应该已经有 type 字段支持 'writing')

-- 创建写作专用的辅助表 (仅在必要时)
CREATE TABLE IF NOT EXISTS writing_logic_puzzles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    main_thesis TEXT NOT NULL,
    elements JSONB NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建写作提交记录表 (扩展现有功能)
CREATE TABLE IF NOT EXISTS writing_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES test_sessions(id) ON DELETE SET NULL,
    submission_type VARCHAR(20) NOT NULL CHECK (submission_type IN ('summary', 'logic', 'essay')),
    content TEXT NOT NULL,
    reference_id UUID, -- 可以指向 knowledge_base.id 或 test_questions.id
    ai_scores JSONB,
    ai_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE writing_logic_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_submissions ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Everyone can read logic puzzles" ON writing_logic_puzzles FOR SELECT USING (true);
CREATE POLICY "Users can manage own submissions" ON writing_submissions FOR ALL USING (auth.uid() = user_id);

-- 创建更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_writing_logic_puzzles_updated_at 
    BEFORE UPDATE ON writing_logic_puzzles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_writing_submissions_updated_at 
    BEFORE UPDATE ON writing_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入初始数据

-- 在 knowledge_base 中添加示例写作文章
INSERT INTO knowledge_base (title, content, topic, difficulty, type, tags, standard_summary, keywords)
VALUES 
('The Power of Reading', 
 'Reading is fundamental to academic success and personal growth. Students who read regularly develop stronger vocabulary, better comprehension, and improved critical thinking skills. Research consistently shows that daily reading, even for just 20 minutes, significantly improves standardized test scores. Beyond academics, reading expands perspectives, builds empathy, and provides lifelong learning opportunities.',
 'Education', 'easy', 'concept', 
 ARRAY['reading', 'education', 'academic success'], 
 'Regular reading develops vocabulary, comprehension, and critical thinking skills essential for academic success.',
 ARRAY['reading', 'vocabulary', 'comprehension', 'academic success']
),
('Climate Change Impact', 
 'Global climate change presents unprecedented challenges for our planet. Rising temperatures cause polar ice caps to melt, leading to increased sea levels that threaten coastal communities worldwide. The effects extend beyond environmental concerns to economic impacts, including property damage, agricultural disruption, and forced population migration. Understanding these interconnected effects is crucial for developing effective solutions.',
 'Environment', 'medium', 'concept',
 ARRAY['climate change', 'environment', 'global impact'],
 'Climate change causes rising sea levels and economic disruption, requiring comprehensive understanding for effective solutions.',
 ARRAY['climate change', 'sea level', 'environmental impact', 'economic effects']
);

-- 在 test_questions 中添加写作题目
INSERT INTO test_questions (type, subject, difficulty_level, question_text, question_type, correct_answer, explanation, time_limit_seconds, points)
VALUES 
('vocabulary', 'Writing Prompts', 2, 
 'Some people believe students should have more control over their class schedules, while others think schools should decide. What is your position? Use specific reasons and examples to support your argument.',
 'essay', 
 'This is a persuasive essay prompt. Students should choose a clear position and support it with logical reasoning and specific examples.',
 'This prompt tests persuasive writing skills, requiring students to take a stance and defend it with evidence.',
 1500, 25
),
('vocabulary', 'Writing Prompts', 2,
 'Write about a time when you learned something important from a mistake or failure. Describe what happened, how you responded, and what you learned from the experience.',
 'essay',
 'This is a narrative essay prompt. Students should tell a personal story with clear details and reflect on the learning experience.',
 'This prompt tests narrative writing skills, requiring personal reflection and storytelling ability.',
 1500, 25
);

-- 在 writing_logic_puzzles 中添加逻辑谜题
INSERT INTO writing_logic_puzzles (main_thesis, elements, difficulty)
VALUES 
('Schools should require students to participate in community service',
 '{
   "shuffled": [
     {"id": "1", "text": "Community service develops empathy and social responsibility in students", "order": 2},
     {"id": "2", "text": "These experiences help students understand real-world challenges and their role in society", "order": 3},
     {"id": "3", "text": "Education should prepare students to be engaged, responsible citizens", "order": 1},
     {"id": "4", "text": "Therefore, mandatory community service should be part of every school curriculum", "order": 4}
   ],
   "correct_order": [3, 1, 2, 4]
 }',
 'easy'
),
('Technology enhances classroom learning when used appropriately',
 '{
   "shuffled": [
     {"id": "1", "text": "Digital tools provide interactive learning experiences that engage different learning styles", "order": 2},
     {"id": "2", "text": "Students gain essential digital literacy skills needed for future careers", "order": 3},
     {"id": "3", "text": "Modern education must adapt to prepare students for a technology-driven world", "order": 1},
     {"id": "4", "text": "However, technology must be balanced with traditional teaching methods for optimal results", "order": 5},
     {"id": "5", "text": "Research shows improved learning outcomes when technology is integrated thoughtfully", "order": 4}
   ],
   "correct_order": [3, 1, 2, 4, 5]
 }',
 'medium'
);

RAISE NOTICE '=== 写作功能数据库设置完成 ===';
RAISE NOTICE '✅ 已重用现有表结构最大化兼容性';
RAISE NOTICE '✅ 已创建必要的辅助表';
RAISE NOTICE '✅ 已插入示例数据';
RAISE NOTICE '📝 请检查上述分析结果确定最佳方案';