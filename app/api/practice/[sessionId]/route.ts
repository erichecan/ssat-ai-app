import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { questionBank, filterQuestions } from '@/lib/question-bank'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 为global对象添加类型声明
declare global {
  var temporarySessions: Record<string, {
    currentIndex: number
    score: number
    questions: any[]
    questionCount: number
    startTime: string
    endTime?: string
    status: string
  }> | undefined
}

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
      
      // 检查是否已经有缓存的session
      let sessionState = global.temporarySessions?.[sessionId]
      
      if (!sessionState) {
        // 创建新的session状态
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
          
          // 4. 如果题目不够，用静态question bank补充 - 修复题目数量问题
          const targetCount = 20 // 确保生成20道题
          if (questions.length < targetCount) {
            const remainingCount = targetCount - questions.length
            console.log(`Need ${remainingCount} more questions to reach target of ${targetCount}`)
            
            // 尝试从多个来源获取题目
            let additionalQuestions: any[] = []
            
            // 首先尝试从question bank获取
            const staticQuestions = filterQuestions(undefined, 'medium', undefined, remainingCount + 5) // 多获取一些以防重复
            additionalQuestions.push(...staticQuestions)
            
            // 如果还不够，尝试生成更多vocabulary题目
            if (additionalQuestions.length < remainingCount) {
              const moreVocabCount = remainingCount - additionalQuestions.length
              const moreVocabQuestions = filterQuestions('vocabulary', 'medium', undefined, moreVocabCount)
              additionalQuestions.push(...moreVocabQuestions)
            }
            
            // 去重处理
            const existingIds = new Set(questions.map(q => q.id))
            const uniqueAdditional = additionalQuestions.filter(q => !existingIds.has(q.id))
            
            questions.push(...uniqueAdditional)
            console.log(`Added ${uniqueAdditional.length} additional questions from static bank`)
          }

          // 5. 随机打乱题目顺序，确保达到目标数量
          questions = questions.sort(() => Math.random() - 0.5).slice(0, targetCount)
          console.log(`Final question set: ${questions.length} questions (target: ${targetCount})`)
          
          // 6. 如果仍然不够，警告并补充
          if (questions.length < targetCount) {
            console.warn(`Warning: Only ${questions.length} questions available, but ${targetCount} were requested`)
            const finalRemaining = targetCount - questions.length
            const emergencyQuestions = filterQuestions(undefined, undefined, undefined, finalRemaining + 10)
            const emergencyIds = new Set(questions.map(q => q.id))
            const uniqueEmergency = emergencyQuestions.filter(q => !emergencyIds.has(q.id))
            questions.push(...uniqueEmergency.slice(0, finalRemaining))
            console.log(`Added ${Math.min(uniqueEmergency.length, finalRemaining)} emergency questions`)
          }
          
        } catch (aiError) {
          console.log('Advanced question generation failed, falling back to question bank:', aiError)
          // 完全回退到静态question bank
          const targetCount = 20
          questions = filterQuestions(undefined, 'medium', undefined, targetCount)
          console.log('Using fallback question bank with', questions.length, 'questions')
        }
        
        // 创建并缓存session状态
        sessionState = {
          currentIndex: 0,
          score: 0,
          questions: questions,
          questionCount: questions.length,
          startTime: new Date().toISOString(),
          status: 'active'
        }
        
        if (!global.temporarySessions) {
          global.temporarySessions = {}
        }
        global.temporarySessions[sessionId] = sessionState
        console.log('Created and cached temporary session with', questions.length, 'questions')
      } else {
        console.log('Using cached session state with', sessionState.questions.length, 'questions')
      }
      
      session = {
        id: sessionId,
        user_id: 'temp_user',
        session_type: 'adaptive',
        settings: {
          subjects: ['all'],
          difficulty: 'medium',
          question_count: sessionState.questionCount,
          time_limit: undefined
        },
        questions: sessionState.questions,
        status: sessionState.status || (sessionState.currentIndex >= sessionState.questionCount ? 'completed' : 'active'),
        current_question_index: sessionState.currentIndex,
        score: sessionState.score,
        start_time: sessionState.startTime,
        end_time: sessionState.endTime,
        created_at: new Date().toISOString()
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
    
    // 对于临时session，我们需要重新加载session来获取一致的状态
    if (sessionId.startsWith('practice_')) {
      console.log('Processing temporary session update for:', sessionId)
      
      // 获取存储在内存/localStorage中的session状态，或重新生成相同的questions
      let sessionState = global.temporarySessions?.[sessionId]
      
      if (!sessionState) {
        // 如果没有缓存状态，重新生成相同的session（保持一致性）
        let questions = []
        
        try {
          // 重新生成与GET请求相同的题目组合
          const vocabResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/questions/vocabulary-focused`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: 'demo-user-123',
              count: 6
            })
          })
          
          let vocabQuestions: any[] = []
          if (vocabResponse.ok) {
            const vocabData = await vocabResponse.json()
            if (vocabData.success && vocabData.questions) {
              vocabQuestions = vocabData.questions
            }
          }

          const generateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: 'demo-user-123',
              questionType: 'mixed',
              count: 4
            })
          })
          
          let aiQuestions: any[] = []
          if (generateResponse.ok) {
            const generateData = await generateResponse.json()
            if (generateData.success && generateData.questions) {
              aiQuestions = generateData.questions
            }
          }

          questions = [...vocabQuestions, ...aiQuestions]
          
          // 修复题目数量问题 - 与GET部分保持一致
          const targetCount = 20
          if (questions.length < targetCount) {
            const remainingCount = targetCount - questions.length
            console.log(`PUT: Need ${remainingCount} more questions to reach target of ${targetCount}`)
            
            // 尝试从多个来源获取题目
            let additionalQuestions: any[] = []
            
            // 首先尝试从question bank获取
            const staticQuestions = filterQuestions(undefined, 'medium', undefined, remainingCount + 5)
            additionalQuestions.push(...staticQuestions)
            
            // 如果还不够，尝试生成更多vocabulary题目
            if (additionalQuestions.length < remainingCount) {
              const moreVocabCount = remainingCount - additionalQuestions.length
              const moreVocabQuestions = filterQuestions('vocabulary', 'medium', undefined, moreVocabCount)
              additionalQuestions.push(...moreVocabQuestions)
            }
            
            // 去重处理
            const existingIds = new Set(questions.map(q => q.id))
            const uniqueAdditional = additionalQuestions.filter(q => !existingIds.has(q.id))
            
            questions.push(...uniqueAdditional)
            console.log(`PUT: Added ${uniqueAdditional.length} additional questions`)
          }

          questions = questions.sort(() => Math.random() - 0.5).slice(0, targetCount)
          console.log(`PUT: Final question set: ${questions.length} questions (target: ${targetCount})`)
          
          // 如果仍然不够，警告并补充
          if (questions.length < targetCount) {
            console.warn(`PUT: Warning: Only ${questions.length} questions available, but ${targetCount} were requested`)
            const finalRemaining = targetCount - questions.length
            const emergencyQuestions = filterQuestions(undefined, undefined, undefined, finalRemaining + 10)
            const emergencyIds = new Set(questions.map(q => q.id))
            const uniqueEmergency = emergencyQuestions.filter(q => !emergencyIds.has(q.id))
            questions.push(...uniqueEmergency.slice(0, finalRemaining))
            console.log(`PUT: Added ${Math.min(uniqueEmergency.length, finalRemaining)} emergency questions`)
          }
          
        } catch (error) {
          questions = filterQuestions(undefined, 'medium', undefined, 20)
        }
        
        sessionState = {
          currentIndex: 0,
          score: 0,
          questions: questions,
          questionCount: questions.length,
          startTime: new Date().toISOString(),
          status: 'active'
        }
        
        // 简单的内存缓存（生产环境应该使用Redis等）
        if (!global.temporarySessions) {
          global.temporarySessions = {}
        }
        global.temporarySessions[sessionId] = sessionState
      }
      
      let { currentIndex, score, questions, questionCount } = sessionState
      
      if (action === 'answer') {
        // 检查答案是否正确
        const currentQuestion = questions[currentIndex]
        const isCorrect = currentQuestion && answer === currentQuestion.correct_answer
        if (isCorrect) {
          score += 1
        }
        
        // 移动到下一题
        currentIndex += 1
        
        // 更新缓存状态
        sessionState.currentIndex = currentIndex
        sessionState.score = score
        if (!global.temporarySessions) {
          global.temporarySessions = {}
        }
        global.temporarySessions[sessionId] = sessionState
        
        console.log('Answer processed:', { answer, currentQuestion: currentQuestion?.correct_answer, isCorrect })
      }
      
      // 保存答题记录到数据库（用于review功能）
      if (action === 'answer' && questions[currentIndex - 1]) {
        const answeredQuestion = questions[currentIndex - 1]
        try {
          await supabase
            .from('user_answers')
            .insert({
              user_id: 'demo-user-123',
              question_id: answeredQuestion.id,
              session_id: sessionId,
              selected_answer: answer,
              user_answer: answer,
              correct_answer: answeredQuestion.correct_answer,
              is_correct: answeredQuestion.correct_answer === answer,
              time_spent: timeSpent || 0,
              question_text: answeredQuestion.question,
              question_type: answeredQuestion.type,
              difficulty: answeredQuestion.difficulty,
              options: JSON.stringify(answeredQuestion.options),
              explanation: answeredQuestion.explanation,
              passage_text: answeredQuestion.passage,
              answered_at: new Date().toISOString()
            })
          
          console.log('Answer record saved to database')
        } catch (saveError) {
          console.error('Failed to save answer record:', saveError)
        }
      }
      
      // 获取下一题
      let nextQuestion = null
      const status = currentIndex >= questions.length ? 'completed' : 'active'
      
      if (status === 'active' && currentIndex < questions.length) {
        nextQuestion = questions[currentIndex]
      }
      
      // 如果session完成，添加结束时间
      if (status === 'completed' && !sessionState.endTime) {
        sessionState.endTime = new Date().toISOString()
        sessionState.status = 'completed'
        if (!global.temporarySessions) {
          global.temporarySessions = {}
        }
        global.temporarySessions[sessionId] = sessionState
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
            question_count: questionCount,
            time_limit: undefined
          },
          questions: questions,
          status: status,
          current_question_index: currentIndex,
          score: score,
          start_time: sessionState.startTime || new Date().toISOString(),
          end_time: sessionState.endTime,
          created_at: new Date().toISOString()
        },
        nextQuestion,
        progress: {
          current: currentIndex,
          total: questionCount,
          percentage: Math.round((currentIndex / questionCount) * 100)
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