import { NextRequest, NextResponse } from 'next/server'
import { addKnowledgeToBase } from '@/lib/rag'
import { supabase } from '@/lib/supabase'

// 动态导入pdf-parse以避免构建时问题 - 更新于 2024-01-21 01:00:00
let pdfParse: any = null

async function getPdfParser() {
  if (!pdfParse) {
    try {
      console.log('Loading pdf-parse module...')
      // 尝试多种导入方式以确保兼容性
      let pdfModule
      try {
        pdfModule = await import('pdf-parse')
      } catch (e1) {
        console.log('First import attempt failed, trying alternative...')
        try {
          pdfModule = require('pdf-parse')
        } catch (e2) {
          console.error('All import methods failed:', e1, e2)
          throw new Error('PDF parsing library could not be loaded')
        }
      }
      
      pdfParse = pdfModule.default || pdfModule
      console.log('PDF parser loaded successfully')
    } catch (error) {
      console.error('Failed to load pdf-parse:', error)
      throw new Error(`PDF parsing is not available: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  return pdfParse
}

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called - 更新于 2024-01-21 01:00:00')
    
    // 确保formData解析不会失败
    let formData: FormData;
    let file: File | null = null;
    let userId: string | null = null;
    
    try {
      formData = await request.formData()
      file = formData.get('file') as File
      userId = formData.get('userId') as string
    } catch (formError) {
      console.error('FormData parsing error:', formError)
      return NextResponse.json(
        { error: 'Invalid form data. Please ensure you are uploading a valid file.' },
        { status: 400 }
      )
    }
    
    console.log('File info:', { name: file?.name, type: file?.type, size: file?.size })
    console.log('User ID:', userId)
    
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
    try {
      if (file.type === 'text/plain') {
        content = await file.text()
        console.log('TXT content length:', content.length)
      } else if (file.type === 'application/pdf') {
        // 改进的PDF解析，兼容Netlify环境
        try {
          console.log('Attempting PDF parsing...')
          const pdfParser = await getPdfParser()
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          
          // 添加超时处理，防止长时间阻塞
          const parsePromise = pdfParser(buffer)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('PDF parsing timeout')), 30000)
          )
          
          const pdfData = await Promise.race([parsePromise, timeoutPromise])
          content = pdfData.text
          console.log('PDF content length:', content.length)
          
          if (!content || content.trim().length === 0) {
            throw new Error('PDF appears to be empty or contains no extractable text')
          }
          
        } catch (pdfError) {
          console.error('PDF parsing error:', pdfError)
          return NextResponse.json(
            { 
              error: 'Failed to parse PDF file. This could be due to: 1) The PDF is password protected, 2) The PDF contains only images/scanned content, 3) The PDF is corrupted. Please ensure your PDF contains selectable text.',
              details: pdfError instanceof Error ? pdfError.message : 'Unknown PDF parsing error'
            },
            { 
              status: 400,
              headers: {
                'Content-Type': 'application/json',
              }
            }
          )
        }
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
    console.log('Created chunks:', chunks.length)
    
    // 处理所有块并保存到知识库
    const processedChunks = []
    try {
      console.log('Processing', chunks.length, 'chunks for knowledge base...')
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const chunkTitle = `${file.name} - Part ${i + 1}`
        
        console.log(`Processing chunk ${i + 1}/${chunks.length}, length:`, chunk.length)
        
        try {
          console.log(`Attempting to add chunk ${i + 1} to knowledge base...`)
          
          // 使用最简单的字段进行测试
          const { data, error } = await supabase
            .from('knowledge_base')
            .insert({
              title: chunkTitle
              // 暂时只使用title字段，其他字段可能不存在
            })
            .select()
            .single()
          
          if (error) {
            console.error('Supabase insert error:', error)
            console.error('Error details:', {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            })
            throw error
          }
          
          processedChunks.push({
            id: data.id,
            content: chunk.substring(0, 100) + '...', // 预览
            size: chunk.length,
            title: chunkTitle
          })
          
          console.log(`Successfully added chunk ${i + 1} to knowledge base:`, data.id)
        } catch (chunkError) {
          console.error(`Error processing chunk ${i + 1}:`, chunkError)
          console.error('Error details:', {
            message: chunkError instanceof Error ? chunkError.message : 'Unknown error',
            stack: chunkError instanceof Error ? chunkError.stack : undefined,
            error: chunkError
          })
          
          // 如果单个块失败，继续处理其他块
          processedChunks.push({
            id: 'error-' + Date.now() + '-' + i,
            content: chunk.substring(0, 100) + '...',
            size: chunk.length,
            title: chunkTitle,
            error: chunkError instanceof Error ? chunkError.message : 'Unknown error'
          })
        }
      }
      
      console.log('Finished processing chunks. Success:', processedChunks.filter(c => !c.error).length, 'Failed:', processedChunks.filter(c => c.error).length)
      
    } catch (error) {
      console.error('Error in chunk processing loop:', error)
      return NextResponse.json(
        { error: 'Failed to process file chunks' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed file: ${file.name}`,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        chunksProcessed: processedChunks.length,
        totalChunks: chunks.length,
        contentLength: content.length
      },
      chunks: processedChunks
    })

  } catch (error) {
    console.error('Error in upload API:', error)
    // 确保总是返回JSON响应，即使发生未预期的错误
    return NextResponse.json(
      { 
        error: 'Internal server error during file processing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

// 添加OPTIONS方法支持CORS预检请求
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
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