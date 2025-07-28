import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const DEMO_USER_UUID = "00000000-0000-0000-0000-000000000001"

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting vocabulary database cleanup and deduplication...')
    
    // 1. 获取所有单词并去重
    const { data: allWords, error: fetchError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', DEMO_USER_UUID)
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching words:', fetchError)
      return NextResponse.json({ 
        success: false, 
        error: fetchError.message 
      })
    }

    console.log(`📊 Found ${allWords?.length || 0} total flashcards`)
    
    // 2. 去重处理
    const wordGroups = new Map()
    const duplicateIds = []
    
    for (const flashcard of allWords || []) {
      const word = flashcard.word?.toLowerCase()
      if (!word) continue
      
      if (!wordGroups.has(word)) {
        // 第一次出现 - 保留
        wordGroups.set(word, flashcard)
      } else {
        // 重复 - 标记删除
        duplicateIds.push(flashcard.id)
      }
    }
    
    console.log(`🔍 Found ${duplicateIds.length} duplicate records to remove`)
    console.log(`✅ Will keep ${wordGroups.size} unique words`)
    
    // 3. 批量删除重复项
    let deletedCount = 0
    if (duplicateIds.length > 0) {
      const batchSize = 100
      
      for (let i = 0; i < duplicateIds.length; i += batchSize) {
        const batch = duplicateIds.slice(i, i + batchSize)
        
        const { error: deleteError } = await supabase
          .from('flashcards')
          .delete()
          .in('id', batch)
        
        if (deleteError) {
          console.error('Error deleting batch:', deleteError)
        } else {
          deletedCount += batch.length
          console.log(`🗑️  Deleted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records`)
        }
      }
    }

    // 4. 获取最终统计
    const { data: finalStats } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', DEMO_USER_UUID)

    // 5. 按来源分类统计
    const sourceStats = {}
    for (const word of finalStats || []) {
      const source = word.source_type || 'unknown'
      sourceStats[source] = (sourceStats[source] || 0) + 1
    }

    return NextResponse.json({
      success: true,
      message: 'Database cleanup completed successfully',
      stats: {
        originalCount: allWords?.length || 0,
        duplicatesRemoved: deletedCount,
        finalCount: finalStats?.length || 0,
        uniqueWords: wordGroups.size,
        sourceBreakdown: sourceStats
      }
    })

  } catch (error) {
    console.error('Fix all words error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 