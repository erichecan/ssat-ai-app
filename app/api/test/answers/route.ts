import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface UserAnswer {
  id: string
  user_id: string
  question_id: string
  selected_answer: string
  correct_answer: string
  is_correct: boolean
  time_spent: number // seconds
  session_id: string
  answered_at: string
}

// Database table structure for user answers
// This should match your Supabase table schema

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      questionId, 
      selectedAnswer, 
      correctAnswer, 
      timeSpent,
      sessionId 
    } = await request.json()
    
    if (!userId || !questionId || !selectedAnswer || !correctAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const isCorrect = selectedAnswer === correctAnswer
    
    const userAnswer = {
      user_id: userId,
      question_id: questionId,
      selected_answer: selectedAnswer,
      correct_answer: correctAnswer,
      is_correct: isCorrect,
      time_spent: timeSpent || 0,
      session_id: sessionId || `session_${Date.now()}`,
      answered_at: new Date().toISOString()
    }

    // Save to Supabase database
    const { data: savedAnswer, error } = await supabase
      .from('user_answers')
      .insert(userAnswer)
      .select()
      .single()

    if (error) {
      console.error('Error saving answer:', error)
      return NextResponse.json(
        { error: 'Failed to save answer' },
        { status: 500 }
      )
    }

    // Calculate user performance for this session
    const { data: sessionAnswers, error: sessionError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('session_id', userAnswer.session_id)

    if (sessionError) {
      console.error('Error fetching session answers:', sessionError)
    }

    const correctCount = sessionAnswers?.filter(a => a.is_correct).length || 0
    const totalAnswers = sessionAnswers?.length || 0
    const accuracy = totalAnswers > 0 ? (correctCount / totalAnswers) * 100 : 0
    const averageTime = totalAnswers > 0 ? 
      sessionAnswers!.reduce((sum, a) => sum + a.time_spent, 0) / totalAnswers : 0

    return NextResponse.json({
      success: true,
      answer: savedAnswer,
      sessionStats: {
        totalAnswered: totalAnswers,
        correctCount,
        accuracy: Math.round(accuracy),
        averageTime: Math.round(averageTime)
      }
    })

  } catch (error) {
    console.error('Answer recording API error:', error)
    return NextResponse.json(
      { error: 'Failed to record answer' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const sessionId = searchParams.get('sessionId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Filter answers by user and optionally by session from database
    let query = supabase
      .from('user_answers')
      .select('*')
      .eq('user_id', userId)
    
    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    const { data: userAnswers, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching user answers:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch answers' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const totalAnswered = userAnswers?.length || 0
    const correctCount = userAnswers?.filter(a => a.is_correct).length || 0
    const accuracy = totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0
    const averageTime = totalAnswered > 0 ? 
      userAnswers!.reduce((sum, a) => sum + a.time_spent, 0) / totalAnswered : 0

    // Group by topic/type if needed (simplified for now)
    const byTopic = userAnswers?.reduce((acc, answer) => {
      const topic = 'general' // placeholder - could join with questions table
      if (!acc[topic]) {
        acc[topic] = { total: 0, correct: 0 }
      }
      acc[topic].total++
      if (answer.is_correct) acc[topic].correct++
      return acc
    }, {} as Record<string, { total: number, correct: number }>) || {}

    return NextResponse.json({
      success: true,
      answers: userAnswers,
      stats: {
        totalAnswered,
        correctCount,
        accuracy: Math.round(accuracy),
        averageTime: Math.round(averageTime),
        byTopic
      }
    })

  } catch (error) {
    console.error('Get answers API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch answers' },
      { status: 500 }
    )
  }
}