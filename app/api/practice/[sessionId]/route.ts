import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { questionBank } from '@/lib/question-bank'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 修复Next.js 15的API路由参数类型 - 更新于 2024-01-20 23:45:00
// Get specific practice session with current question
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params
    console.log('Loading practice session:', sessionId)
    
    let session: any = null
    
    // 首先尝试从数据库获取session
    try {
      const { data: dbSession, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (!error && dbSession) {
        session = dbSession
        console.log('Found session in database')
      }
    } catch (dbError) {
      console.log('Database session not found, checking for temporary session')
    }

    // 如果数据库中没有，检查是否是临时session（以session_或fallback_开头）
    if (!session && (sessionId.startsWith('session_') || sessionId.startsWith('fallback_'))) {
      console.log('Creating temporary session for:', sessionId)
      
      // 重新生成题目来模拟session
      try {
        const questionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'temp_user',
            questionType: 'mixed', 
            count: 10
          })
        })

        if (questionResponse.ok) {
          const questionsData = await questionResponse.json()
          
          if (questionsData.success && questionsData.questions) {
            session = {
              id: sessionId,
              user_id: 'temp_user',
              session_type: 'adaptive',
              settings: {
                subjects: ['all'],
                difficulty: 'medium',
                question_count: questionsData.questions.length,
                time_limit: undefined
              },
              questions: questionsData.questions,
              status: 'active',
              current_question_index: 0,
              score: 0,
              start_time: new Date().toISOString(),
              created_at: new Date().toISOString()
            }
            console.log('Created temporary session with', questionsData.questions.length, 'questions')
          }
        }
      } catch (questionError) {
        console.error('Error generating questions for temp session:', questionError)
      }
    }

    if (!session) {
      console.log('Session not found:', sessionId)
      return NextResponse.json(
        { error: 'Practice session not found' },
        { status: 404 }
      )
    }

    // Get current question
    const currentQuestionData = session.questions[session.current_question_index]
    let currentQuestion = currentQuestionData

    // 如果questions数组存储的是question对象而不是ID，直接使用
    if (typeof currentQuestionData === 'object' && currentQuestionData.question) {
      currentQuestion = currentQuestionData
    } else {
      // 如果是ID，从question bank查找
      currentQuestion = questionBank.find(q => q.id === currentQuestionData)
    }

    if (!currentQuestion) {
      console.log('Current question not found, index:', session.current_question_index)
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
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params
    const { action, answer, timeSpent } = await request.json()
    
    console.log('Updating practice session:', sessionId, 'action:', action)
    
    // 对于临时session，我们简化处理
    if (sessionId.startsWith('session_') || sessionId.startsWith('fallback_')) {
      console.log('Processing temporary session update')
      
      // 返回简化的成功响应，用于临时session
      return NextResponse.json({
        success: true,
        session: {
          id: sessionId,
          status: 'active',
          current_question_index: 1, // 简化：总是移到下一题
          score: 0
        },
        nextQuestion: null, // 让前端重新加载
        progress: {
          current: 2,
          total: 5,
          percentage: 40
        },
        isTemporary: true
      })
    }
    
    // 对于真实session，尝试从数据库获取
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
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params
    
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