import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { DEMO_USER_UUID } from '@/lib/demo-user'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { word, userId, context, source } = await request.json()
    const finalUserId = userId || DEMO_USER_UUID

    if (!word) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      )
    }

    console.log('Adding word to vocabulary:', { word, userId: finalUserId, source })

    // Check if word already exists for this user
    const { data: existingWord, error: checkError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', finalUserId)
      .eq('word', word.toLowerCase())
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing word:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing vocabulary' },
        { status: 500 }
      )
    }

    if (existingWord) {
      return NextResponse.json({
        success: true,
        message: 'Word already exists in vocabulary',
        wordId: existingWord.id,
        alreadyExists: true
      })
    }

    // Generate comprehensive flashcard content using AI
    let cardContent: any = {
      definition: `Definition for "${word}" - to be updated`,
      pronunciation: '',
      part_of_speech: 'unknown',
      example_sentence: '',
      synonyms: '[]',
      antonyms: '[]',
      etymology: '',
      memory_tip: '',
      difficulty: 'medium'
    }

    try {
      console.log('Generating AI content for word:', word)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      const prompt = `You are a vocabulary expert creating a comprehensive flashcard for SSAT/SAT test preparation.

Word: "${word}"
Context: "${context || 'General usage'}"

Create a detailed flashcard with the following information (respond in valid JSON format only):

{
  "definition": "Clear, concise definition suitable for high school students",
  "pronunciation": "IPA pronunciation in /.../ format",
  "part_of_speech": "noun/verb/adjective/adverb/etc",
  "example_sentence": "Natural example sentence using the word in context",
  "synonyms": ["synonym1", "synonym2", "synonym3"],
  "antonyms": ["antonym1", "antonym2"],
  "etymology": "Brief word origin if interesting/helpful",
  "memory_tip": "Helpful mnemonic or memory technique",
  "difficulty": "easy/medium/hard (based on SSAT/SAT level)"
}

Ensure the content is appropriate for SSAT/SAT test preparation and focuses on academic vocabulary usage.`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Parse AI response, remove markdown code blocks if present
      let cleanText = text.trim()
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      const aiContent = JSON.parse(cleanText)
      
      cardContent = {
        definition: aiContent.definition || cardContent.definition,
        pronunciation: aiContent.pronunciation || '',
        part_of_speech: aiContent.part_of_speech || 'unknown',
        example_sentence: aiContent.example_sentence || '',
        synonyms: Array.isArray(aiContent.synonyms) ? `{${aiContent.synonyms.join(',')}}` : '{}',
        antonyms: Array.isArray(aiContent.antonyms) ? `{${aiContent.antonyms.join(',')}}` : '{}',
        etymology: aiContent.etymology || '',
        memory_tip: aiContent.memory_tip || '',
        difficulty: aiContent.difficulty || 'medium'
      }
      
      console.log('Successfully generated AI content for:', word)
      
    } catch (aiError) {
      console.error('AI generation failed, using basic content:', aiError)
    }

    // Add word as a flashcard with AI-generated content
    const { data: newCard, error: insertError } = await supabase
      .from('flashcards')
      .insert({
        user_id: finalUserId,
        word: word.toLowerCase(),
        definition: cardContent.definition,
        type: 'vocabulary',
        subject: 'Advanced Vocabulary',
        difficulty_level: cardContent.difficulty === 'easy' ? 1 : cardContent.difficulty === 'medium' ? 2 : 3,
        question: `What does "${word}" mean?`,
        answer: cardContent.definition,
        explanation: `${cardContent.definition}. ${cardContent.etymology ? `Etymology: ${cardContent.etymology}` : ''}`,
        tags: `{${source || 'global_selection'},vocabulary}`,
        pronunciation: cardContent.pronunciation,
        part_of_speech: cardContent.part_of_speech,
        example_sentence: cardContent.example_sentence,
        synonyms: cardContent.synonyms,
        antonyms: cardContent.antonyms,
        etymology: cardContent.etymology,
        memory_tip: cardContent.memory_tip,
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