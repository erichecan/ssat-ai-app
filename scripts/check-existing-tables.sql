-- 检查现有数据库表结构，避免冲突
-- 在 Supabase SQL Editor 中运行此脚本来检查现状

-- 检查是否已存在写作相关表
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('articles', 'logic_puzzles', 'mock_test_prompts', 'user_submissions')
ORDER BY table_name;

-- 检查 knowledge_base 表结构 (可能可以重用)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'knowledge_base'
ORDER BY ordinal_position;

-- 检查现有的 questions 表结构 (可能可以扩展用于写作)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'questions'
ORDER BY ordinal_position;

-- 检查 test_questions 表结构 (更适合写作题目)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'test_questions'
ORDER BY ordinal_position;

-- 检查所有现有表名
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;