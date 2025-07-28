-- 写作练习功能数据库表创建脚本
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 创建文章表 (用于核心概括训练)
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  topic_category VARCHAR(100) NOT NULL,
  standard_summary TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. 创建逻辑谜题表 (用于逻辑链条构建)
CREATE TABLE IF NOT EXISTS logic_puzzles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  main_thesis TEXT NOT NULL,
  elements JSONB NOT NULL,
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. 创建模拟考试提示表 (用于全真模拟写作)
CREATE TABLE IF NOT EXISTS mock_test_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_text TEXT NOT NULL,
  prompt_type VARCHAR(20) NOT NULL CHECK (prompt_type IN ('Persuasive', 'Narrative')),
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. 创建用户提交表 (存储所有练习和作文)
CREATE TABLE IF NOT EXISTS user_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  submission_type VARCHAR(20) NOT NULL CHECK (submission_type IN ('summary', 'logic', 'essay')),
  content TEXT NOT NULL,
  score JSONB,
  feedback TEXT,
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  puzzle_id UUID REFERENCES logic_puzzles(id) ON DELETE SET NULL,
  prompt_id UUID REFERENCES mock_test_prompts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 检查现有表是否存在，如果不存在则不执行某些操作
DO $$ 
BEGIN
    -- 如果user_profiles表存在，为其添加写作相关字段
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        -- 添加写作练习统计字段到现有user_profiles表
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS writing_submissions_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS writing_average_score NUMERIC DEFAULT 0.0,
        ADD COLUMN IF NOT EXISTS last_writing_practice TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 5. 启用行级安全策略 (RLS)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE logic_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_test_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_submissions ENABLE ROW LEVEL SECURITY;

-- 6. 创建 RLS 策略

-- 文章表策略 (所有人都可以读取，只有管理员可以写入)
CREATE POLICY "Everyone can read articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Only admins can insert articles" ON articles FOR INSERT WITH CHECK (false);
CREATE POLICY "Only admins can update articles" ON articles FOR UPDATE USING (false);
CREATE POLICY "Only admins can delete articles" ON articles FOR DELETE USING (false);

-- 逻辑谜题表策略
CREATE POLICY "Everyone can read logic_puzzles" ON logic_puzzles FOR SELECT USING (true);
CREATE POLICY "Only admins can insert logic_puzzles" ON logic_puzzles FOR INSERT WITH CHECK (false);
CREATE POLICY "Only admins can update logic_puzzles" ON logic_puzzles FOR UPDATE USING (false);
CREATE POLICY "Only admins can delete logic_puzzles" ON logic_puzzles FOR DELETE USING (false);

-- 模拟考试提示表策略
CREATE POLICY "Everyone can read mock_test_prompts" ON mock_test_prompts FOR SELECT USING (true);
CREATE POLICY "Only admins can insert mock_test_prompts" ON mock_test_prompts FOR INSERT WITH CHECK (false);
CREATE POLICY "Only admins can update mock_test_prompts" ON mock_test_prompts FOR UPDATE USING (false);
CREATE POLICY "Only admins can delete mock_test_prompts" ON mock_test_prompts FOR DELETE USING (false);

-- 用户提交表策略 (用户只能访问自己的数据)
CREATE POLICY "Users can read own submissions" ON user_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own submissions" ON user_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own submissions" ON user_submissions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own submissions" ON user_submissions FOR DELETE USING (auth.uid() = user_id);

-- 7. 创建触发器函数来自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. 为每个表创建触发器
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logic_puzzles_updated_at BEFORE UPDATE ON logic_puzzles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mock_test_prompts_updated_at BEFORE UPDATE ON mock_test_prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_submissions_updated_at BEFORE UPDATE ON user_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. 插入示例数据

-- 示例文章
INSERT INTO articles (title, content, topic_category, standard_summary, keywords, difficulty) VALUES
('The Benefits of Reading', 
'Reading is one of the most fundamental skills for academic success. When students read regularly, they develop stronger vocabulary, better comprehension abilities, and improved writing skills. Research shows that students who read for just 20 minutes daily score significantly higher on standardized tests. Reading also enhances critical thinking skills by exposing students to different perspectives and complex ideas. Furthermore, reading fiction helps develop empathy and emotional intelligence, while non-fiction builds knowledge across various subjects. The habit of reading should be cultivated early and maintained throughout life, as it serves as a foundation for lifelong learning and intellectual growth.',
'Education',
'Regular reading develops vocabulary, comprehension, and critical thinking skills, leading to better academic performance and lifelong learning.',
ARRAY['reading', 'vocabulary', 'comprehension', 'academic success'],
'easy'),

('Climate Change and Ocean Levels',
'Global climate change has led to significant rises in ocean levels worldwide. As greenhouse gases trap more heat in Earth''s atmosphere, polar ice caps and glaciers melt at accelerating rates. Scientists estimate that sea levels have risen approximately 8-9 inches since 1880, with the rate of increase doubling in recent decades. This rise threatens coastal communities, damages marine ecosystems, and affects weather patterns globally. Small island nations face complete submersion, while major coastal cities must invest billions in protective infrastructure. The economic impact includes property damage, agricultural losses, and forced migration of populations. Immediate action to reduce carbon emissions is crucial to slow this trend and protect vulnerable communities from devastating consequences.',
'Environment',
'Climate change causes ocean levels to rise through melting ice, threatening coastal areas and requiring urgent carbon emission reductions.',
ARRAY['climate change', 'sea level rise', 'greenhouse gases', 'coastal threats'],
'medium');

-- 示例逻辑谜题
INSERT INTO logic_puzzles (main_thesis, elements, difficulty) VALUES
('Schools should require students to wear uniforms',
'{
  "shuffled": [
    {"id": "1", "text": "School uniforms reduce distractions in the learning environment", "order": 2},
    {"id": "2", "text": "Students spend less time choosing outfits and more time focusing on studies", "order": 3},
    {"id": "3", "text": "Education should prioritize academic achievement over fashion choices", "order": 1},
    {"id": "4", "text": "Therefore, mandatory school uniforms benefit student learning", "order": 4}
  ],
  "correct_order": [3, 1, 2, 4]
}',
'easy'),

('Social media has negative effects on teenagers',
'{
  "shuffled": [
    {"id": "1", "text": "Studies show increased anxiety and depression among heavy social media users", "order": 2},
    {"id": "2", "text": "This creates unrealistic expectations and feelings of inadequacy", "order": 3},
    {"id": "3", "text": "Social media platforms promote constant comparison with others", "order": 1},
    {"id": "4", "text": "Limited social media use should be encouraged for teen mental health", "order": 5},
    {"id": "5", "text": "Sleep disruption from late-night scrolling affects academic performance", "order": 4}
  ],
  "correct_order": [3, 1, 2, 5, 4]
}',
'medium');

-- 示例模拟考试提示
INSERT INTO mock_test_prompts (prompt_text, prompt_type, difficulty) VALUES
('Some people believe that students should be required to take a foreign language class, while others think it should be optional. In your opinion, should foreign language classes be mandatory or optional in schools? Use specific reasons and examples to support your position.',
'Persuasive',
'medium'),

('Write about a time when you had to overcome a challenge or obstacle. Describe the situation, what you did to overcome it, and what you learned from the experience.',
'Narrative',
'easy'),

('Many schools are considering implementing later start times to help students get more sleep. Do you think schools should start later in the day? Support your opinion with specific reasons and examples.',
'Persuasive',
'medium');

-- 完成提示
SELECT 'Writing database setup completed successfully!' as message;