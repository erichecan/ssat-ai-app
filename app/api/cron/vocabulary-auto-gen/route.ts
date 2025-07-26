import { NextRequest, NextResponse } from 'next/server'

// 定时任务：每5分钟自动生成词汇
export async function GET(request: NextRequest) {
  try {
    console.log('🕐 Cron job: Starting vocabulary auto-generation...')
    
    // 检查环境变量
    if (!process.env.GOOGLE_GEMINI_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing required environment variables for auto-generation')
      return NextResponse.json({
        success: false,
        error: 'Service configuration incomplete',
        timestamp: new Date().toISOString()
      })
    }

    // 调用自动生成API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/vocabulary/auto-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    const result = await response.json()
    
    if (response.ok && result.success) {
      console.log('✅ Cron job: Auto-generation completed successfully')
      console.log(`📊 Stats: Generated ${result.stats?.totalGenerated || 0} new words`)
      
      return NextResponse.json({
        success: true,
        message: 'Cron vocabulary auto-generation completed',
        stats: result.stats,
        timestamp: new Date().toISOString(),
        nextRun: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5分钟后
      })
    } else {
      console.error('❌ Cron job: Auto-generation failed:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error || 'Auto-generation failed',
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    console.error('💥 Cron job error:', error)
    return NextResponse.json({
      success: false,
      error: 'Cron job execution failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}

// POST方法用于手动触发
export async function POST(request: NextRequest) {
  console.log('🔧 Manual trigger: Starting vocabulary auto-generation...')
  return GET(request)
}