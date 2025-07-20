import { NextRequest, NextResponse } from 'next/server'
import { ragSystem } from '@/lib/rag'

export async function POST(request: NextRequest) {
  try {
    const { userId, question, questionId } = await request.json()
    
    if (!userId || !question) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and question' },
        { status: 400 }
      )
    }
    
    const response = await ragSystem.askQuestion(userId, question, questionId)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in RAG API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 