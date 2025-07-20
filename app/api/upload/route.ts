import { NextRequest, NextResponse } from 'next/server'
import { addKnowledgeToBase } from '@/lib/rag'
import pdf from 'pdf-parse'

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

    // 检查文件类型
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
    if (file.type === 'text/plain') {
      content = await file.text()
    } else if (file.type === 'application/pdf') {
      // PDF 解析将在下个步骤实现
      content = await parsePDF(file)
    } else if (file.type.includes('word')) {
      // Word 文档解析将在下个步骤实现
      content = await parseWord(file)
    }

    if (!content.trim()) {
      return NextResponse.json(
        { error: 'Could not extract text from file' },
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

// PDF 解析函数
async function parsePDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const data = await pdf(buffer)
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text found in PDF file')
    }
    
    return data.text
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Word 文档解析函数 (简化版本)
async function parseWord(file: File): Promise<string> {
  // 这里需要使用 Word 解析库，暂时返回错误
  throw new Error('Word document parsing not yet implemented. Please upload TXT files for now.')
}