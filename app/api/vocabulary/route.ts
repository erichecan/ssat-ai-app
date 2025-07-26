import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/gemini'
import { createClient } from '@supabase/supabase-js'
import { DEMO_USER_UUID } from '@/lib/demo-user'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Add word to vocabulary with AI enhancement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { word, userId, source = 'manual_add', context } = body
    
    // Fix UUID format - 2024-12-19 17:30:00
    if (!userId || userId === 'demo-user-123') {
      userId = DEMO_USER_UUID
    }

    console.log('Adding word to vocabulary:', { word, userId, source })

    if (!word) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      )
    }

    // Check if word already exists for this user
    const { data: existingWord, error: checkError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .eq('word', word.toLowerCase())
      .eq('type', 'vocabulary')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing word:', checkError)
      return NextResponse.json(
        { error: 'Database error checking existing word' },
        { status: 500 }
      )
    }

    if (existingWord) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Word already exists in vocabulary',
          word: existingWord 
        }
      )
    }

    // Generate AI content for the word
    let cardContent
    try {
      console.log('Generating AI content for word:', word)
      
      const prompt = `You are a vocabulary expert creating a comprehensive flashcard for SSAT/SAT test preparation.

Word: "${word}"
Context: "${context || 'General usage'}"

Create a detailed flashcard with the following information (respond in valid JSON format only):

{
  "definition": "Clear, concise definition suitable for high school students",
  "pronunciation": "American English IPA pronunciation in /.../ format (use US pronunciation, not British)",
  "part_of_speech": "noun/verb/adjective/adverb/etc",
  "example_sentence": "Natural example sentence using the word in context",
  "synonyms": ["synonym1", "synonym2", "synonym3"],
  "antonyms": ["antonym1", "antonym2"],
  "etymology": "Brief word origin if interesting/helpful",
  "memory_tip": "Helpful mnemonic or memory technique",
  "difficulty": "easy/medium/hard (based on SSAT/SAT level)"
}

Return only the JSON object, no additional text.`

      const aiResponse = await generateText(prompt, 10000) // 10 second timeout
      const cleanResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim()
      cardContent = JSON.parse(cleanResponse)
      
      console.log('Successfully generated AI content for:', word)
      
    } catch (aiError) {
      console.error('AI generation failed, using basic content:', aiError)
    }

    // Add word as a flashcard with AI-generated content
    const { data: newCard, error: insertError } = await supabase
      .from('flashcards')
      .insert({
        user_id: userId,
        word: word.toLowerCase(),
        definition: cardContent.definition || 'Definition for "' + word + '" - to be updated',
        type: 'vocabulary',
        subject: 'Advanced Vocabulary',
        difficulty_level: cardContent.difficulty === 'easy' ? 1 : cardContent.difficulty === 'medium' ? 2 : 3,
        question: `What does "${word}" mean?`,
        answer: cardContent.definition || 'Definition for "' + word + '" - to be updated',
        explanation: `${cardContent.definition || 'Definition for "' + word + '" - to be updated'}. ${cardContent.etymology ? `Etymology: ${cardContent.etymology}` : ''}`,
        tags: `{${source || 'global_selection'},vocabulary}`,
        pronunciation: cardContent.pronunciation || '',
        part_of_speech: cardContent.part_of_speech || 'unknown',
        example_sentence: cardContent.example_sentence || '',
        synonyms: cardContent.synonyms || '[]',
        antonyms: cardContent.antonyms || '[]',
        etymology: cardContent.etymology || '',
        memory_tip: cardContent.memory_tip || '',
        category: 'vocabulary',
        frequency_score: 50,
        source_type: 'global_selection',
        source_context: context || ''
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting vocabulary word:', insertError)
      return NextResponse.json(
        { error: 'Failed to add word to vocabulary' },
        { status: 500 }
      )
    }

    console.log('Successfully added word to vocabulary:', newCard.id)

    return NextResponse.json({
      success: true,
      message: 'Word added to vocabulary successfully',
      wordId: newCard.id,
      word: newCard.word,
      alreadyExists: false
    })

  } catch (error) {
    console.error('Error in vocabulary API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const finalUserId = userId || DEMO_USER_UUID

    const { data: words, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', finalUserId)
      .eq('type', 'vocabulary')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vocabulary:', error)
      return NextResponse.json(
        { error: 'Failed to fetch vocabulary' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      words: words || []
    })

  } catch (error) {
    console.error('Error in vocabulary GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}