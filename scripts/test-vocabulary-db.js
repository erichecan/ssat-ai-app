/**
 * Test vocabulary database connection and add a few sample words
 * Run with: node scripts/test-vocabulary-db.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const testWords = [
  {
    word: 'comprehensive',
    definition: 'Complete and including everything that is necessary',
    difficulty: 'medium',
    pronunciation: '/ˌkɒmprɪˈhensɪv/',
    part_of_speech: 'adjective',
    example_sentence: 'The teacher gave us a comprehensive review before the exam.',
    synonyms: ['thorough', 'complete', 'extensive', 'detailed'],
    antonyms: ['incomplete', 'partial', 'limited']
  },
  {
    word: 'analyze',
    definition: 'To examine something in detail in order to understand it better',
    difficulty: 'medium',
    pronunciation: '/ˈænəlaɪz/',
    part_of_speech: 'verb',
    example_sentence: 'Students need to analyze the data before drawing conclusions.',
    synonyms: ['examine', 'study', 'investigate', 'evaluate'],
    antonyms: ['ignore', 'overlook', 'synthesize']
  },
  {
    word: 'hypothesis',
    definition: 'A proposed explanation for something that can be tested',
    difficulty: 'hard',
    pronunciation: '/haɪˈpɒθəsɪs/',
    part_of_speech: 'noun',
    example_sentence: 'The scientist formed a hypothesis about the cause of the phenomenon.',
    synonyms: ['theory', 'assumption', 'proposition', 'supposition'],
    antonyms: ['fact', 'certainty', 'proof']
  }
]

const main = async () => {
  try {
    console.log('🔍 Testing vocabulary database connection...')
    
    // Test basic connection
    const { data: user, error: userError } = await supabase.auth.getUser()
    console.log('Supabase connection:', userError ? 'Failed' : 'Success')
    
    // Check if flashcards table has required columns
    console.log('📋 Checking flashcards table structure...')
    
    for (const testWord of testWords) {
      try {
        console.log(`Adding test word: ${testWord.word}`)
        
        const { data: existingWord, error: checkError } = await supabase
          .from('flashcards')
          .select('id')
          .eq('user_id', '00000000-0000-0000-0000-000000000001')
          .eq('word', testWord.word.toLowerCase())
          .maybeSingle()

        if (existingWord) {
          console.log(`  ✓ ${testWord.word} already exists`)
          continue
        }

        const { data: newCard, error: insertError } = await supabase
          .from('flashcards')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000001',
            word: testWord.word.toLowerCase(),
            definition: testWord.definition,
            type: 'vocabulary',
            subject: 'Advanced Vocabulary',
            difficulty_level: testWord.difficulty === 'easy' ? 1 : testWord.difficulty === 'medium' ? 2 : 3,
            question: `What does "${testWord.word}" mean?`,
            answer: testWord.definition,
            explanation: `${testWord.definition}. This is a commonly tested vocabulary word.`,
            tags: ['test', 'vocabulary'],
            pronunciation: testWord.pronunciation,
            part_of_speech: testWord.part_of_speech,
            example_sentence: testWord.example_sentence,
            synonyms: testWord.synonyms,
            antonyms: testWord.antonyms,
            etymology: '',
            memory_tip: `Remember: ${testWord.word} means ${testWord.definition.toLowerCase()}`,
            category: 'vocabulary',
            frequency_score: 50,
            source_type: 'test_data',
            source_context: 'Test vocabulary extraction'
          })
          .select()
          .single()

        if (insertError) {
          console.error(`  ❌ Error inserting ${testWord.word}:`, insertError)
        } else {
          console.log(`  ✅ Successfully added ${testWord.word}`)
        }
      } catch (error) {
        console.error(`Error processing ${testWord.word}:`, error.message)
      }
    }

    // Test vocabulary count
    console.log('\n📊 Current vocabulary statistics:')
    const { data: allCards, error: countError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', '00000000-0000-0000-0000-000000000001')
      .eq('type', 'vocabulary')

    if (countError) {
      console.error('Error fetching vocabulary:', countError)
    } else {
      console.log(`Total vocabulary words: ${allCards.length}`)
      console.log('Recent words:')
      allCards.slice(-5).forEach(card => {
        console.log(`  • ${card.word} (${card.difficulty})`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the test
if (require.main === module) {
  main()
}