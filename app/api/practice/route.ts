import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { filterQuestions } from '@/lib/question-bank'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface PracticeSession {
  id: string
  user_id: string
  session_type: 'adaptive' | 'custom'
  settings: {
    subjects: string[]
    difficulty: string
    question_count: number
    time_limit?: number
  }
  questions: string[] // question IDs
  status: 'active' | 'completed' | 'paused'
  current_question_index: number
  score: number
  start_time: string
  end_time?: string
  created_at: string
  updated_at: string
}

// Create new practice session
export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      sessionType, 
      subjects, 
      difficulty, 
      questionCount, 
      timeLimit 
    } = await request.json()
    
    if (!userId || !sessionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate questions based on settings
    let questions: any[] = []
    
    if (sessionType === 'adaptive') {
      // For adaptive mode, use AI to select appropriate questions based on user history
      // For now, we'll use a mix of difficulties
      const easyQuestions = filterQuestions(undefined, 'easy', undefined, Math.floor(questionCount * 0.3))
      const mediumQuestions = filterQuestions(undefined, 'medium', undefined, Math.floor(questionCount * 0.5))
      const hardQuestions = filterQuestions(undefined, 'hard', undefined, Math.floor(questionCount * 0.2))
      
      questions = [...easyQuestions, ...mediumQuestions, ...hardQuestions]
        .sort(() => Math.random() - 0.5) // shuffle
        .slice(0, questionCount)
    } else {
      // Custom mode - filter by user selections
      const selectedSubjects = subjects?.length > 0 ? subjects : undefined
      questions = filterQuestions(
        selectedSubjects?.[0], // Use first subject for now
        difficulty || 'medium',
        undefined,
        questionCount || 10
      )
    }

    // Create practice session
    const sessionData = {
      user_id: userId,
      session_type: sessionType,
      settings: {
        subjects: subjects || ['all'],
        difficulty: difficulty || 'medium',
        question_count: questionCount || 10,
        time_limit: timeLimit
      },
      questions: questions.map(q => q.id),
      status: 'active',
      current_question_index: 0,
      score: 0,
      start_time: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: session, error } = await supabase
      .from('practice_sessions')
      .insert(sessionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating practice session:', error)
      return NextResponse.json(
        { error: 'Failed to create practice session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      session,
      questions: questions.slice(0, 1), // Return first question only
      message: 'Practice session created successfully'
    })

  } catch (error) {
    console.error('Practice session API error:', error)
    return NextResponse.json(
      { error: 'Failed to create practice session' },
      { status: 500 }
    )
  }
}

// Get user's practice sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching practice sessions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch practice sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sessions,
      total: sessions?.length || 0
    })

  } catch (error) {
    console.error('Get practice sessions API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch practice sessions' },
      { status: 500 }
    )
  }
}