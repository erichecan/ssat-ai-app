import { NextRequest, NextResponse } from 'next/server'
import { aiCache } from '@/lib/ai-cache'

export async function GET(request: NextRequest) {
  try {
    const stats = aiCache.getStats()
    
    return NextResponse.json({
      success: true,
      data: {
        cache: {
          hits: stats.hits,
          misses: stats.misses,
          hitRate: Math.round(stats.hitRate * 100) + '%',
          size: stats.size,
          maxSize: 1000
        },
        performance: {
          totalRequests: stats.hits + stats.misses,
          cacheEfficiency: stats.hitRate > 0.3 ? 'Good' : 'Needs Improvement'
        },
        recommendations: [
          stats.hitRate < 0.2 ? 'Consider increasing cache TTL for frequently requested content' : null,
          stats.size > 800 ? 'Cache is nearly full, consider increasing max size' : null,
          stats.misses > stats.hits * 2 ? 'High miss rate, consider optimizing prompt patterns' : null
        ].filter(Boolean)
      }
    })
  } catch (error) {
    console.error('Error getting AI performance stats:', error)
    return NextResponse.json(
      { error: 'Failed to get performance stats' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    switch (action) {
      case 'clear':
        aiCache.clear()
        return NextResponse.json({ success: true, message: 'Cache cleared' })
      
      case 'cleanup':
        const cleaned = aiCache.cleanup()
        return NextResponse.json({ 
          success: true, 
          message: `Cleaned up ${cleaned} expired entries` 
        })
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error performing cache action:', error)
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    )
  }
} 