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

    console.log('Creating practice session for user:', userId, 'type:', sessionType, 'subjects:', subjects)
    
    let questions: any[] = []
    
    if (sessionType === 'adaptive') {
      const easyQuestions = filterQuestions(undefined, 'easy', undefined, Math.floor((questionCount || 10) * 0.3))
      const mediumQuestions = filterQuestions(undefined, 'medium', undefined, Math.floor((questionCount || 10) * 0.5))
      const hardQuestions = filterQuestions(undefined, 'hard', undefined, Math.floor((questionCount || 10) * 0.2))
      
      questions = [...easyQuestions, ...mediumQuestions, ...hardQuestions]
        .sort(() => Math.random() - 0.5)
        .slice(0, questionCount || 10)
    } else {
      // Custom Practice: 优先使用AI生成题目
      const targetCount = questionCount || 10
      
      try {
        console.log('Attempting to generate', targetCount, 'AI questions for custom practice...')
        
        // 调用AI生成题目 API
        const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            questionType: 'mixed',
            count: targetCount
          })
        })
        
        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          if (aiData.success && aiData.questions && aiData.questions.length > 0) {
            // 将AI生成的问题转换为需要的格式
            questions = aiData.questions.map((q: any) => ({
              id: q.id,
              type: q.type,
              question: q.question,
              options: Array.isArray(q.options) ? q.options : Object.values(q.options || {}),
              correct_answer: q.correctAnswer || q.correct_answer,
              explanation: q.explanation,
              difficulty: q.difficulty || 'medium',
              topic: q.metadata?.keyConcept || q.type,
              passage: q.passage,
              tags: q.tags || [q.type],
              time_limit: 90,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }))
            
            console.log(`Successfully generated ${questions.length} AI questions for custom practice`)
          } else {
            throw new Error('AI API returned empty or invalid questions')
          }
        } else {
          throw new Error(`AI API failed with status: ${aiResponse.status}`)
        }
      } catch (aiError) {
        console.warn('AI generation failed, falling back to static questions:', aiError)
        
        // 如果AI生成失败，使用静态题目库作为备用 - Enhanced fallback logic (2024-12-19 17:05:00)
        const subjectTypeMap: Record<string, string> = {
          'Reading Comprehension': 'reading',
          'Math': 'math', 
          'Vocabulary': 'vocabulary',
          'Essay Writing': 'writing'
        }
        
        if (subjects && subjects.length > 0) {
          const questionsPerSubject = Math.ceil(targetCount / subjects.length)
          
          subjects.forEach((subject: string) => {
            const questionType = subjectTypeMap[subject]
            if (questionType) {
              const subjectQuestions = filterQuestions(
                questionType,
                difficulty || 'medium',
                undefined,
                questionsPerSubject
              )
              questions.push(...subjectQuestions)
            }
          })
        } else {
          // 如果没有指定科目，使用所有可用题目
          questions = filterQuestions(undefined, difficulty || 'medium', undefined, targetCount)
        }
        
        // 去重处理
        const uniqueQuestions = Array.from(
          new Map(questions.map(q => [q.id, q])).values()
        )
        
        // 如果题目仍然不够，添加更多题目不考虑科目限制
        if (uniqueQuestions.length < targetCount) {
          const existingIds = new Set(uniqueQuestions.map(q => q.id))
          const allQuestions = filterQuestions(undefined, undefined, undefined, 100)
          const additionalQuestions = allQuestions
            .filter(q => !existingIds.has(q.id))
            .slice(0, targetCount - uniqueQuestions.length)
          uniqueQuestions.push(...additionalQuestions)
        }
        
        // 如果仍然不够，重复使用现有题目（确保至少达到目标数量）
        if (uniqueQuestions.length < targetCount) {
          const needed = targetCount - uniqueQuestions.length
          const existingQuestions = [...uniqueQuestions]
          for (let i = 0; i < needed; i++) {
            const originalQuestion = existingQuestions[i % existingQuestions.length]
            const duplicatedQuestion = {
              ...originalQuestion,
              id: `${originalQuestion.id}_duplicate_${i}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            uniqueQuestions.push(duplicatedQuestion)
          }
        }
        
        // 随机排序
        const shuffleArray = (array: any[]) => {
          const result = [...array]
          for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[result[i], result[j]] = [result[j], result[i]]
          }
          return result
        }
        
        questions = shuffleArray(uniqueQuestions).slice(0, targetCount)
        console.log(`Fallback: Generated ${questions.length} static questions (target was ${targetCount})`)
      }
      
      console.log('Generated', questions.length, 'questions for custom practice (AI + fallback)')
    }

    // 确保至少有一些问题
    if (questions.length === 0) {
      console.error('No questions generated! Using fallback questions...')
      questions = filterQuestions(undefined, undefined, undefined, Math.min(questionCount || 10, 16))
    }
    
    // 如果仍然题目数量不足，警告用户
    if (questions.length < (questionCount || 10)) {
      console.warn(`Warning: Only ${questions.length} questions available, but ${questionCount || 10} were requested. Consider adding more questions to the question bank.`)
    }

    const sessionId = `practice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
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
      questions: questions,
      status: 'active',
      current_question_index: 0,
      score: 0,
      start_time: new Date().toISOString(),
      created_at: new Date().toISOString()
    }

    console.log('Practice session created successfully:', sessionId, 'with', questions.length, 'questions')

    return NextResponse.json({
      success: true,
      session,
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