-- Update existing flashcards table to support comprehensive vocabulary functionality
-- This works with the existing table structure that uses 'word' and 'definition' fields

-- Add missing columns to existing flashcards table (only if they don't exist)
DO $$ 
BEGIN
    -- Add card_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flashcards' AND column_name = 'card_type') THEN
        ALTER TABLE public.flashcards ADD COLUMN card_type TEXT DEFAULT 'vocabulary';
    END IF;

    -- Add difficulty column if it doesn't exist (different from difficulty_level)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flashcards' AND column_name = 'difficulty') THEN
        ALTER TABLE public.flashcards ADD COLUMN difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard'));
    END IF;

    -- Add context column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flashcards' AND column_name = 'context') THEN
        ALTER TABLE public.flashcards ADD COLUMN context TEXT DEFAULT '';
    END IF;

    -- Add last_reviewed column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flashcards' AND column_name = 'last_reviewed') THEN
        ALTER TABLE public.flashcards ADD COLUMN last_reviewed TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add success_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flashcards' AND column_name = 'success_count') THEN
        ALTER TABLE public.flashcards ADD COLUMN success_count INTEGER DEFAULT 0;
    END IF;

    -- Add next_review_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flashcards' AND column_name = 'next_review_date') THEN
        ALTER TABLE public.flashcards ADD COLUMN next_review_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;

    -- Add review_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flashcards' AND column_name = 'review_count') THEN
        ALTER TABLE public.flashcards ADD COLUMN review_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create user_flashcard_progress table for spaced repetition (if it doesn't exist)
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
  is_mastered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, flashcard_id)
);

-- Enable RLS on the new table (only if it doesn't exist)
DO $$ 
BEGIN
    -- Check if RLS is already enabled
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'user_flashcard_progress' AND relrowsecurity = true) THEN
        ALTER TABLE public.user_flashcard_progress ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies (with proper existence checks)
DO $$ 
BEGIN
    -- Policy for SELECT
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_flashcard_progress' AND policyname = 'Users can view own flashcard progress') THEN
        CREATE POLICY "Users can view own flashcard progress" ON public.user_flashcard_progress 
        FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- Policy for INSERT
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_flashcard_progress' AND policyname = 'Users can create own flashcard progress') THEN
        CREATE POLICY "Users can create own flashcard progress" ON public.user_flashcard_progress 
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Policy for UPDATE
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_flashcard_progress' AND policyname = 'Users can update own flashcard progress') THEN
        CREATE POLICY "Users can update own flashcard progress" ON public.user_flashcard_progress 
        FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create trigger for updated_at (with existence check)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_user_flashcard_progress_updated_at') THEN
        CREATE TRIGGER handle_user_flashcard_progress_updated_at 
        BEFORE UPDATE ON public.user_flashcard_progress
        FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END $$;

-- Insert some initial vocabulary words using existing table structure
INSERT INTO public.flashcards (
  user_id, word, definition, type, difficulty, card_type,
  pronunciation, part_of_speech, example_sentence, synonyms, antonyms, 
  etymology, memory_tip, next_review_date, review_count, success_count,
  category, frequency_score, source_type, context
) VALUES 
-- Use demo user ID - replace with actual user ID in production
('demo-user-123', 'aberrant', 'Departing from an accepted standard; deviating from the normal type', 'vocabulary', 'hard', 'vocabulary', '/ˈæbərənt/', 'adjective', 'The scientist noted the aberrant behavior of the test subjects.', ARRAY['abnormal', 'deviant', 'irregular', 'atypical'], ARRAY['normal', 'typical', 'standard', 'conventional'], 'From Latin aberrare, meaning "to go astray"', 'The student''s aberrant behavior during the exam surprised everyone.', timezone('utc'::text, now()), 0, 0, 'vocabulary', 6, 'static_import', 'Academic vocabulary'),

('demo-user-123', 'benevolent', 'Well meaning and kindly; showing compassion or goodwill', 'vocabulary', 'medium', 'vocabulary', '/bəˈnevələnt/', 'adjective', 'The benevolent king was loved by all his subjects.', ARRAY['kind', 'charitable', 'generous', 'compassionate'], ARRAY['malevolent', 'cruel', 'mean', 'harsh'], 'From Latin bene (well) + volens (wishing)', 'The benevolent teacher always helped struggling students after class.', timezone('utc'::text, now()), 0, 0, 'vocabulary', 7, 'static_import', 'Academic vocabulary'),

('demo-user-123', 'candid', 'Truthful and straightforward; frank and honest', 'vocabulary', 'medium', 'vocabulary', '/ˈkændɪd/', 'adjective', 'She gave a candid assessment of the project''s chances.', ARRAY['honest', 'frank', 'direct', 'straightforward'], ARRAY['dishonest', 'evasive', 'deceptive', 'indirect'], 'From Latin candidus meaning "white, pure"', 'I appreciate your candid opinion about my presentation.', timezone('utc'::text, now()), 0, 0, 'vocabulary', 8, 'static_import', 'Academic vocabulary'),

('demo-user-123', 'desolate', 'Feeling or showing great unhappiness; empty and lifeless', 'vocabulary', 'medium', 'vocabulary', '/ˈdesələt/', 'adjective', 'The abandoned house stood desolate on the hill.', ARRAY['barren', 'bleak', 'forsaken', 'deserted'], ARRAY['populated', 'lively', 'inhabited', 'cheerful'], 'From Latin desolatus meaning "abandoned"', 'The desolate landscape stretched endlessly without any signs of life.', timezone('utc'::text, now()), 0, 0, 'vocabulary', 6, 'static_import', 'Academic vocabulary'),

('demo-user-123', 'elaborate', 'Involving many carefully arranged parts; detailed and complicated', 'vocabulary', 'easy', 'vocabulary', '/ɪˈlæbərət/', 'adjective', 'The wedding had an elaborate reception with multiple courses.', ARRAY['detailed', 'complex', 'intricate', 'ornate'], ARRAY['simple', 'plain', 'basic', 'modest'], 'From Latin elaboratus meaning "worked out"', 'The architect created an elaborate design with intricate details.', timezone('utc'::text, now()), 0, 0, 'vocabulary', 9, 'static_import', 'Academic vocabulary')

ON CONFLICT (user_id, word) DO NOTHING;

-- Create indexes for better performance (with existence checks)
CREATE INDEX IF NOT EXISTS idx_flashcards_user_type ON public.flashcards(user_id, type);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_card_type ON public.flashcards(user_id, card_type);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON public.flashcards(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_flashcards_word_user ON public.flashcards(word, user_id);
CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_review ON public.user_flashcard_progress(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_user_flashcard ON public.user_flashcard_progress(user_id, flashcard_id);

-- Success message
SELECT 'Database update completed successfully! Added vocabulary support to existing flashcards table.' as message;