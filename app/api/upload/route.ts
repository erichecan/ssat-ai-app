import { NextRequest, NextResponse } from 'next/server'
import { addKnowledgeToBase } from '@/lib/rag'
import pdf from 'pdf-parse' // 恢复PDF解析功能 - 更新于 2024-01-21 00:05:00

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    
    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File and userId are required' },
        { status: 400 }
      )
    }

    // 检查文件类型 - 更新于 2024-01-21 00:05:00
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, TXT, or DOC files.' },
        { status: 400 }
      )
    }

    // 检查文件大小 (10MB 限制)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // 解析文件内容
    let content = ''
    try {
      if (file.type === 'text/plain') {
        content = await file.text()
      } else if (file.type === 'application/pdf') {
        // 恢复PDF解析功能
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const pdfData = await pdf(buffer)
        content = pdfData.text
      } else if (file.type.includes('word')) {
        // Word 文档解析暂时返回错误
        return NextResponse.json(
          { error: 'Word document parsing not yet implemented. Please upload PDF or TXT files for now.' },
          { status: 400 }
        )
      }
    } catch (parseError) {
      console.error('File parsing error:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse file content. Please ensure the file is not corrupted.' },
        { status: 400 }
      )
    }

    if (!content.trim()) {
      return NextResponse.json(
        { error: 'Could not extract text from file. The file might be empty or contain only images.' },
        { status: 400 }
      )
    }

    // 将内容分割成小块以便更好的向量化
    const chunks = splitTextIntoChunks(content, 1000) // 1000字符一块
    
    const processedChunks = []
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      try {
        // 添加到知识库
        const knowledgeId = await addKnowledgeToBase(
          `${file.name} - Part ${i + 1}`,
          chunk,
          'uploaded_document', // topic
          'medium', // difficulty - 用户上传的默认为中等
          'example', // type
          ['user_upload', userId], // tags
          file.name // source
        )
        
        processedChunks.push({
          id: knowledgeId,
          content: chunk.substring(0, 100) + '...', // 预览
          size: chunk.length
        })
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error)
        // 继续处理其他块，不因单个块失败而终止
      }
    }

    if (processedChunks.length === 0) {
      return NextResponse.json(
        { error: 'Failed to process any chunks from the file' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${processedChunks.length} chunks from ${file.name}`,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        chunksProcessed: processedChunks.length,
        totalChunks: chunks.length
      },
      chunks: processedChunks
    })

  } catch (error) {
    console.error('Error in upload API:', error)
    return NextResponse.json(
      { error: 'Internal server error during file processing' },
      { status: 500 }
    )
  }
}

// 文本分割函数
function splitTextIntoChunks(text: string, chunkSize: number = 1000): string[] {
  const chunks: string[] = []
  let currentChunk = ''
  
  // 按段落分割
  const paragraphs = text.split(/\n\s*\n/)
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length <= chunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = paragraph
      } else {
        // 段落太长，需要强制分割
        const words = paragraph.split(' ')
        let tempChunk = ''
        for (const word of words) {
          if (tempChunk.length + word.length + 1 <= chunkSize) {
            tempChunk += (tempChunk ? ' ' : '') + word
          } else {
            if (tempChunk) chunks.push(tempChunk.trim())
            tempChunk = word
          }
        }
        if (tempChunk) currentChunk = tempChunk
      }
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks.filter(chunk => chunk.length > 0)
}