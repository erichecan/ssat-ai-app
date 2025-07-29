import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { 
      batchCount = 10,  // 生成10批次
      batchSize = 20,   // 每批20个词
      userId = '00000000-0000-0000-0000-000000000001'
    } = await request.json()
    
    console.log(`🚀 Starting batch generation: ${batchCount} batches of ${batchSize} words each`)
    
    const results = []
    let totalGenerated = 0
    let totalInserted = 0
    let successfulBatches = 0
    
    for (let i = 1; i <= batchCount; i++) {
      try {
        console.log(`Processing batch ${i}/${batchCount}...`)
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/vocabulary/generate-optimized`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            batchSize,
            difficulty: 'mixed'
          })
        })
        
        const result = await response.json()
        
        if (response.ok && result.success) {
          totalGenerated += result.stats?.generated || 0
          totalInserted += result.stats?.inserted || 0
          successfulBatches++
          
          results.push({
            batch: i,
            success: true,
            generated: result.stats?.generated || 0,
            inserted: result.stats?.inserted || 0,
            sampleWords: result.sampleWords?.slice(0, 2) || []
          })
          
          console.log(`✅ Batch ${i} completed: ${result.stats?.inserted || 0} words inserted`)
        } else {
          console.error(`❌ Batch ${i} failed:`, result.error)
          results.push({
            batch: i,
            success: false,
            error: result.error || 'Unknown error'
          })
        }
        
        // 短暂延迟避免API限制
        if (i < batchCount) {
          await new Promise(resolve => setTimeout(resolve, 2000)) // 2秒延迟
        }
        
      } catch (batchError) {
        console.error(`Batch ${i} error:`, batchError)
        results.push({
          batch: i,
          success: false,
          error: batchError instanceof Error ? batchError.message : 'Network error'
        })
      }
    }
    
    // 获取最终统计
    const successRate = Math.round((successfulBatches / batchCount) * 100)
    const avgWordsPerBatch = successfulBatches > 0 ? Math.round(totalInserted / successfulBatches) : 0
    
    return NextResponse.json({
      success: true,
      message: `Batch generation completed: ${totalInserted} words added`,
      summary: {
        batchesRequested: batchCount,
        batchesSuccessful: successfulBatches,
        batchesFailed: batchCount - successfulBatches,
        totalGenerated,
        totalInserted,
        successRate: successRate + '%',
        avgWordsPerBatch
      },
      details: results,
      recommendations: successfulBatches < batchCount ? [
        'Some batches failed - check API limits',
        'Consider reducing batch size or frequency',
        'Retry failed batches individually'
      ] : [
        'All batches completed successfully! 🎉',
        'Continue with more batches if needed',
        'Monitor vocabulary quality and user feedback'
      ]
    })
    
  } catch (error) {
    console.error('Batch generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Batch generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for monitoring current progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || '00000000-0000-0000-0000-000000000001'
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/vocabulary/generate-bulk?userId=${userId}`)
    const stats = await response.json()
    
    return NextResponse.json({
      success: true,
      currentStatus: stats.stats || {},
      recommendations: {
        batchSize: stats.stats?.total < 500 ? 20 : 10, // 词汇少时用大批次
        batchCount: Math.ceil((3000 - (stats.stats?.total || 0)) / 20),
        estimatedTime: Math.ceil((3000 - (stats.stats?.total || 0)) / 100) + ' minutes'
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}