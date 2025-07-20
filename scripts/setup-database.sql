-- SSAT AI App Database Setup Script
-- Run this script in your Supabase SQL Editor

-- Create knowledge_base table
CREATE TABLE public.knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  topic TEXT NOT NULL, -- vocabulary, reading, math, writing
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  type TEXT NOT NULL CHECK (type IN ('concept', 'strategy', 'example', 'common_mistake')),
  tags TEXT[] DEFAULT '{}',
  source TEXT, -- Where this knowledge came from
  vector_id TEXT, -- Pinecone vector ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_knowledge_base_topic ON public.knowledge_base(topic);
CREATE INDEX idx_knowledge_base_difficulty ON public.knowledge_base(difficulty);
CREATE INDEX idx_knowledge_base_type ON public.knowledge_base(type);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (knowledge base is readable by all authenticated users)
CREATE POLICY "Anyone can view knowledge base" ON public.knowledge_base 
  FOR SELECT TO authenticated USING (true);

-- Create mistake_questions table
CREATE TABLE public.mistake_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  question_id UUID REFERENCES public.questions(id) NOT NULL,
  mistake_count INTEGER DEFAULT 1,
  last_mistake_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  next_review_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '1 day'),
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 3), -- 0=new, 1=learning, 2=review, 3=mastered
  tags TEXT[] DEFAULT '{}',
  user_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, question_id)
);

-- Enable RLS
ALTER TABLE public.mistake_questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own mistakes" ON public.mistake_questions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mistakes" ON public.mistake_questions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mistakes" ON public.mistake_questions 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mistakes" ON public.mistake_questions 
  FOR DELETE USING (auth.uid() = user_id);

-- Create ai_conversations table
CREATE TABLE public.ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  question_id UUID REFERENCES public.questions(id),
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  context_data JSONB, -- Store retrieved context and metadata
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- User feedback
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own conversations" ON public.ai_conversations 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.ai_conversations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.ai_conversations 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for mistake_questions updated_at
CREATE TRIGGER handle_mistake_questions_updated_at 
  BEFORE UPDATE ON public.mistake_questions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create trigger for knowledge_base updated_at
CREATE TRIGGER handle_knowledge_base_updated_at 
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to calculate next review time
CREATE OR REPLACE FUNCTION calculate_next_review_time(
  mastery_level INTEGER,
  mistake_count INTEGER
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  CASE mastery_level
    WHEN 0 THEN -- New mistake
      RETURN timezone('utc'::text, now() + interval '1 day');
    WHEN 1 THEN -- Learning
      RETURN timezone('utc'::text, now() + interval '3 days');
    WHEN 2 THEN -- Review
      RETURN timezone('utc'::text, now() + interval '7 days');
    WHEN 3 THEN -- Mastered
      RETURN timezone('utc'::text, now() + interval '30 days');
    ELSE
      RETURN timezone('utc'::text, now() + interval '1 day');
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update next review time
CREATE OR REPLACE FUNCTION update_next_review_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.next_review_at = calculate_next_review_time(NEW.mastery_level, NEW.mistake_count);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mistake_review_time 
  BEFORE INSERT OR UPDATE ON public.mistake_questions
  FOR EACH ROW EXECUTE PROCEDURE update_next_review_time();

-- Indexes for mistake_questions
CREATE INDEX idx_mistake_questions_user_id ON public.mistake_questions(user_id);
CREATE INDEX idx_mistake_questions_next_review ON public.mistake_questions(next_review_at);
CREATE INDEX idx_mistake_questions_mastery_level ON public.mistake_questions(mastery_level);

-- Indexes for ai_conversations
CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_created_at ON public.ai_conversations(created_at);
CREATE INDEX idx_ai_conversations_question_id ON public.ai_conversations(question_id);

-- Insert sample knowledge base entries
INSERT INTO public.knowledge_base (title, content, topic, difficulty, type, tags, source) VALUES
('Vocabulary: Context Clues', 
 'When you encounter an unfamiliar word, look for context clues in the surrounding sentences. These clues can help you determine the meaning without knowing the exact definition.',
 'vocabulary', 'easy', 'strategy', 
 ARRAY['context-clues', 'vocabulary-strategy'],
 'SSAT Official Guide'
),
('Reading: Main Idea Questions',
 'Main idea questions ask you to identify the central theme or purpose of a passage. Look for thesis statements, topic sentences, and recurring themes throughout the text.',
 'reading', 'medium', 'strategy',
 ARRAY['main-idea', 'reading-strategy'],
 'SAT Practice Test'
),
('Math: Linear Equations',
 'A linear equation is an equation that makes a straight line when graphed. It can be written in the form y = mx + b, where m is the slope and b is the y-intercept.',
 'math', 'medium', 'concept',
 ARRAY['linear-equations', 'algebra'],
 'Khan Academy'
);