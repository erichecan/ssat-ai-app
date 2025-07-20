import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { questionBank, filterQuestions, getQuestionStats } from '@/lib/question-bank'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // vocabulary, reading, math, writing
    const difficulty = searchParams.get('difficulty') // easy, medium, hard
    const topic = searchParams.get('topic') // specific topic
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Use the comprehensive question bank
    const questions = filterQuestions(type || undefined, difficulty || undefined, topic || undefined, limit)
    
    return NextResponse.json({
      success: true,
      questions,
      total: questions.length,
      stats: getQuestionStats(),
      filters: { type, difficulty, topic, limit }
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

    // Create new question object
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

    // Add to question bank (in production, this would save to database)
    questionBank.push(newQuestion)

    return NextResponse.json({
      success: true,
      question: newQuestion,
      message: 'Question created successfully',
      total_questions: questionBank.length
    })

  } catch (error) {
    console.error('Create question API error:', error)
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    )
  }
}