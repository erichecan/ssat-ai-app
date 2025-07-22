import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { word, userId, context, source } = await request.json()

    if (!word || !userId) {
      return NextResponse.json(
        { error: 'Word and userId are required' },
        { status: 400 }
      )
    }

    console.log('Adding word to vocabulary:', { word, userId, source })

    // Check if word already exists for this user
    const { data: existingWord, error: checkError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .eq('front_text', word.toLowerCase())
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

    // Add word as a flashcard
    const { data: newCard, error: insertError } = await supabase
      .from('flashcards')
      .insert({
        user_id: userId,
        front_text: word.toLowerCase(),
        back_text: `Definition for "${word}" - to be updated`, // Placeholder
        card_type: 'vocabulary',
        difficulty: 'medium',
        context: context || '',
        tags: [source || 'practice_session', 'vocabulary'],
        next_review_date: new Date().toISOString(),
        review_count: 0,
        success_count: 0,
        last_reviewed: null
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
      word: newCard.front_text,
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

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const { data: words, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .eq('card_type', 'vocabulary')
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