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

    // 从knowledge_base表获取用户上传的文件
    const { data: files, error } = await supabase
      .from('knowledge_base')
      .select(`
        id,
        title,
        content,
        topic,
        difficulty,
        type,
        tags,
        source,
        created_at,
        updated_at
      `)
      .contains('tags', [userId])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching files:', error)
      return NextResponse.json(
        { error: 'Failed to fetch files' },
        { status: 500 }
      )
    }

    // 按文件名分组，因为一个文件可能被分成多个chunks
    const fileGroups: { [key: string]: any[] } = {}
    
    files?.forEach(file => {
      const fileName = file.source || 'Unknown File'
      if (!fileGroups[fileName]) {
        fileGroups[fileName] = []
      }
      fileGroups[fileName].push(file)
    })

    // 为每个文件创建汇总信息
    const fileSummaries = Object.entries(fileGroups).map(([fileName, chunks]) => {
      const totalChunks = chunks.length
      const totalWords = chunks.reduce((sum, chunk) => {
        return sum + (chunk.content?.split(/\s+/).length || 0)
      }, 0)
      
      const firstChunk = chunks[0]
      const lastChunk = chunks[chunks.length - 1]
      
      return {
        fileName,
        totalChunks,
        totalWords,
        topic: firstChunk.topic,
        difficulty: firstChunk.difficulty,
        type: firstChunk.type,
        uploadedAt: firstChunk.created_at,
        lastUpdated: lastChunk.updated_at,
        chunks: chunks.map(chunk => ({
          id: chunk.id,
          title: chunk.title,
          preview: chunk.content?.substring(0, 100) + '...',
          wordCount: chunk.content?.split(/\s+/).length || 0
        }))
      }
    })

    console.log(`Found ${fileSummaries.length} uploaded files for user ${userId}`)

    return NextResponse.json({
      success: true,
      files: fileSummaries,
      totalFiles: fileSummaries.length,
      totalChunks: files?.length || 0
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