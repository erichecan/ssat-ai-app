-- Complete Vocabulary Database Fix
-- This script adds ALL missing fields needed for vocabulary generation
-- Based on the API requirements in generate-bulk/route.ts

-- Add ALL missing columns to existing flashcards table
DO $$ 
BEGIN
    -- Core vocabulary fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='word') THEN
        ALTER TABLE public.flashcards ADD COLUMN word TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='definition') THEN
        ALTER TABLE public.flashcards ADD COLUMN definition TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='type') THEN
        ALTER TABLE public.flashcards ADD COLUMN type TEXT DEFAULT 'vocabulary';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='subject') THEN
        ALTER TABLE public.flashcards ADD COLUMN subject TEXT DEFAULT 'SSAT Vocabulary';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='question') THEN
        ALTER TABLE public.flashcards ADD COLUMN question TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='answer') THEN
        ALTER TABLE public.flashcards ADD COLUMN answer TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='explanation') THEN
        ALTER TABLE public.flashcards ADD COLUMN explanation TEXT;
    END IF;
    
    -- Pronunciation and language fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='pronunciation') THEN
        ALTER TABLE public.flashcards ADD COLUMN pronunciation TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='part_of_speech') THEN
        ALTER TABLE public.flashcards ADD COLUMN part_of_speech TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='example_sentence') THEN
        ALTER TABLE public.flashcards ADD COLUMN example_sentence TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='memory_tip') THEN
        ALTER TABLE public.flashcards ADD COLUMN memory_tip TEXT;
    END IF;
    
    -- Arrays for synonyms and antonyms
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='synonyms') THEN
        ALTER TABLE public.flashcards ADD COLUMN synonyms TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='antonyms') THEN
        ALTER TABLE public.flashcards ADD COLUMN antonyms TEXT[];
    END IF;
    
    -- Etymology and categorization
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='etymology') THEN
        ALTER TABLE public.flashcards ADD COLUMN etymology TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='category') THEN
        ALTER TABLE public.flashcards ADD COLUMN category TEXT DEFAULT 'vocabulary';
    END IF;
    
    -- Frequency and source tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='frequency_score') THEN
        ALTER TABLE public.flashcards ADD COLUMN frequency_score INTEGER DEFAULT 50;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='source_type') THEN
        ALTER TABLE public.flashcards ADD COLUMN source_type TEXT DEFAULT 'user_added';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='source_context') THEN
        ALTER TABLE public.flashcards ADD COLUMN source_context TEXT;
    END IF;
    
    -- Tags array for flexible categorization
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='tags') THEN
        ALTER TABLE public.flashcards ADD COLUMN tags TEXT[];
    END IF;
    
    -- Public/private and usage tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='is_public') THEN
        ALTER TABLE public.flashcards ADD COLUMN is_public BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='usage_count') THEN
        ALTER TABLE public.flashcards ADD COLUMN usage_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='avg_rating') THEN
        ALTER TABLE public.flashcards ADD COLUMN avg_rating DECIMAL(3,2) DEFAULT 0.0;
    END IF;
    
    -- Image and audio support
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='image_url') THEN
        ALTER TABLE public.flashcards ADD COLUMN image_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='audio_url') THEN
        ALTER TABLE public.flashcards ADD COLUMN audio_url TEXT;
    END IF;
    
    -- Hint for learning assistance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='hint') THEN
        ALTER TABLE public.flashcards ADD COLUMN hint TEXT;
    END IF;
    
    -- Metadata for future extensibility
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='metadata') THEN
        ALTER TABLE public.flashcards ADD COLUMN metadata JSONB;
    END IF;
    
    -- Created by for tracking authorship
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flashcards' AND column_name='created_by') THEN
        ALTER TABLE public.flashcards ADD COLUMN created_by UUID REFERENCES auth.users(id);
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
        WHERE a.id < b.id AND a.word = b.word AND a.user_id = b.user_id AND a.word IS NOT NULL;
        
        -- Add unique constraint
        ALTER TABLE public.flashcards 
        ADD CONSTRAINT unique_word_user UNIQUE (word, user_id);
    END IF;
