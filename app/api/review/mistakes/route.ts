import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface ReviewQuestion {
  id: string
  question: string
  passage?: string
  options: string[]
  correct_answer: string
  user_answer: string
  explanation: string
  type: string
  difficulty: string
  answered_at: string
  time_spent: number
  session_id: string
}

// Get mistakes for a specific session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    console.log('Fetching mistakes for session:', sessionId)
    
    let reviewQuestions: ReviewQuestion[] = []
    
    try {
      // 从数据库获取该session的错题记录
      const { data: incorrectAnswers, error } = await supabase
        .from('user_answers')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_correct', false)
        .order('answered_at', { ascending: true })

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      if (incorrectAnswers && incorrectAnswers.length > 0) {
        console.log('Found', incorrectAnswers.length, 'mistakes in database')
        
        // 从question bank或AI生成的问题中找到完整的题目信息
        reviewQuestions = incorrectAnswers.map(answer => {
          // 对于AI生成的题目，我们需要重新构建题目信息
          // 因为AI题目可能没有存储在static question bank中
          
          return {
            id: answer.question_id,
            question: answer.question_text || 'Question text not available',
            passage: answer.passage_text || undefined,
            options: answer.options ? JSON.parse(answer.options) : [],
            correct_answer: answer.correct_answer,
            user_answer: answer.selected_answer || answer.user_answer,
            explanation: answer.explanation || 'Explanation not available',
            type: answer.question_type || 'mixed',
            difficulty: answer.difficulty || 'medium',
            answered_at: answer.answered_at,
            time_spent: answer.time_spent || 0,
            session_id: answer.session_id
          }
        })
      } else {
        console.log('No mistakes found for session:', sessionId)
        // 如果没有错误记录，返回空数组
        reviewQuestions = []
      }

    } catch (dbError) {
      console.error('Database query failed:', dbError)
      
      // 如果数据库查询失败，检查是否是临时session
      if (sessionId.includes('practice_')) {
        console.log('Temporary session detected, no persistent mistakes available')
        reviewQuestions = []
      } else {
        throw dbError
      }
    }

    return NextResponse.json({
      success: true,
      questions: reviewQuestions,
      sessionId: sessionId
    })

  } catch (error) {
    console.error('Review mistakes API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch session mistakes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}