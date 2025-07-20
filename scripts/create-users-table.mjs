import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createUsersTable() {
  try {
    console.log('Creating users table...')
    
    // First, let's check if the table already exists
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
    
    if (checkError) {
      console.log('Could not check existing tables, proceeding with creation...')
    } else if (existingTables && existingTables.length > 0) {
      console.log('Users table already exists!')
      return true
    }
    
    // Try to create a test user to see what works
    console.log('Attempting to create demo user directly...')
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: 'demo@ssatmaster.com',
        username: 'demo',
        full_name: 'Demo Student'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating user:', error)
      console.log('Table probably does not exist. Need to create it through Supabase dashboard.')
      return false
    } else {
      console.log('✓ Demo user created successfully:', data)
      return true
    }
    
  } catch (error) {
    console.error('Error:', error)
    return false
  }
}

createUsersTable().then((success) => {
  if (success) {
    console.log('Users table setup complete!')
  } else {
    console.log('Please create the users table manually in Supabase dashboard')
    console.log('Table structure needed:')
    console.log(`
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  location TEXT,
  practice_time TEXT DEFAULT '0h',
  reading_speed TEXT DEFAULT 'N/A',
  questions_answered INTEGER DEFAULT 0,
  overall_score INTEGER DEFAULT 0,
  accuracy_rate TEXT DEFAULT '0%',
  study_streak INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'N/A',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`)
  }
  process.exit(0)
})