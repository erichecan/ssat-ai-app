import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const DEMO_USER_UUID = "00000000-0000-0000-0000-000000000001"

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing all words in database...')
    
    // 1. 获取所有user_id为null的单词
    const { data: nullUserWords, error: nullUserError } = await supabase
      .from('flashcards')
      .select('*')
      .is('user_id', null)

    if (nullUserError) {
      console.error('Error fetching null user words:', nullUserError)
      return NextResponse.json({ 
        success: false, 
        error: nullUserError.message 
      })
    }

    console.log(`Found ${nullUserWords?.length || 0} words with null user_id`)

    // 2. 修复每个单词
    const fixedWords = []
    for (const word of nullUserWords || []) {
      // 从question中提取单词
      const questionText = word.question || ''
      const wordMatch = questionText.match(/['"]([^'"]+)['"]/)
      const extractedWord = wordMatch ? wordMatch[1] : null
      
      if (extractedWord) {
        // 更新单词，添加user_id和word字段
        const { data: updatedWord, error: updateError } = await supabase
          .from('flashcards')
          .update({
            user_id: DEMO_USER_UUID,
            word: extractedWord,
            definition: word.answer,
            source_type: 'legacy_migration',
            source_context: 'Migrated from legacy format'
          })
          .eq('id', word.id)
          .select()

        if (updateError) {
          console.error(`Error updating word ${word.id}:`, updateError)
        } else {
          fixedWords.push(updatedWord?.[0])
          console.log(`✅ Fixed word: ${extractedWord}`)
        }
      }
    }

    // 3. 为所有单词创建progress记录
    const { data: allWords, error: allWordsError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', DEMO_USER_UUID)

    if (allWordsError) {
      console.error('Error fetching all words:', allWordsError)
    } else {
      console.log(`Creating progress records for ${allWords?.length || 0} words`)
      
      for (const word of allWords || []) {
        // 检查是否已有progress记录
        const { data: existingProgress } = await supabase
          .from('user_flashcard_progress')
          .select('*')
          .eq('user_id', DEMO_USER_UUID)
          .eq('flashcard_id', word.id)
          .single()

        if (!existingProgress) {
          // 创建progress记录
          const { error: progressError } = await supabase
            .from('user_flashcard_progress')
            .insert({
              user_id: DEMO_USER_UUID,
              flashcard_id: word.id,
              mastery_level: 0,
              times_seen: 0,
              times_correct: 0,
              difficulty_rating: 3,
              next_review: new Date().toISOString(),
              interval_days: 1,
              ease_factor: 2.50,
              is_mastered: false
            })

          if (progressError) {
            console.error(`Error creating progress for word ${word.id}:`, progressError)
          } else {
            console.log(`✅ Created progress for word: ${word.word || word.question}`)
          }
        }
      }
    }

    // 4. 获取最终统计
    const { data: finalStats } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', DEMO_USER_UUID)

    return NextResponse.json({
      success: true,
      fixedWords: fixedWords.length,
      totalWords: finalStats?.length || 0,
      message: `Successfully fixed ${fixedWords.length} words and created progress records`
    })

  } catch (error) {
    console.error('Fix all words error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 