import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug database - checking all flashcards...')
    
    // 查询所有单词，不限制user_id
    const { data: allFlashcards, error: allError } = await supabase
      .from('flashcards')
      .select('*')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('Error fetching all flashcards:', allError)
      return NextResponse.json({ 
        success: false, 
        error: allError.message,
        total: 0 
      })
    }

    console.log(`Found ${allFlashcards?.length || 0} total flashcards`)

    // 按user_id分组统计
    const userStats: Record<string, number> = {}
    allFlashcards?.forEach(card => {
      const userId = card.user_id || 'unknown'
      userStats[userId] = (userStats[userId] || 0) + 1
    })

    // 获取最近的10个单词
    const recentWords = allFlashcards?.slice(0, 10).map(card => ({
      id: card.id,
      word: card.word || card.front_text,
      user_id: card.user_id,
      created_at: card.created_at,
      source_type: card.source_type || 'unknown'
    }))

    return NextResponse.json({
      success: true,
      total: allFlashcards?.length || 0,
      userStats,
      recentWords,
      allFlashcards: allFlashcards?.slice(0, 20) // 只返回前20个避免响应过大
    })

  } catch (error) {
    console.error('Debug database error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      total: 0 
    })
  }
} 