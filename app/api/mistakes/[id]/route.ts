import { NextRequest, NextResponse } from 'next/server'
import { mistakeSystem } from '@/lib/mistakes'

// 修复Next.js 15的API路由参数类型 - 更新于 2024-01-20 23:45:00
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, masteryLevel, notes, tags } = await request.json()
    const { id } = await context.params
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    if (masteryLevel !== undefined) {
      await mistakeSystem.updateMasteryLevel(userId, id, masteryLevel)
    }
    
    if (notes !== undefined) {
      await mistakeSystem.addNotes(userId, id, notes)
    }
    
    if (tags !== undefined) {
      await mistakeSystem.addTags(userId, id, tags)
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const { id } = await context.params
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    await mistakeSystem.removeMistake(userId, id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting mistake:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}