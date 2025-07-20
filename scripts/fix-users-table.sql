-- Fix missing users table issue
-- This script creates the missing public.users table and fixes foreign key references

-- 1. Create the missing public.users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  location TEXT,
  grade TEXT,
  target_score INTEGER,
  current_level INTEGER DEFAULT 1,
  total_points INTEGER DEFAULT 0,
  practice_time TEXT DEFAULT '0h',
  reading_speed TEXT DEFAULT 'N/A',
  questions_answered INTEGER DEFAULT 0,
  overall_score INTEGER DEFAULT 0,
  accuracy_rate TEXT DEFAULT '0%',
  study_streak INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'N/A',
  learning_preferences JSONB DEFAULT '{}',
  total_mistakes INTEGER DEFAULT 0,
  mastered_mistakes INTEGER DEFAULT 0,
  ai_interactions_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create update trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 3. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (true);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (true);

-- 5. Grant necessary permissions
GRANT ALL ON public.users TO anon, authenticated;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_username_idx ON public.users(username);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users(created_at);