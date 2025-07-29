import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting duplicate vocabulary cleanup...')
    
    const supabaseAdmin = getSupabaseAdmin()
    
    // 1. 获取所有词汇记录
    const { data: allWords, error: fetchError } = await supabaseAdmin
      .from('flashcards')
      .select('id, word, user_id, created_at, source_type')
      .eq('type', 'vocabulary')
      .order('created_at', { ascending: true }) // 保留最早创建的
    
    if (fetchError) {
      console.error('Error fetching words:', fetchError)
      return NextResponse.json({ 
        success: false, 
        error: fetchError.message 
      }, { status: 500 })
    }
    
    console.log(`Found ${allWords?.length || 0} total vocabulary words`)
    
    // 2. 分析重复情况
    const wordMap = new Map<string, any[]>()
    allWords?.forEach(word => {
      const key = `${word.word?.toLowerCase()}-${word.user_id}`
      if (!wordMap.has(key)) {
        wordMap.set(key, [])
      }
      wordMap.get(key)!.push(word)
    })
    
    // 3. 找出重复的词汇
    const duplicates: Array<{
      word: string;
      user_id: string;
      count: number;
      records: any[];
    }> = []
    const toDelete: string[] = []
    
    // 使用更兼容的迭代方式
    wordMap.forEach((words, key) => {
      if (words.length > 1) {
        duplicates.push({
          word: words[0].word,
          user_id: words[0].user_id,
          count: words.length,
          records: words
        })
        
        // 保留第一个（最早创建的），删除其余
        toDelete.push(...words.slice(1).map(w => w.id))
      }
    })
    
    console.log(`Found ${duplicates.length} duplicate word groups`)
    console.log(`Will delete ${toDelete.length} duplicate records`)
    
    // 4. 显示重复详情
    const topDuplicates = duplicates
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(d => ({
        word: d.word,
        count: d.count,
        user_id: d.user_id
      }))
    
    // 5. 执行删除（如果请求参数中包含execute=true）
    const { searchParams } = new URL(request.url)
    const execute = searchParams.get('execute') === 'true'
    
    let deletedCount = 0
    if (execute && toDelete.length > 0) {
      console.log('🗑️ Executing deletion of duplicate records...')
      
      // 分批删除避免超时
      const batchSize = 100
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize)
        const { error: deleteError } = await supabaseAdmin
          .from('flashcards')
          .delete()
          .in('id', batch)
        
        if (deleteError) {
          console.error(`Error deleting batch ${i}-${i + batchSize}:`, deleteError)
        } else {
          deletedCount += batch.length
          console.log(`Deleted batch ${i + 1}-${Math.min(i + batchSize, toDelete.length)}`)
        }
      }
    }
    
    // 6. 获取清理后的统计
    const { data: remainingWords, error: countError } = await supabaseAdmin
      .from('flashcards')
      .select('word')
      .eq('type', 'vocabulary')
    
    const finalCount = remainingWords?.length || 0
    
    return NextResponse.json({
      success: true,
      analysis: {
        totalWordsBefore: allWords?.length || 0,
        duplicateGroups: duplicates.length,
        duplicateRecords: toDelete.length,
        uniqueWords: wordMap.size,
        topDuplicates
      },
      execution: execute ? {
        executed: true,
        deletedRecords: deletedCount,
        remainingWords: finalCount
      } : {
        executed: false,
        message: 'Add ?execute=true to actually delete duplicates'
      },
      recommendations: {
        shouldDelete: toDelete.length > 0,
        estimatedSavings: `${toDelete.length} duplicate records`,
        nextSteps: execute ? 'Duplicates cleaned! Ready for optimized generation.' : 'Review results, then add ?execute=true to clean duplicates'
      }
    })
    
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Cleanup operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint for status check
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    const { data: words, error } = await supabaseAdmin
      .from('flashcards')
      .select('id, word, user_id')
      .eq('type', 'vocabulary')
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Quick duplicate analysis
    const wordMap = new Map()
    words?.forEach(word => {
      const key = `${word.word?.toLowerCase()}-${word.user_id}`
      wordMap.set(key, (wordMap.get(key) || 0) + 1)
    })
    
    const duplicateCount = Array.from(wordMap.values()).reduce((sum, count) => 
      sum + (count > 1 ? count - 1 : 0), 0
    )
    
    return NextResponse.json({
      success: true,
      currentStatus: {
        totalRecords: words?.length || 0,
        uniqueWords: wordMap.size,
        duplicateRecords: duplicateCount,
        needsCleanup: duplicateCount > 0
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}