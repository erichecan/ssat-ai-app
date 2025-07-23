-- Update flashcards table to support comprehensive vocabulary functionality
-- Run this in Supabase SQL editor

-- Add missing columns to flashcards table
ALTER TABLE public.flashcards 
ADD COLUMN IF NOT EXISTS card_type TEXT DEFAULT 'vocabulary',
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
ADD COLUMN IF NOT EXISTS context TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_reviewed TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS success_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pronunciation TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS part_of_speech TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS example_sentence TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS synonyms TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS antonyms TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS etymology TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS memory_tip TEXT DEFAULT '';

-- Create user_flashcard_progress table for spaced repetition
CREATE TABLE IF NOT EXISTS public.user_flashcard_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  flashcard_id UUID REFERENCES public.flashcards(id) NOT NULL,
  mastery_level INTEGER DEFAULT 0, -- 0-5 scale for spaced repetition
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  last_seen TIMESTAMP WITH TIME ZONE,
  next_review_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  difficulty_rating INTEGER DEFAULT 3, -- User's personal difficulty rating 1-5
  interval_days INTEGER DEFAULT 1, -- Current interval in days for spaced repetition
  ease_factor DECIMAL(3,2) DEFAULT 2.5, -- Ease factor for SM2 algorithm
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, flashcard_id)
);

-- Enable RLS on the new table
ALTER TABLE public.user_flashcard_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user_flashcard_progress
CREATE POLICY "Users can view own flashcard progress" ON public.user_flashcard_progress 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own flashcard progress" ON public.user_flashcard_progress 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard progress" ON public.user_flashcard_progress 
FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER handle_user_flashcard_progress_updated_at 
BEFORE UPDATE ON public.user_flashcard_progress
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Insert some initial vocabulary words from the static bank
INSERT INTO public.flashcards (
  user_id, front_text, back_text, card_type, difficulty, 
  pronunciation, part_of_speech, example_sentence, synonyms, antonyms, 
  etymology, memory_tip, next_review_date, review_count, success_count
) VALUES 
-- Use a default user_id - in production this would be dynamic
('00000000-0000-0000-0000-000000000000', 'aberrant', 'Departing from an accepted standard; deviating from the normal type', 'vocabulary', 'hard', '/ˈæbərənt/', 'adjective', 'The scientist noted the aberrant behavior of the test subjects.', '["abnormal", "deviant", "irregular", "atypical"]', '["normal", "typical", "standard", "conventional"]', 'From Latin aberrare, meaning "to go astray"', 'The student''s aberrant behavior during the exam surprised everyone.', timezone('utc'::text, now()), 0, 0),

('00000000-0000-0000-0000-000000000000', 'benevolent', 'Well meaning and kindly; showing compassion or goodwill', 'vocabulary', 'medium', '/bəˈnevələnt/', 'adjective', 'The benevolent king was loved by all his subjects.', '["kind", "charitable", "generous", "compassionate"]', '["malevolent", "cruel", "mean", "harsh"]', 'From Latin bene (well) + volens (wishing)', 'The benevolent teacher always helped struggling students after class.', timezone('utc'::text, now()), 0, 0),

('00000000-0000-0000-0000-000000000000', 'candid', 'Truthful and straightforward; frank and honest', 'vocabulary', 'medium', '/ˈkændɪd/', 'adjective', 'She gave a candid assessment of the project''s chances.', '["honest", "frank", "direct", "straightforward"]', '["dishonest", "evasive", "deceptive", "indirect"]', 'From Latin candidus meaning "white, pure"', 'I appreciate your candid opinion about my presentation.', timezone('utc'::text, now()), 0, 0),

('00000000-0000-0000-0000-000000000000', 'desolate', 'Feeling or showing great unhappiness; empty and lifeless', 'vocabulary', 'medium', '/ˈdesələt/', 'adjective', 'The abandoned house stood desolate on the hill.', '["barren", "bleak", "forsaken", "deserted"]', '["populated", "lively", "inhabited", "cheerful"]', 'From Latin desolatus meaning "abandoned"', 'The desolate landscape stretched endlessly without any signs of life.', timezone('utc'::text, now()), 0, 0),

('00000000-0000-0000-0000-000000000000', 'elaborate', 'Involving many carefully arranged parts; detailed and complicated', 'vocabulary', 'easy', '/ɪˈlæbərət/', 'adjective', 'The wedding had an elaborate reception with multiple courses.', '["detailed", "complex", "intricate", "ornate"]', '["simple", "plain", "basic", "modest"]', 'From Latin elaboratus meaning "worked out"', 'The architect created an elaborate design with intricate details.', timezone('utc'::text, now()), 0, 0)

ON CONFLICT (user_id, front_text) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flashcards_user_card_type ON public.flashcards(user_id, card_type);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON public.flashcards(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_review ON public.user_flashcard_progress(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_user_flashcard ON public.user_flashcard_progress(user_id, flashcard_id);