import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { questionBank, filterQuestions, getQuestionStats } from '@/lib/question-bank'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Get questions with optimal dynamic/static mixing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'vocabulary' | 'reading' | 'math' | 'writing' | null
    const difficulty = searchParams.get('difficulty') as 'easy' | 'medium' | 'hard' | null
    const topic = searchParams.get('topic')
    const limit = parseInt(searchParams.get('limit') || '10')
    const dynamic = searchParams.get('dynamic') === 'true' // 强制使用动态生成

    console.log('Questions API called with filters:', { type, difficulty, topic, limit, dynamic })

    let questions: any[] = []
    let source = 'database'

    // 1. 优先尝试从数据库获取真实题目
    if (!dynamic) {
      try {
        let query = supabase.from('questions').select('*')
        
        if (type) query = query.eq('type', type)
        if (difficulty) query = query.eq('difficulty', difficulty)
        if (topic) query = query.contains('tags', [topic])
        
        const { data: dbQuestions, error: dbError } = await query
          .limit(limit * 2)
          .order('created_at', { ascending: false })

        if (!dbError && dbQuestions && dbQuestions.length > 0) {
          questions = shuffleArray(dbQuestions).slice(0, limit)
          console.log(`Retrieved ${questions.length} questions from database`)
        }
      } catch (dbError) {
        console.error('Database query failed:', dbError)
      }
    }

    // 2. 如果数据库题目不够，使用动态生成系统
    if (questions.length < limit) {
      const remainingCount = limit - questions.length
      
      try {
        console.log(`Generating ${remainingCount} dynamic questions...`)
        const dynamicResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/questions/dynamic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'system',
            questionType: type || 'mixed',
            count: remainingCount,
            difficulty: difficulty || 'mixed'
          })
        })

        if (dynamicResponse.ok) {
          const dynamicData = await dynamicResponse.json()
          if (dynamicData.success && dynamicData.questions) {
            questions = [...questions, ...dynamicData.questions]
            source = questions.length === dynamicData.questions.length ? 'dynamic' : 'hybrid'
            console.log(`Added ${dynamicData.questions.length} dynamic questions`)
          }
        }
      } catch (dynamicError) {
        console.error('Dynamic generation failed:', dynamicError)
      }
    }

    // 3. 最终回退到静态题库
    if (questions.length < limit) {
      const remainingCount = limit - questions.length
      const staticQuestions = filterQuestions(type || undefined, difficulty || undefined, topic || undefined, remainingCount)
      questions = [...questions, ...staticQuestions]
      source = questions.length === staticQuestions.length ? 'static' : 'hybrid'
      console.log(`Added ${staticQuestions.length} static questions as fallback`)
    }

    // 4. 最终处理
    questions = shuffleArray(questions).slice(0, limit)

    return NextResponse.json({
      success: true,
      questions: questions.map(q => ({
        id: q.id,
        type: q.type,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer || q.correctAnswer,
        explanation: q.explanation,
        passage: q.passage,
        tags: q.tags || [],
        topic: q.topic || q.type,
        time_limit: q.time_limit || 90
      })),
      total: questions.length,
      stats: getQuestionStats(),
      filters: { type, difficulty, topic, limit, dynamic },
      metadata: {
        source,
        generatedAt: new Date().toISOString(),
        isDynamic: source !== 'static'
      }
    })

  } catch (error) {
    console.error('Questions API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { question, type, options, correct_answer, explanation, difficulty, topic, tags, time_limit, passage } = await request.json()
    
    if (!question || !type || !options || !correct_answer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Try to save to database first
    try {
      const { data: dbQuestion, error: dbError } = await supabase
        .from('questions')
        .insert([{
          type,
          difficulty: difficulty || 'medium',
          question,
          options,
          correct_answer,
          explanation: explanation || '',
          tags: tags || [topic || type],
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (!dbError && dbQuestion) {
        return NextResponse.json({
          success: true,
          question: dbQuestion,
          message: 'Question saved to database successfully',
          storage: 'database'
        })
      }
    } catch (dbError) {
      console.error('Database save failed:', dbError)
    }

    // Fallback to in-memory storage
    const newQuestion = {
      id: `custom_${Date.now()}`,
      question,
      type,
      options,
      correct_answer,
      explanation: explanation || '',
      difficulty: difficulty || 'medium',
      topic: topic || type,
      tags: tags || [],
      time_limit: time_limit || 90,
      passage: passage || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    questionBank.push(newQuestion)

    return NextResponse.json({
      success: true,
      question: newQuestion,
      message: 'Question created successfully (in-memory)',
      total_questions: questionBank.length,
      storage: 'memory'
    })

  } catch (error) {
    console.error('Create question API error:', error)
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    )
  }
}

// 数组随机打乱工具函数
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}