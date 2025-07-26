import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEMO_USER_UUID } from '@/lib/demo-user'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 从practice中保存生词到flashcard系统
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId = DEMO_USER_UUID, // Fixed UUID format - 2024-12-19 18:00:00
      word,
      definition,
      context, // 题目上下文
      sessionId,
      questionId
    } = body

    if (!word || !definition) {
      return NextResponse.json(
        { error: 'Word and definition are required' },
        { status: 400 }
      )
    }

    console.log('Saving vocabulary word:', { word, definition, context })

    // 1. 检查是否已经存在这个词
    const { data: existingFlashcard, error: checkError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .eq('word', word)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing flashcard:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing vocabulary' },
        { status: 500 }
      )
    }

    if (existingFlashcard) {
      return NextResponse.json({
        success: true,
        message: 'Word already exists in your vocabulary',
        flashcard: existingFlashcard
      })
    }

    // 2. 使用AI增强词汇信息（如果可能）
    let enhancedVocab = {
      word,
      definition,
      pronunciation: '', // 可以通过AI API填充
      part_of_speech: '', // 可以通过AI API分析
      example_sentence: context || '',
      memory_tip: '',
      synonyms: [],
      antonyms: [],
      etymology: '',
      category: 'vocabulary',
      frequency_score: 50,
      source_type: 'practice_saved',
      source_context: context
    }

    // 3. 保存到flashcards表
    const { data: newFlashcard, error: insertError } = await supabase
      .from('flashcards')
      .insert({
        user_id: userId,
        question_id: questionId,
        front_text: word,
        back_text: definition,
        ...enhancedVocab,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving flashcard:', insertError)
      return NextResponse.json(
        { error: 'Failed to save vocabulary word' },
        { status: 500 }
      )
    }

    // 4. 创建用户进度记录
    const { error: progressError } = await supabase
      .from('user_flashcard_progress')
      .insert({
        user_id: userId,
        flashcard_id: word,
        mastery_level: 0, // 新词
        times_seen: 0,
        times_correct: 0,
        difficulty_rating: 3, // 默认难度
        interval_days: 1,
        ease_factor: 2.5,
        next_review: new Date().toISOString(), // 立即可复习
        is_mastered: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (progressError) {
      console.error('Error creating progress record:', progressError)
      // 不返回错误，因为主要任务（保存词汇）已完成
    }

    return NextResponse.json({
      success: true,
      message: 'Vocabulary word saved successfully',
      flashcard: newFlashcard
    })

  } catch (error) {
    console.error('Save vocabulary API error:', error)
    return NextResponse.json(
      { error: 'Failed to save vocabulary word' },
      { status: 500 }
    )
  }
}

// 获取用户保存的词汇列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || DEMO_USER_UUID // Fixed UUID format
    const limit = parseInt(searchParams.get('limit') || '50')

    console.log('Fetching saved vocabulary for user:', userId)

    // 获取用户保存的flashcards
    const { data: flashcards, error: flashcardsError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .eq('source_type', 'practice_saved')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (flashcardsError) {
      console.error('Error fetching saved vocabulary:', flashcardsError)
      return NextResponse.json(
        { error: 'Failed to fetch saved vocabulary' },
        { status: 500 }
      )
    }

    // 获取对应的进度信息
    const wordIds = flashcards.map(f => f.word).filter(Boolean)
    let progressData: any[] = []

    if (wordIds.length > 0) {
      const { data: progress, error: progressError } = await supabase
        .from('user_flashcard_progress')
        .select('*')
        .eq('user_id', userId)
        .in('flashcard_id', wordIds)

      if (!progressError) {
        progressData = progress || []
      }
    }

    // 合并flashcard和进度数据
    const enhancedFlashcards = flashcards.map(flashcard => {
      const progress = progressData.find(p => p.flashcard_id === flashcard.word)
      return {
        ...flashcard,
        userProgress: progress || null
      }
    })

    return NextResponse.json({
      success: true,
      vocabulary: enhancedFlashcards,
      total: flashcards.length
    })

  } catch (error) {
    console.error('Get saved vocabulary API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved vocabulary' },
      { status: 500 }
    )
  }
}