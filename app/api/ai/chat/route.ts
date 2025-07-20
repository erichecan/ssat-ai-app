import { NextRequest, NextResponse } from 'next/server'
import { ragSystem } from '@/lib/rag'

export async function POST(request: NextRequest) {
  try {
    const { userId, message, questionId } = await request.json()
    
    if (!userId || !message) {
      return NextResponse.json(
        { error: 'User ID and message are required' },
        { status: 400 }
      )
    }
    
    const response = await ragSystem.askQuestion(userId, message, questionId)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in AI chat API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}