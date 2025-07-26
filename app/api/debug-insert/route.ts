import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Testing database insert directly...')
    
    const testWord = {
      user_id: '00000000-0000-0000-0000-000000000001',
      word: 'test_word_' + Date.now(),
      definition: 'A test definition',
      type: 'vocabulary',
      subject: 'SSAT Vocabulary',
      difficulty_level: 2,
      question: 'What does "test_word" mean?',
      answer: 'A test definition',
      explanation: 'A test definition for debugging',
      pronunciation: '/test/',
      part_of_speech: 'noun',
      example_sentence: 'This is a test sentence.',
      memory_tip: 'Remember this is a test',
      synonyms: ['test'],
      antonyms: ['real'],
      etymology: 'test origin',
      category: 'vocabulary',
      frequency_score: 50,
      source_type: 'debug_test',
      source_context: 'Debug test insert',
      tags: ['vocabulary', 'test'],
      is_public: true,
      usage_count: 0,
      avg_rating: 0
    }

    console.log('Attempting to insert test word:', testWord.word)
    console.log('Test word structure:', JSON.stringify(testWord, null, 2))

    const { data: insertedWord, error: insertError } = await supabase
      .from('flashcards')
      .insert([testWord])
      .select('word, id')

    if (insertError) {
      console.error('Insert error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      return NextResponse.json({
        success: false,
        error: 'Database insert failed',
        details: insertError.message,
        hint: insertError.hint,
        code: insertError.code
      })
    }

    console.log('Insert successful:', insertedWord)
    
    return NextResponse.json({
      success: true,
      message: 'Test word inserted successfully',
      insertedWord: insertedWord
    })

  } catch (error) {
    console.error('Test insert error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test insert failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}