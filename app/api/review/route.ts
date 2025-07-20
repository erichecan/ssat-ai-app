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

    // Get all incorrect answers from user_answers table
    const { data: incorrectAnswers, error } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_id', userId)
      .eq('is_correct', false)
      .order('answered_at', { ascending: false })
      .limit(50) // Limit to recent 50 incorrect answers

    if (error) {
      console.error('Error fetching incorrect answers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch review data' },
        { status: 500 }
      )
    }

    // Transform the data to match review format
    const reviewQuestions: ReviewQuestion[] = incorrectAnswers.map(answer => {
      // Find the original question from question bank
      const originalQuestion = questionBank.find(q => q.id === answer.question_id)
      
      if (!originalQuestion) {
        // Handle case where question is not found
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
    }).filter(q => q.question !== 'Question not found') // Filter out questions not found

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