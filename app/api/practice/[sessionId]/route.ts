import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { questionBank, filterQuestions } from '@/lib/question-bank'

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
    
    // 对于practice开头的sessionId，创建临时session使用AI生成的问题
    if (sessionId.startsWith('practice_')) {
      console.log('Creating temporary session for:', sessionId)
      
      let questions = []
      
      try {
        // 1. 首先尝试生成基于flashcard的重点词汇题目
        console.log('Attempting to generate vocabulary-focused questions...')
        const vocabResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/questions/vocabulary-focused`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'demo-user-123',
            count: 6 // 6道重点词汇题
          })
        })
        
        let vocabQuestions: any[] = []
        if (vocabResponse.ok) {
          const vocabData = await vocabResponse.json()
          if (vocabData.success && vocabData.questions) {
            vocabQuestions = vocabData.questions
            console.log('Generated', vocabQuestions.length, 'vocabulary-focused questions')
          }
        }

        // 2. 再尝试使用AI生成其他类型问题
        console.log('Attempting to generate AI questions for mixed topics...')
        const generateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'demo-user-123',
            questionType: 'mixed',
            count: 4 // 4道其他题目
          })
        })
        
        let aiQuestions: any[] = []
        if (generateResponse.ok) {
          const generateData = await generateResponse.json()
          if (generateData.success && generateData.questions) {
            aiQuestions = generateData.questions
            console.log('Successfully generated', aiQuestions.length, 'AI questions')
          }
        }

        // 3. 合并vocabulary-focused和AI题目
        questions = [...vocabQuestions, ...aiQuestions]
        
        // 4. 如果题目不够，用静态question bank补充
        if (questions.length < 10) {
          const remainingCount = 10 - questions.length
          const staticQuestions = filterQuestions(undefined, 'medium', undefined, remainingCount)
          questions.push(...staticQuestions)
          console.log('Added', staticQuestions.length, 'static questions as fallback')
        }

        // 5. 随机打乱题目顺序
        questions = questions.sort(() => Math.random() - 0.5).slice(0, 10)
        console.log('Final question set:', questions.length, 'questions')
        
      } catch (aiError) {
        console.log('Advanced question generation failed, falling back to question bank:', aiError)
        // 完全回退到静态question bank
        questions = filterQuestions(undefined, 'medium', undefined, 10)
        console.log('Using fallback question bank with', questions.length, 'questions')
      }
      
      session = {
        id: sessionId,
        user_id: 'temp_user',
        session_type: 'adaptive',
        settings: {
          subjects: ['all'],
          difficulty: 'medium',
          question_count: questions.length,
          time_limit: undefined
        },
        questions: questions,
        status: 'active',
        current_question_index: 0,
        score: 0,
        start_time: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
      console.log('Created temporary session with', questions.length, 'questions')
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
    
    // 对于临时session，我们需要重新加载并更新状态
    if (sessionId.startsWith('practice_')) {
      console.log('Processing temporary session update for:', sessionId)
      
      // 重新生成session来获取当前状态
      const questions = filterQuestions(undefined, 'medium', undefined, 10)
      
      let currentIndex = 0
      let score = 0
      
      if (action === 'answer') {
        // 简单的内存状态管理：基于sessionId生成一致的状态
        const sessionHash = sessionId.split('_')[1] || '0'
        const baseIndex = parseInt(sessionHash.slice(-1)) || 0
        currentIndex = Math.min(baseIndex + 1, questions.length - 1)
        
        // 检查答案是否正确
        const currentQuestion = questions[Math.min(baseIndex, questions.length - 1)]
        const isCorrect = currentQuestion && answer === currentQuestion.correct_answer
        if (isCorrect) {
          score = 1
        }
        
        // 保存答题记录到数据库（用于review功能）
        if (currentQuestion) {
          try {
            await supabase
              .from('user_answers')
              .insert({
                user_id: 'demo-user-123',
                question_id: currentQuestion.id,
                session_id: sessionId,
                selected_answer: answer,
                user_answer: answer,
                correct_answer: currentQuestion.correct_answer,
                is_correct: isCorrect,
                time_spent: timeSpent || 0,
                question_text: currentQuestion.question,
                question_type: currentQuestion.type,
                difficulty: currentQuestion.difficulty,
                options: JSON.stringify(currentQuestion.options),
                explanation: currentQuestion.explanation,
                passage_text: currentQuestion.passage,
                answered_at: new Date().toISOString()
              })
            
            console.log('Answer record saved to database')
          } catch (saveError) {
            console.error('Failed to save answer record:', saveError)
            // 不阻断答题流程，只是记录错误
          }
        }
        
        console.log('Answer processed:', { answer, currentQuestion: currentQuestion?.correct_answer, isCorrect: score > 0 })
      }
      
      // 获取下一题
      let nextQuestion = null
      const status = currentIndex >= questions.length - 1 ? 'completed' : 'active'
      
      if (status === 'active') {
        nextQuestion = questions[currentIndex]
      }
      
      return NextResponse.json({
        success: true,
        session: {
          id: sessionId,
          user_id: 'temp_user',
          session_type: 'adaptive',
          settings: {
            subjects: ['all'],
            difficulty: 'medium',
            question_count: questions.length,
            time_limit: undefined
          },
          questions: questions,
          status: status,
          current_question_index: currentIndex,
          score: score,
          start_time: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        nextQuestion,
        progress: {
          current: currentIndex + 1,
          total: questions.length,
          percentage: Math.round(((currentIndex + 1) / questions.length) * 100)
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