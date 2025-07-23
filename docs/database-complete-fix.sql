-- COMPLETE AND FINAL fix for flashcards table
-- This script handles ALL required fields and constraints properly

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

-- Create unique constraint for word + user_id combination (if it doesn't exist)
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'flashcards' 
        AND constraint_name = 'unique_word_user'
    ) THEN
        -- Remove any duplicate entries first (keep the most recent one)
        DELETE FROM public.flashcards a USING public.flashcards b 
        WHERE a.id < b.id AND a.word = b.word AND a.user_id = b.user_id;
        
        -- Add unique constraint
        ALTER TABLE public.flashcards 
        ADD CONSTRAINT unique_word_user UNIQUE (word, user_id);
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

-- Enable RLS on the user_flashcard_progress table (only if it doesn't exist)
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

-- Insert demo vocabulary words with ALL REQUIRED FIELDS
DO $$
DECLARE
    demo_user_uuid UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN
    -- Insert each word individually with ALL required fields including subject, question, answer, explanation
    
    -- Word: aberrant
    INSERT INTO public.flashcards (
        user_id, word, definition, type, subject, difficulty_level, question, answer, 
        explanation, difficulty, card_type, pronunciation, part_of_speech, 
        example_sentence, synonyms, antonyms, etymology, memory_tip, 
        next_review_date, review_count, success_count, category, 
        frequency_score, source_type, context, tags
    ) VALUES (
        demo_user_uuid, 'aberrant', 
        'Departing from an accepted standard; deviating from the normal type',
        'vocabulary', 'Advanced Vocabulary', 3,
        'What does "aberrant" mean?',
        'Departing from an accepted standard; deviating from the normal type',
        'Aberrant means departing from an accepted standard or deviating from the normal type. It comes from Latin aberrare, meaning "to go astray".',
        'hard', 'vocabulary', '/ˈæbərənt/', 'adjective',
        'The scientist noted the aberrant behavior of the test subjects.',
        ARRAY['abnormal', 'deviant', 'irregular', 'atypical'],
        ARRAY['normal', 'typical', 'standard', 'conventional'],
        'From Latin aberrare, meaning "to go astray"',
        'The student''s aberrant behavior during the exam surprised everyone.',
        timezone('utc'::text, now()), 0, 0, 'vocabulary', 6, 'static_import',
        'Academic vocabulary', ARRAY['academic', 'adjective']
    ) ON CONFLICT (word, user_id) DO NOTHING;

    -- Word: benevolent
    INSERT INTO public.flashcards (
        user_id, word, definition, type, subject, difficulty_level, question, answer,
        explanation, difficulty, card_type, pronunciation, part_of_speech,
        example_sentence, synonyms, antonyms, etymology, memory_tip,
        next_review_date, review_count, success_count, category,
        frequency_score, source_type, context, tags
    ) VALUES (
        demo_user_uuid, 'benevolent',
        'Well meaning and kindly; showing compassion or goodwill',
        'vocabulary', 'Advanced Vocabulary', 2,
        'What does "benevolent" mean?',
        'Well meaning and kindly; showing compassion or goodwill',
        'Benevolent means well-meaning and kindly, showing compassion or goodwill. It comes from Latin bene (well) + volens (wishing).',
        'medium', 'vocabulary', '/bəˈnevələnt/', 'adjective',
        'The benevolent king was loved by all his subjects.',
        ARRAY['kind', 'charitable', 'generous', 'compassionate'],
        ARRAY['malevolent', 'cruel', 'mean', 'harsh'],
        'From Latin bene (well) + volens (wishing)',
        'The benevolent teacher always helped struggling students after class.',
        timezone('utc'::text, now()), 0, 0, 'vocabulary', 7, 'static_import',
        'Academic vocabulary', ARRAY['academic', 'adjective']
    ) ON CONFLICT (word, user_id) DO NOTHING;

    -- Word: candid
    INSERT INTO public.flashcards (
        user_id, word, definition, type, subject, difficulty_level, question, answer,
        explanation, difficulty, card_type, pronunciation, part_of_speech,
        example_sentence, synonyms, antonyms, etymology, memory_tip,
        next_review_date, review_count, success_count, category,
        frequency_score, source_type, context, tags
    ) VALUES (
        demo_user_uuid, 'candid',
        'Truthful and straightforward; frank and honest',
        'vocabulary', 'Advanced Vocabulary', 2,
        'What does "candid" mean?',
        'Truthful and straightforward; frank and honest',
        'Candid means truthful and straightforward, frank and honest. It comes from Latin candidus meaning "white, pure".',
        'medium', 'vocabulary', '/ˈkændɪd/', 'adjective',
        'She gave a candid assessment of the project''s chances.',
        ARRAY['honest', 'frank', 'direct', 'straightforward'],
        ARRAY['dishonest', 'evasive', 'deceptive', 'indirect'],
        'From Latin candidus meaning "white, pure"',
        'I appreciate your candid opinion about my presentation.',
        timezone('utc'::text, now()), 0, 0, 'vocabulary', 8, 'static_import',
        'Academic vocabulary', ARRAY['academic', 'adjective']
    ) ON CONFLICT (word, user_id) DO NOTHING;

    -- Word: desolate
    INSERT INTO public.flashcards (
        user_id, word, definition, type, subject, difficulty_level, question, answer,
        explanation, difficulty, card_type, pronunciation, part_of_speech,
        example_sentence, synonyms, antonyms, etymology, memory_tip,
        next_review_date, review_count, success_count, category,
        frequency_score, source_type, context, tags
    ) VALUES (
        demo_user_uuid, 'desolate',
        'Feeling or showing great unhappiness; empty and lifeless',
        'vocabulary', 'Advanced Vocabulary', 2,
        'What does "desolate" mean?',
        'Feeling or showing great unhappiness; empty and lifeless',
        'Desolate means feeling or showing great unhappiness, or being empty and lifeless. It comes from Latin desolatus meaning "abandoned".',
        'medium', 'vocabulary', '/ˈdesələt/', 'adjective',
        'The abandoned house stood desolate on the hill.',
        ARRAY['barren', 'bleak', 'forsaken', 'deserted'],
        ARRAY['populated', 'lively', 'inhabited', 'cheerful'],
        'From Latin desolatus meaning "abandoned"',
        'The desolate landscape stretched endlessly without any signs of life.',
        timezone('utc'::text, now()), 0, 0, 'vocabulary', 6, 'static_import',
        'Academic vocabulary', ARRAY['academic', 'adjective']
    ) ON CONFLICT (word, user_id) DO NOTHING;

    -- Word: elaborate
    INSERT INTO public.flashcards (
        user_id, word, definition, type, subject, difficulty_level, question, answer,
        explanation, difficulty, card_type, pronunciation, part_of_speech,
        example_sentence, synonyms, antonyms, etymology, memory_tip,
        next_review_date, review_count, success_count, category,
        frequency_score, source_type, context, tags
    ) VALUES (
        demo_user_uuid, 'elaborate',
        'Involving many carefully arranged parts; detailed and complicated',
        'vocabulary', 'Advanced Vocabulary', 1,
        'What does "elaborate" mean?',
        'Involving many carefully arranged parts; detailed and complicated',
        'Elaborate means involving many carefully arranged parts, detailed and complicated. It comes from Latin elaboratus meaning "worked out".',
        'easy', 'vocabulary', '/ɪˈlæbərət/', 'adjective',
        'The wedding had an elaborate reception with multiple courses.',
        ARRAY['detailed', 'complex', 'intricate', 'ornate'],
        ARRAY['simple', 'plain', 'basic', 'modest'],
        'From Latin elaboratus meaning "worked out"',
        'The architect created an elaborate design with intricate details.',
        timezone('utc'::text, now()), 0, 0, 'vocabulary', 9, 'static_import',
        'Academic vocabulary', ARRAY['academic', 'adjective']
    ) ON CONFLICT (word, user_id) DO NOTHING;

END $$;

-- Create indexes for better performance (with existence checks)
CREATE INDEX IF NOT EXISTS idx_flashcards_user_type ON public.flashcards(user_id, type);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_card_type ON public.flashcards(user_id, card_type);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON public.flashcards(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_flashcards_word_user ON public.flashcards(word, user_id);
CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_review ON public.user_flashcard_progress(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_user_flashcard_progress_user_flashcard ON public.user_flashcard_progress(user_id, flashcard_id);

-- Success message
SELECT 'Database update COMPLETELY finished! All required fields provided, constraints added, vocabulary words inserted.' as message;