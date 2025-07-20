# MVP Database Schema Extension

This document outlines the database schema extensions needed for the MVP features.

## New Tables

### 1. Mistake Questions (错题本)
```sql
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
```

### 2. AI Conversations
```sql
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
```

### 3. Knowledge Base (for RAG)
```sql
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
```

## Table Extensions

### 1. Extend user_sessions table
```sql
-- Add AI interaction tracking
ALTER TABLE public.user_sessions 
ADD COLUMN ai_interactions_count INTEGER DEFAULT 0,
ADD COLUMN avg_response_time DECIMAL(10,2) DEFAULT 0,
ADD COLUMN mistakes_reviewed INTEGER DEFAULT 0;
```

### 2. Extend user_answers table
```sql
-- Add more detailed tracking
ALTER TABLE public.user_answers 
ADD COLUMN confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
ADD COLUMN used_ai_help BOOLEAN DEFAULT FALSE,
ADD COLUMN review_count INTEGER DEFAULT 0;
```

### 3. Extend users table
```sql
-- Add learning preferences and stats
ALTER TABLE public.users 
ADD COLUMN learning_preferences JSONB DEFAULT '{}',
ADD COLUMN total_mistakes INTEGER DEFAULT 0,
ADD COLUMN mastered_mistakes INTEGER DEFAULT 0,
ADD COLUMN ai_interactions_count INTEGER DEFAULT 0;
```

## Functions and Triggers

### 1. Update trigger for mistake_questions
```sql
CREATE TRIGGER handle_mistake_questions_updated_at 
  BEFORE UPDATE ON public.mistake_questions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
```

### 2. Function to calculate next review time
```sql
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
```

### 3. Trigger to update next review time
```sql
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
```

## Initial Data

### Sample Knowledge Base Content
```sql
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
```

## Views for Analytics

### 1. User Learning Summary
```sql
CREATE VIEW user_learning_summary AS
SELECT 
  u.id as user_id,
  u.username,
  u.current_level,
  u.total_points,
  COUNT(DISTINCT us.id) as total_sessions,
  COUNT(DISTINCT mq.id) as total_mistakes,
  COUNT(DISTINCT CASE WHEN mq.mastery_level = 3 THEN mq.id END) as mastered_mistakes,
  COUNT(DISTINCT ac.id) as ai_conversations,
  AVG(us.score) as avg_score
FROM public.users u
LEFT JOIN public.user_sessions us ON u.id = us.user_id
LEFT JOIN public.mistake_questions mq ON u.id = mq.user_id
LEFT JOIN public.ai_conversations ac ON u.id = ac.user_id
GROUP BY u.id, u.username, u.current_level, u.total_points;
```

### 2. Daily Learning Analytics
```sql
CREATE VIEW daily_learning_analytics AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as total_sessions,
  AVG(score) as avg_score,
  SUM(questions_attempted) as total_questions_attempted,
  SUM(questions_correct) as total_questions_correct
FROM public.user_sessions
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Indexes for Performance

```sql
-- Indexes for mistake_questions
CREATE INDEX idx_mistake_questions_user_id ON public.mistake_questions(user_id);
CREATE INDEX idx_mistake_questions_next_review ON public.mistake_questions(next_review_at);
CREATE INDEX idx_mistake_questions_mastery_level ON public.mistake_questions(mastery_level);

-- Indexes for ai_conversations
CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_created_at ON public.ai_conversations(created_at);
CREATE INDEX idx_ai_conversations_question_id ON public.ai_conversations(question_id);
```

## Notes

1. **Data Privacy**: All tables implement Row Level Security (RLS) to ensure users can only access their own data.

2. **Scalability**: The schema is designed to handle growing data volumes with proper indexing.

3. **Analytics**: Views are created for common analytical queries to improve performance.

4. **Flexibility**: JSONB columns allow for future feature extensions without schema changes.

5. **Vector Integration**: The knowledge_base table includes a vector_id field to link with Pinecone vectors.