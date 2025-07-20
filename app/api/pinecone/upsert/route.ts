import { NextRequest, NextResponse } from 'next/server'
import { upsertKnowledge } from '@/lib/pinecone'

export async function POST(request: NextRequest) {
  try {
    const { records } = await request.json()
    
    if (!records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: 'Invalid records data' },
        { status: 400 }
      )
    }
    
    await upsertKnowledge(records)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in Pinecone upsert API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 