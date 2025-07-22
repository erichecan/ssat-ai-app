import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('Fetching uploaded files for user:', userId)

    // 暂时返回空列表，因为数据库配置问题
    // TODO: 修复数据库连接后恢复完整功能
    console.log('Database not configured, returning empty list')
    return NextResponse.json({
      success: true,
      files: [],
      totalFiles: 0,
      totalChunks: 0
    })

  } catch (error) {
    console.error('Error in uploaded files API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const fileName = searchParams.get('fileName')
    
    if (!userId || !fileName) {
      return NextResponse.json(
        { error: 'User ID and file name are required' },
        { status: 400 }
      )
    }

    console.log('Deleting file:', fileName, 'for user:', userId)

    // 删除该文件的所有chunks
    const { error } = await supabase
      .from('knowledge_base')
      .delete()
      .contains('tags', [userId])
      .eq('source', fileName)

    if (error) {
      console.error('Error deleting file:', error)
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      )
    }

    console.log('File deleted successfully:', fileName)

    return NextResponse.json({
      success: true,
      message: `File "${fileName}" deleted successfully`
    })

  } catch (error) {
    console.error('Error in file deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}