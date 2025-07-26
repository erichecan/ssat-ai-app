import { NextRequest, NextResponse } from 'next/server'

// 自动生成单词的API端点
export async function POST(request: NextRequest) {
  try {
    console.log('Auto-generation triggered')
    
    // 检查环境变量
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('Missing GOOGLE_GEMINI_API_KEY')
      return NextResponse.json(
        { error: 'AI service not configured', success: false },
        { status: 500 }
      )
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Database service not configured', success: false },
        { status: 500 }
      )
    }
    
    // 调用主要的生成API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ssat.netlify.app'
    const response = await fetch(`${baseUrl}/api/vocabulary/generate-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '00000000-0000-0000-0000-000000000001', // Fixed UUID format for demo user
        batchSize: 5,
        totalTarget: 3000
      })
    })
    
    const result = await response.json()
    
    if (response.ok && result.success) {
      console.log('Auto-generation successful:', result.stats?.totalGenerated || 0, 'words added')
      return NextResponse.json({
        success: true,
        message: `Auto-generated ${result.stats?.totalGenerated || 0} new words`,
        stats: result.stats
      })
    } else {
      console.error('Auto-generation failed:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error || 'Generation failed'
      }, { status: response.status || 500 })
    }
    
  } catch (error) {
    console.error('Auto-generation error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Auto-generation service error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET方法返回自动生成的状态
// GET方法用于健康检查
export async function GET() {
  try {
    // 检查当前词汇数量
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/vocabulary/generate-bulk?userId=00000000-0000-0000-0000-000000000001`)
    const stats = await response.json()
    
    return NextResponse.json({
      message: 'Auto-generation service is active',
      interval: '5 minutes',
      target: 3000,
      batchSize: 5,
      currentStatus: {
        totalWords: stats.stats?.total || 0,
        targetRemaining: Math.max(0, 3000 - (stats.stats?.total || 0))
      },
      lastCheck: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      message: 'Auto-generation service status check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      interval: '5 minutes',
      target: 3000,
      batchSize: 5
    })
  }
}