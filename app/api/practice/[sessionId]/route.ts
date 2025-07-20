import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { questionBank } from '@/lib/question-bank'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Get specific practice session with current question
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    
    const { data: session, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error || !session) {
      return NextResponse.json(
        { error: 'Practice session not found' },
        { status: 404 }
      )
    }

    // Get current question
    const currentQuestionId = session.questions[session.current_question_index]
    const currentQuestion = questionBank.find(q => q.id === currentQuestionId)

    if (!currentQuestion) {
      return NextResponse.json(
        { error: 'Current question not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      session,
      currentQuestion,
      progress: {
        current: session.current_question_index + 1,
        total: session.questions.length,
        percentage: Math.round(((session.current_question_index + 1) / session.questions.length) * 100)
      }
    })

  } catch (error) {
    console.error('Get practice session API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch practice session' },
      { status: 500 }
    )
  }
}

// Update practice session (progress, score, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    const { action, answer, timeSpent } = await request.json()
    
    // Get current session
    const { data: session, error: fetchError } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'Practice session not found' },
        { status: 404 }
      )
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (action === 'answer') {
      // Record answer and move to next question
      const currentQuestionId = session.questions[session.current_question_index]
      const currentQuestion = questionBank.find(q => q.id === currentQuestionId)
      
      if (currentQuestion) {
        const isCorrect = answer === currentQuestion.correct_answer
        
        // Update score
        updateData.score = isCorrect ? session.score + 1 : session.score
        
        // Move to next question
        const nextIndex = session.current_question_index + 1
        updateData.current_question_index = nextIndex
        
        // Check if session is complete
        if (nextIndex >= session.questions.length) {
          updateData.status = 'completed'
          updateData.end_time = new Date().toISOString()
        }

        // Record the answer in user_answers table
        await supabase
          .from('user_answers')
          .insert({
            user_id: session.user_id,
            question_id: currentQuestionId,
            selected_answer: answer,
            correct_answer: currentQuestion.correct_answer,
            is_correct: isCorrect,
            time_spent: timeSpent || 0,
            session_id: `practice_${sessionId}`,
            answered_at: new Date().toISOString()
          })
      }
    } else if (action === 'pause') {
      updateData.status = 'paused'
    } else if (action === 'resume') {
      updateData.status = 'active'
    } else if (action === 'complete') {
      updateData.status = 'completed'
      updateData.end_time = new Date().toISOString()
    }

    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('practice_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating practice session:', updateError)
      return NextResponse.json(
        { error: 'Failed to update practice session' },
        { status: 500 }
      )
    }

    // Get next question if session is still active
    let nextQuestion = null
    if (updatedSession.status === 'active' && updatedSession.current_question_index < updatedSession.questions.length) {
      const nextQuestionId = updatedSession.questions[updatedSession.current_question_index]
      nextQuestion = questionBank.find(q => q.id === nextQuestionId)
    }

    return NextResponse.json({
      success: true,
      session: updatedSession,
      nextQuestion,
      progress: {
        current: updatedSession.current_question_index + 1,
        total: updatedSession.questions.length,
        percentage: Math.round(((updatedSession.current_question_index + 1) / updatedSession.questions.length) * 100)
      }
    })

  } catch (error) {
    console.error('Update practice session API error:', error)
    return NextResponse.json(
      { error: 'Failed to update practice session' },
      { status: 500 }
    )
  }
}

// Delete practice session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    
    const { error } = await supabase
      .from('practice_sessions')
      .delete()
      .eq('id', sessionId)

    if (error) {
      console.error('Error deleting practice session:', error)
      return NextResponse.json(
        { error: 'Failed to delete practice session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Practice session deleted successfully'
    })

  } catch (error) {
    console.error('Delete practice session API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete practice session' },
      { status: 500 }
    )
  }
}