END $$;

-- Create demo user in auth.users if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001'::UUID) THEN
        INSERT INTO auth.users (
            id, 
            email, 
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data
        ) VALUES (
            '00000000-0000-0000-0000-000000000001'::UUID,
            'demo@example.com',
            '$2a$10$placeholder_hash_for_demo_user',
            timezone('utc'::text, now()),
            timezone('utc'::text, now()),
            timezone('utc'::text, now()),
            '{"username": "demo_user", "full_name": "Demo User"}'::jsonb
        );
    END IF;
END $$;

-- Temporarily disable RLS for the demo user insertion
ALTER TABLE public.flashcards DISABLE ROW LEVEL SECURITY;

-- Insert a few test vocabulary words to verify the structure works
INSERT INTO public.flashcards (
    user_id, word, definition, type, subject, difficulty_level, 
    question, answer, explanation, pronunciation, part_of_speech, 
    example_sentence, memory_tip, synonyms, antonyms, etymology, 
    category, frequency_score, source_type, source_context, tags,
    is_public, usage_count, avg_rating
) VALUES 
(
    '00000000-0000-0000-0000-000000000001'::UUID,
    'serendipity',
    'The occurrence and development of events by chance in a happy or beneficial way',
    'vocabulary',
    'SSAT Vocabulary',
    2,
    'What does "serendipity" mean?',
    'The occurrence and development of events by chance in a happy or beneficial way',
    'Serendipity refers to finding something good without looking for it, or a pleasant surprise that happens by accident.',
    '/ˌserənˈdɪpɪti/',
    'noun',
    'Finding that perfect restaurant was pure serendipity.',
    'Think of "happy accidents" - serendipity is when good things happen by chance',
    ARRAY['chance', 'luck', 'fortune', 'accident'],
    ARRAY['misfortune', 'bad luck', 'design', 'intention'],
    'Coined by Horace Walpole in 1754 from the Persian fairy tale "The Three Princes of Serendip"',
    'vocabulary',
    60,
    'database_fix_test',
    'Test word inserted during database structure fix',
    ARRAY['vocabulary', 'ssat', 'test'],
    true,
    0,
    0.0
) ON CONFLICT (word, user_id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flashcards_user_type ON public.flashcards(user_id, type);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_word ON public.flashcards(user_id, word);
CREATE INDEX IF NOT EXISTS idx_flashcards_source_type ON public.flashcards(source_type);
CREATE INDEX IF NOT EXISTS idx_flashcards_tags ON public.flashcards USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_flashcards_category ON public.flashcards(category);

-- Success message with field count
DO $$
DECLARE
    field_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO field_count 
    FROM information_schema.columns 
    WHERE table_name = 'flashcards';
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'COMPLETE VOCABULARY DATABASE FIX COMPLETED!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Total fields in flashcards table: %', field_count;
    RAISE NOTICE 'Added vocabulary-specific fields for:';
    RAISE NOTICE '  ✓ Core vocabulary (word, definition, pronunciation)';
    RAISE NOTICE '  ✓ Language learning (synonyms, antonyms, etymology)';
    RAISE NOTICE '  ✓ Learning aids (memory_tip, example_sentence)';
    RAISE NOTICE '  ✓ Categorization (tags, category, frequency_score)';
    RAISE NOTICE '  ✓ Source tracking (source_type, source_context)';
    RAISE NOTICE '  ✓ Media support (image_url, audio_url)';
    RAISE NOTICE '  ✓ Unique constraints and indexes';
    RAISE NOTICE '  ✓ Demo user and test data';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'You can now run vocabulary auto-generation!';
    RAISE NOTICE '===========================================';
END $$;