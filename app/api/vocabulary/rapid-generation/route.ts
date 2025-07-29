import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { 
      targetWords = 3000,
      userId = '00000000-0000-0000-0000-000000000001',
      mode = 'rapid' // 'rapid' or 'quality'
    } = await request.json()
    
    console.log(`🚀 Starting rapid vocabulary generation: Target ${targetWords} words`)
    
    const supabaseAdmin = getSupabaseAdmin()
    
    // 1. 检查当前词汇数量
    const { data: existingWords, error: countError } = await supabaseAdmin
      .from('flashcards')
      .select('word')
      .eq('user_id', userId)
      .eq('type', 'vocabulary')
    
    if (countError) {
      console.error('Error counting words:', countError)
      return NextResponse.json({ success: false, error: countError.message }, { status: 500 })
    }
    
    const currentCount = existingWords?.length || 0
    const remainingWords = targetWords - currentCount
    
    console.log(`Current: ${currentCount}, Target: ${targetWords}, Remaining: ${remainingWords}`)
    
    if (remainingWords <= 0) {
      return NextResponse.json({
        success: true,
        message: 'Target already reached!',
        stats: { current: currentCount, target: targetWords, remaining: 0 }
      })
    }
    
    // 2. 计算生成策略
    const batchSize = mode === 'rapid' ? 100 : 50 // 快速模式更大批次
    const maxBatches = Math.ceil(remainingWords / batchSize)
    const parallelRequests = mode === 'rapid' ? 3 : 2 // 并行请求数
    
    console.log(`Strategy: ${maxBatches} batches of ${batchSize} words, ${parallelRequests} parallel requests`)
    
    let totalGenerated = 0
    let totalInserted = 0
    let successfulBatches = 0
    const errors = []
    
    // 3. 并行批量生成
    for (let batchGroup = 0; batchGroup < maxBatches; batchGroup += parallelRequests) {
      const promises = []
      
      // 创建并行请求
      for (let i = 0; i < parallelRequests && (batchGroup + i) < maxBatches; i++) {
        const batchNumber = batchGroup + i + 1
        const currentBatchSize = Math.min(batchSize, remainingWords - (batchNumber - 1) * batchSize)
        
        if (currentBatchSize > 0) {
          console.log(`Starting batch ${batchNumber}/${maxBatches} (${currentBatchSize} words)`)
          
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const promise = fetch(`${baseUrl}/api/vocabulary/generate-optimized`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              batchSize: currentBatchSize,
              difficulty: 'mixed'
            })
          }).then(async (response) => {
            const result = await response.json()
            return { batchNumber, result, success: response.ok }
          }).catch(error => {
            console.error(`Batch ${batchNumber} failed:`, error)
            return { batchNumber, error: error.message, success: false }
          })
          
          promises.push(promise)
        }
      }
      
      // 等待当前组完成
      const results = await Promise.all(promises)
      
      // 处理结果
      for (const batchResult of results) {
        const { batchNumber, success } = batchResult
        if (success && 'result' in batchResult && batchResult.result.success) {
          const { result } = batchResult
          totalGenerated += result.stats?.generated || 0
          totalInserted += result.stats?.inserted || 0
          successfulBatches++
          console.log(`✅ Batch ${batchNumber} completed: ${result.stats?.inserted || 0} words inserted`)
        } else {
          const errorMsg = 'error' in batchResult 
            ? batchResult.error 
            : ('result' in batchResult ? batchResult.result.error : 'Unknown error')
          errors.push(`Batch ${batchNumber}: ${errorMsg}`)
          console.error(`❌ Batch ${batchNumber} failed:`, errorMsg)
        }
      }
      
      // 短暂延迟避免API限制
      if (batchGroup + parallelRequests < maxBatches) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // 4. 最终统计
    const { data: finalWords, error: finalCountError } = await supabaseAdmin
      .from('flashcards')
      .select('word, difficulty_level, source_type')
      .eq('user_id', userId)
      .eq('type', 'vocabulary')
    
    const finalCount = finalWords?.length || 0
    const progress = Math.round((finalCount / targetWords) * 100)
    
    // 5. 计算ETA（预估完成时间）
    const wordsPerMinute = totalInserted > 0 ? totalInserted / 5 : 20 // 假设5分钟运行
    const remainingWordsAfter = Math.max(0, targetWords - finalCount)
    const estimatedMinutes = Math.ceil(remainingWordsAfter / wordsPerMinute)
    
    return NextResponse.json({
      success: true,
      message: `Rapid generation completed: ${totalInserted} words added`,
      execution: {
        batchesPlanned: maxBatches,
        batchesSuccessful: successfulBatches,
        batchesFailed: maxBatches - successfulBatches,
        totalGenerated,
        totalInserted,
        errors: errors.length > 0 ? errors.slice(0, 3) : [] // 只显示前3个错误
      },
      progress: {
        before: currentCount,
        after: finalCount,
        added: finalCount - currentCount,
        target: targetWords,
        remaining: remainingWordsAfter,
        percentage: progress
      },
      performance: {
        wordsPerMinute: Math.round(wordsPerMinute),
        estimatedTimeToComplete: estimatedMinutes > 0 ? `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m` : 'Target reached!',
        successRate: Math.round((successfulBatches / maxBatches) * 100) + '%'
      },
      nextSteps: remainingWordsAfter > 0 ? [
        'Run this API again to continue generation',
        `Estimated ${estimatedMinutes} minutes to complete`,
        'Consider running in smaller batches if errors occur'
      ] : [
        'Target reached! 🎉',
        'Start using the vocabulary learning system',
        'Monitor user learning progress'
      ]
    })
    
  } catch (error) {
    console.error('Rapid generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Rapid generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for progress monitoring
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || '00000000-0000-0000-0000-000000000001'
    const target = parseInt(searchParams.get('target') || '3000')
    
    const supabaseAdmin = getSupabaseAdmin()
    
    const { data: words, error } = await supabaseAdmin
      .from('flashcards')
      .select('word, difficulty_level, source_type, created_at')
      .eq('user_id', userId)
      .eq('type', 'vocabulary')
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    
    const current = words?.length || 0
    const remaining = Math.max(0, target - current)
    const progress = Math.round((current / target) * 100)
    
    // 分析最近生成的词汇
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const recentWords = words?.filter(w => new Date(w.created_at) > oneDayAgo) || []
    
    // 按来源分析
    const sourceStats = {
      optimized: words?.filter(w => w.source_type === 'ai_generated_optimized').length || 0,
      legacy: words?.filter(w => w.source_type === 'ai_generated').length || 0,
      uploaded: words?.filter(w => w.source_type === 'uploaded_content').length || 0,
      other: words?.filter(w => !['ai_generated_optimized', 'ai_generated', 'uploaded_content'].includes(w.source_type)).length || 0
    }
    
    return NextResponse.json({
      success: true,
      status: {
        current,
        target,
        remaining,
        progress: progress + '%',
        isComplete: remaining === 0
      },
      recentActivity: {
        wordsAddedToday: recentWords.length,
        lastAdded: words?.[0]?.created_at || null
      },
      distribution: {
        bySource: sourceStats,
        byDifficulty: {
          easy: words?.filter(w => w.difficulty_level === 1).length || 0,
          medium: words?.filter(w => w.difficulty_level === 2).length || 0,
          hard: words?.filter(w => w.difficulty_level === 3).length || 0,
          veryHard: words?.filter(w => w.difficulty_level === 4).length || 0
        }
      },
      recommendations: remaining > 0 ? {
        nextAction: 'Run rapid generation',
        estimatedBatches: Math.ceil(remaining / 100),
        estimatedTime: `${Math.ceil(remaining / 200)} hours` // 假设每小时200词
      } : {
        nextAction: 'Start vocabulary learning',
        recommendation: 'Target reached! Begin user learning experience.'
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}