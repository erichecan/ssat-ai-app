-- 修改knowledge_base表，使uploaded_by字段可以为NULL或设置默认值
-- 2025-07-22

-- 方案1：将uploaded_by改为可NULL
ALTER TABLE knowledge_base 
ALTER COLUMN uploaded_by DROP NOT NULL;

-- 或者方案2：创建一个默认用户并设为默认值
-- 首先创建一个系统用户
-- INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000000', 'system@example.com');
-- INSERT INTO users (id, email, username, full_name) VALUES ('00000000-0000-0000-0000-000000000000', 'system@example.com', 'system', 'System User');

-- 然后设置默认值
-- ALTER TABLE knowledge_base 
-- ALTER COLUMN uploaded_by SET DEFAULT '00000000-0000-0000-0000-000000000000';