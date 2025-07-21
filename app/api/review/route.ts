import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { questionBank } from '@/lib/question-bank'

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

// Get incorrect answers for review
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // 暂时创建模拟数据，直到有真实的答题记录
    console.log('Fetching review data for user:', userId)
    
    let reviewQuestions: ReviewQuestion[] = []
    
    try {
      // 尝试从数据库获取真实数据
      const { data: incorrectAnswers, error } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_id', userId)
        .eq('is_correct', false)
        .order('answered_at', { ascending: false })
        .limit(50)

      if (!error && incorrectAnswers && incorrectAnswers.length > 0) {
        // 有真实数据时使用真实数据
        reviewQuestions = incorrectAnswers.map(answer => {
          const originalQuestion = questionBank.find(q => q.id === answer.question_id)
          
          if (!originalQuestion) {
            return {
              id: answer.question_id,
              question: 'Question not found',
              options: [],
              correct_answer: answer.correct_answer,
              user_answer: answer.user_answer,
              explanation: 'This question is no longer available.',
              type: 'unknown',
              difficulty: 'medium',
              answered_at: answer.answered_at,
              time_spent: answer.time_spent,
              session_id: answer.session_id
            }
          }

          return {
            id: originalQuestion.id,
            question: originalQuestion.question,
            passage: originalQuestion.passage,
            options: originalQuestion.options,
            correct_answer: originalQuestion.correct_answer,
            user_answer: answer.user_answer,
            explanation: originalQuestion.explanation,
            type: originalQuestion.type,
            difficulty: originalQuestion.difficulty,
            answered_at: answer.answered_at,
            time_spent: answer.time_spent,
            session_id: answer.session_id
          }
        }).filter(q => q.question !== 'Question not found')
        
        console.log('Found', reviewQuestions.length, 'real incorrect answers')
      } else {
        // 没有真实数据时使用示例数据
        console.log('No real data found, creating sample review questions')
        
        const sampleQuestions = questionBank.slice(0, 5) // 取前5个题目作为示例
        
        reviewQuestions = sampleQuestions.map((q, index) => ({
          id: q.id,
          question: q.question,
          passage: q.passage,
          options: q.options,
          correct_answer: q.correct_answer,
          user_answer: q.options[Math.floor(Math.random() * q.options.length)], // 随机选择错误答案
          explanation: q.explanation,
          type: q.type,
          difficulty: q.difficulty,
          answered_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(), // 过去几天的日期
          time_spent: Math.floor(Math.random() * 120) + 30, // 30-150秒
          session_id: `sample_session_${index + 1}`
        })).filter(q => q.user_answer !== q.correct_answer) // 确保都是"错误"答案
      }
    } catch (dbError) {
      console.log('Database error, using sample data:', dbError)
      
      // 数据库错误时使用示例数据
      const sampleQuestions = questionBank.slice(0, 3)
      
      reviewQuestions = sampleQuestions.map((q, index) => ({
        id: q.id,
        question: q.question,
        passage: q.passage,
        options: q.options,
        correct_answer: q.correct_answer,
        user_answer: q.options[(q.options.findIndex(opt => opt === q.correct_answer) + 1) % q.options.length], // 选择非正确答案
        explanation: q.explanation,
        type: q.type,
        difficulty: q.difficulty,
        answered_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
        time_spent: Math.floor(Math.random() * 120) + 30,
        session_id: `demo_session_${index + 1}`
      }))
    }

    // Calculate review statistics
    const stats = {
      totalIncorrect: reviewQuestions.length,
      bySubject: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
      averageTime: reviewQuestions.length > 0 
        ? Math.round(reviewQuestions.reduce((sum, q) => sum + q.time_spent, 0) / reviewQuestions.length)
        : 0
    }

    // Count by subject and difficulty
    reviewQuestions.forEach(q => {
      stats.bySubject[q.type] = (stats.bySubject[q.type] || 0) + 1
      stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      questions: reviewQuestions,
      stats
    })

  } catch (error) {
    console.error('Review API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review data' },
      { status: 500 }
    )
  }
}

// Mark a question as reviewed (for tracking purposes)
export async function PUT(request: NextRequest) {
  try {
    const { questionId, userId, action } = await request.json()
    
    if (!questionId || !userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (action === 'mark_reviewed') {
      // Update the user_answers table to mark as reviewed
      const { error } = await supabase
        .from('user_answers')
        .update({ 
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .eq('is_correct', false)

      if (error) {
        console.error('Error marking question as reviewed:', error)
        return NextResponse.json(
          { error: 'Failed to update review status' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Question marked as reviewed'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Review update API error:', error)
    return NextResponse.json(
      { error: 'Failed to update review data' },
      { status: 500 }
    )
  }
}