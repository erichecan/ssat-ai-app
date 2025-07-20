import { NextRequest, NextResponse } from 'next/server'
import { mistakeSystem } from '@/lib/mistakes'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const masteryLevel = searchParams.get('masteryLevel')
    const topic = searchParams.get('topic')
    const difficulty = searchParams.get('difficulty')
    const limit = searchParams.get('limit')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    const filters = {
      ...(masteryLevel && { masteryLevel: parseInt(masteryLevel) }),
      ...(topic && { topic }),
      ...(difficulty && { difficulty }),
      ...(limit && { limit: parseInt(limit) })
    }
    
    const mistakes = await mistakeSystem.getMistakes(userId, filters)
    
    return NextResponse.json(mistakes)
  } catch (error) {
    console.error('Error fetching mistakes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, questionId, tags, userNotes } = await request.json()
    
    if (!userId || !questionId) {
      return NextResponse.json(
        { error: 'User ID and question ID are required' },
        { status: 400 }
      )
    }
    
    await mistakeSystem.addMistake(userId, questionId, tags, userNotes)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding mistake:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}