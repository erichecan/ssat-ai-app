# Supabase Database Setup Guide

## 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Note down your project URL and anon key
3. Copy these to your `.env.local` file

## 2. Database Schema

Run the following SQL commands in your Supabase SQL editor:

```sql
-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET row_security = on;

-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  grade TEXT,
  target_score INTEGER,
  current_level INTEGER DEFAULT 1,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('vocabulary', 'reading', 'math', 'writing')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Create user_sessions table
CREATE TABLE public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('practice', 'test', 'flashcard')),
  questions_attempted INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  total_time INTEGER NOT NULL DEFAULT 0, -- in seconds
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_answers table
CREATE TABLE public.user_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  question_id UUID REFERENCES public.questions(id) NOT NULL,
  session_id UUID REFERENCES public.user_sessions(id),
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken INTEGER NOT NULL DEFAULT 0, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  condition_type TEXT NOT NULL, -- 'questions_correct', 'streak_days', 'score_achieved', etc.
  condition_value INTEGER NOT NULL,
  points_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- Create study_plans table
CREATE TABLE public.study_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  daily_goal INTEGER DEFAULT 10, -- questions per day
  focus_areas TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create flashcards table
CREATE TABLE public.flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  question_id UUID REFERENCES public.questions(id),
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  difficulty_level INTEGER DEFAULT 0, -- 0=new, 1=easy, 2=medium, 3=hard
  next_review_date DATE DEFAULT CURRENT_DATE,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Anyone can read questions
CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT TO authenticated USING (true);

-- Users can view their own sessions and answers
CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON public.user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own answers" ON public.user_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own answers" ON public.user_answers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can view achievements
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT TO authenticated USING (true);

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can earn achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can manage their own study plans
CREATE POLICY "Users can view own study plans" ON public.study_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own study plans" ON public.study_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study plans" ON public.study_plans FOR UPDATE USING (auth.uid() = user_id);

-- Users can manage their own flashcards
CREATE POLICY "Users can view own flashcards" ON public.flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own flashcards" ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcards" ON public.flashcards FOR UPDATE USING (auth.uid() = user_id);

-- Create functions and triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER handle_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_study_plans_updated_at BEFORE UPDATE ON public.study_plans
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_flashcards_updated_at BEFORE UPDATE ON public.flashcards
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 3. Insert Sample Data

```sql
-- Insert sample achievements
INSERT INTO public.achievements (name, description, icon, condition_type, condition_value, points_reward) VALUES
('First Steps', 'Complete your first practice session', '🎯', 'sessions_completed', 1, 100),
('Vocabulary Master', 'Get 50 vocabulary questions correct', '📚', 'vocabulary_correct', 50, 300),
('Speed Demon', 'Answer 10 questions in under 2 minutes', '⚡', 'fast_answers', 10, 200),
('Consistent Learner', 'Study for 7 days in a row', '🔥', 'streak_days', 7, 500),
('High Achiever', 'Score 90% or higher on a practice test', '🏆', 'high_score', 90, 400);

-- Insert sample questions
INSERT INTO public.questions (type, difficulty, question, options, correct_answer, explanation, tags) VALUES
('vocabulary', 'medium', 'What does "ephemeral" mean?', 
 ARRAY['Lasting for a very short time', 'Extremely beautiful', 'Very expensive', 'Difficult to understand'],
 'Lasting for a very short time',
 'Ephemeral means lasting for a very short time. It comes from the Greek word "ephemeros" meaning "lasting only a day".',
 ARRAY['definitions', 'adjectives']),

('vocabulary', 'hard', 'What does "ubiquitous" mean?',
 ARRAY['Appearing nowhere', 'Present everywhere', 'Very rare', 'Extremely old'],
 'Present everywhere',
 'Ubiquitous means present, appearing, or found everywhere. From Latin "ubique" meaning "everywhere".',
 ARRAY['definitions', 'adjectives']),

('math', 'medium', 'If x + 5 = 12, what is the value of x?',
 ARRAY['5', '7', '12', '17'],
 '7',
 'To solve x + 5 = 12, subtract 5 from both sides: x = 12 - 5 = 7',
 ARRAY['algebra', 'equations']);
```

## 4. Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 5. Deploy to Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard
5. Deploy!

Your app will be available at your Netlify URL.