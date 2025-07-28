#!/usr/bin/env node

/**
 * 修复flashcard API - 确保所有数据库中的单词都能被学习
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

async function main() {
  console.log('🔧 修复flashcard API - 为所有单词创建进度记录...')
  
  try {
    // 1. 获取所有数据库中的单词
    const { data: allWords, error: wordsError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', DEMO_USER_ID)
    
    if (wordsError) {
      console.error('❌ 获取单词失败:', wordsError)
      return
    }
    
    console.log(`📚 数据库中共有 ${allWords?.length || 0} 个单词`)
    
    // 2. 获取现有的进度记录
    const { data: existingProgress, error: progressError } = await supabase
      .from('user_flashcard_progress')
      .select('flashcard_id')
      .eq('user_id', DEMO_USER_ID)
    
    if (progressError) {
      console.error('❌ 获取进度记录失败:', progressError)
      return
    }
    
    const existingIds = new Set(existingProgress?.map(p => p.flashcard_id) || [])
    console.log(`📊 现有进度记录: ${existingIds.size} 个`)
    
    // 3. 为没有进度记录的单词创建记录
    const missingWords = allWords?.filter(word => 
      !existingIds.has(word.word) && !existingIds.has(word.id)
    ) || []
    
    console.log(`🔍 需要创建进度记录的单词: ${missingWords.length} 个`)
    
    if (missingWords.length > 0) {
      const progressRecords = missingWords.map(word => ({
        user_id: DEMO_USER_ID,
        flashcard_id: word.word || word.id,
        mastery_level: 0,
        times_seen: 0,
        times_correct: 0,
        difficulty_rating: word.difficulty_level || 3,
        next_review: new Date().toISOString(),
        interval_days: 1,
        ease_factor: 2.5,
        is_mastered: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      // 分批插入
      const batchSize = 50
      let insertedCount = 0
      
      for (let i = 0; i < progressRecords.length; i += batchSize) {
        const batch = progressRecords.slice(i, i + batchSize)
        
        const { error: insertError } = await supabase
          .from('user_flashcard_progress')
          .insert(batch)
        
        if (insertError) {
          console.error(`❌ 插入批次 ${Math.floor(i/batchSize) + 1} 失败:`, insertError)
        } else {
          insertedCount += batch.length
          console.log(`✅ 插入批次 ${Math.floor(i/batchSize) + 1}: ${batch.length} 条记录`)
        }
      }
      
      console.log(`🎉 成功创建 ${insertedCount} 条进度记录`)
    }
    
    // 4. 测试API
    console.log('\n🧪 测试修复后的API...')
    const response = await fetch('http://localhost:3000/api/flashcards/enhanced')
    const data = await response.json()
    
    console.log(`📊 API现在返回: ${data.flashcards?.length || 0} 个单词`)
    console.log('📈 统计信息:', data.stats)
    
  } catch (error) {
    console.error('💥 修复过程出错:', error)
  }
}

main().catch(console.error)