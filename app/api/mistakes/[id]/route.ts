import { NextRequest, NextResponse } from 'next/server'
import { mistakeSystem } from '@/lib/mistakes'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, masteryLevel, notes, tags } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    if (masteryLevel !== undefined) {
      await mistakeSystem.updateMasteryLevel(userId, params.id, masteryLevel)
    }
    
    if (notes !== undefined) {
      await mistakeSystem.addNotes(userId, params.id, notes)
    }
    
    if (tags !== undefined) {
      await mistakeSystem.addTags(userId, params.id, tags)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating mistake:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    await mistakeSystem.removeMistake(userId, params.id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting mistake:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}