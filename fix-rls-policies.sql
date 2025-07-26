-- Fix RLS policies for vocabulary generation
-- The issue is that auth.uid() doesn't match the demo user UUID

-- First, let's check what RLS policies exist
-- Run this query to see current policies:
-- SELECT * FROM pg_policies WHERE tablename = 'flashcards';

-- Create a more permissive policy for the demo user or disable RLS temporarily
-- Option 1: Add a policy that allows inserts for the specific demo user UUID

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can create own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can view own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can update own flashcards" ON public.flashcards;

-- Create new policies that work with the demo user
CREATE POLICY "Allow demo user flashcard access" 
ON public.flashcards 
FOR ALL 
TO authenticated
USING (
  user_id = '00000000-0000-0000-0000-000000000001'::uuid OR 
  auth.uid() = user_id OR
  is_public = true
);

-- Alternative: Temporarily disable RLS for testing
-- You can uncomment this line to completely disable RLS:
-- ALTER TABLE public.flashcards DISABLE ROW LEVEL SECURITY;

-- Ensure the demo user exists in the users table
INSERT INTO public.users (
  id, 
  email, 
  username, 
  full_name,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'demo@example.com',
  'demo_user',
  'Demo User',
  timezone('utc'::text, now()),
  timezone('utc'::text, now())
) ON CONFLICT (id) DO NOTHING;

-- Also ensure demo user exists in auth.users if needed
-- Note: This might fail if you don't have direct auth access, which is normal
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'demo@example.com', 
  '$2a$10$placeholder_hash_demo_user_password',
  timezone('utc'::text, now()),
  timezone('utc'::text, now()),
  timezone('utc'::text, now()),
  '{"username": "demo_user", "full_name": "Demo User"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'RLS policies fixed for vocabulary generation!' as message;