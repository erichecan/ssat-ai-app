/**
 * Check current database structure
 * Run with: node scripts/check-db-structure.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const main = async () => {
  try {
    console.log('🔍 Checking database structure...')
    
    // Check if flashcards table exists and get its structure
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT table_name, column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name IN ('flashcards', 'user_flashcard_progress')
          ORDER BY table_name, ordinal_position;
        `
      })

    if (tablesError) {
      console.error('Error checking tables:', tablesError)
      
      // Alternative method - try to query the table directly
      console.log('Trying alternative method...')
      const { data: flashcards, error: flashcardsError } = await supabase
        .from('flashcards')
        .select('*')
        .limit(1)

      if (flashcardsError) {
        console.error('Flashcards table error:', flashcardsError)
      } else {
        console.log('✅ Flashcards table exists with data:', Object.keys(flashcards[0] || {}))
      }

      const { data: progress, error: progressError } = await supabase
        .from('user_flashcard_progress')
        .select('*')
        .limit(1)

      if (progressError) {
        console.error('Progress table error:', progressError)
      } else {
        console.log('✅ Progress table exists')
      }
    } else {
      console.log('Database structure:')
      console.table(tables)
    }

    // Try to get a sample flashcard to see current structure
    console.log('\n🔍 Checking existing flashcard data...')
    const { data: existingCards, error: existingError } = await supabase
      .from('flashcards')
      .select('*')
      .limit(3)

    if (existingError) {
      console.error('Error fetching existing cards:', existingError)
    } else {
      console.log(`Found ${existingCards.length} existing flashcards`)
      if (existingCards.length > 0) {
        console.log('Sample flashcard structure:')
        console.log('Columns:', Object.keys(existingCards[0]))
        console.log('Sample data:', existingCards[0])
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run the check
if (require.main === module) {
  main()
}