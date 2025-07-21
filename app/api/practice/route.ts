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

    // 简化版本：使用AI生成题目而不依赖数据库表
    console.log('Creating practice session for user:', userId)
    
    try {
      // 调用AI生成题目API
      const questionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          questionType: 'mixed',
          count: questionCount || 10
        })
      })

      if (!questionResponse.ok) {
        throw new Error('Failed to generate questions')
      }

      const questionsData = await questionResponse.json()
      
      if (!questionsData.success || !questionsData.questions) {
        throw new Error('Invalid questions data')
      }

      // 创建简化的session对象（不依赖数据库）
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const session = {
        id: sessionId,
        user_id: userId,
        session_type: sessionType,
        settings: {
          subjects: subjects || ['all'],
          difficulty: difficulty || 'medium', 
          question_count: questionCount || 10,
          time_limit: timeLimit
        },
        questions: questionsData.questions,
        status: 'active',
        current_question_index: 0,
        score: 0,
        start_time: new Date().toISOString(),
        created_at: new Date().toISOString()
      }

      console.log('Practice session created successfully:', sessionId)

      return NextResponse.json({
        success: true,
        session,
        questions: questionsData.questions,
        message: 'Practice session created successfully',
        metadata: questionsData.metadata
      })

    } catch (questionsError) {
      console.error('Error generating questions for practice:', questionsError)
      
      // 备用：使用question-bank中的题目
      console.log('Falling back to question bank...')
      
      let questions: any[] = []
      
      if (sessionType === 'adaptive') {
        const easyQuestions = filterQuestions(undefined, 'easy', undefined, Math.floor((questionCount || 10) * 0.3))
        const mediumQuestions = filterQuestions(undefined, 'medium', undefined, Math.floor((questionCount || 10) * 0.5))
        const hardQuestions = filterQuestions(undefined, 'hard', undefined, Math.floor((questionCount || 10) * 0.2))
        
        questions = [...easyQuestions, ...mediumQuestions, ...hardQuestions]
          .sort(() => Math.random() - 0.5)
          .slice(0, questionCount || 10)
      } else {
        questions = filterQuestions(
          subjects?.[0],
          difficulty || 'medium',
          undefined,
          questionCount || 10
        )
      }

      const sessionId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const session = {
        id: sessionId,
        user_id: userId,
        session_type: sessionType,
        settings: {
          subjects: subjects || ['all'],
          difficulty: difficulty || 'medium',
          question_count: questionCount || 10,
          time_limit: timeLimit
        },
        questions,
        status: 'active',
        current_question_index: 0,
        score: 0,
        start_time: new Date().toISOString(),
        created_at: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        session,
        questions,
        message: 'Practice session created successfully (fallback mode)',
        isFallback: true
      })
    }

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