#!/usr/bin/env node

/**
 * 模拟Today Review - 调整已掌握单词的复习时间用于测试
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

async function main() {
  console.log('🧪 模拟Today Review测试数据...')
  
  try {
    // 获取已掌握的单词
    const { data: masteredWords, error } = await supabase
      .from('user_flashcard_progress')
      .select('*')
      .eq('user_id', DEMO_USER_ID)
      .eq('is_mastered', true)
    
    if (error) {
      console.error('❌ 查询错误:', error)
      return
    }
    
    console.log(`📚 找到 ${masteredWords?.length || 0} 个已掌握的单词`)
    
    if (!masteredWords || masteredWords.length === 0) {
      console.log('⚠️  没有已掌握的单词，无法测试Today Review')
      return
    }
    
    // 设置不同的复习时间来模拟艾宾浩斯曲线
    const reviewSchedules = [
      { days: -1, interval: 7 },   // 昨天应该复习 (7天间隔)
      { days: 0, interval: 14 },   // 今天需要复习 (14天间隔) 
      { days: -2, interval: 21 }   // 前天应该复习 (21天间隔)
    ]
    
    for (let i = 0; i < Math.min(masteredWords.length, reviewSchedules.length); i++) {
      const word = masteredWords[i]
      const schedule = reviewSchedules[i]
      
      const reviewDate = new Date()
      reviewDate.setDate(reviewDate.getDate() + schedule.days)
      
      const { error: updateError } = await supabase
        .from('user_flashcard_progress')
        .update({
          next_review: reviewDate.toISOString(),
          interval_days: schedule.interval,
          updated_at: new Date().toISOString()
        })
        .eq('id', word.id)
      
      if (updateError) {
        console.error(`❌ 更新单词 ${word.flashcard_id} 失败:`, updateError)
      } else {
        console.log(`✅ 更新单词 ${word.flashcard_id}: 复习时间=${reviewDate.toLocaleDateString()}, 间隔=${schedule.interval}天`)
      }
    }
    
    console.log('\n🎯 测试Today Review...')
    
    // 测试Today Review API
    const response = await fetch('http://localhost:3000/api/flashcards/enhanced?todayReviewOnly=true')
    const data = await response.json()
    
    console.log(`📋 Today Review结果: ${data.flashcards?.length || 0} 个单词需要复习`)
    
    if (data.flashcards && data.flashcards.length > 0) {
      console.log('\n📝 今日复习单词列表:')
      data.flashcards.forEach((card, index) => {
        const progress = card.userProgress
        const reviewDate = new Date(progress.next_review).toLocaleDateString()
        console.log(`   ${index + 1}. ${card.word} - 复习时间: ${reviewDate}, 间隔: ${progress.interval_days}天`)
      })
    }
    
    console.log('\n📊 统计信息:')
    console.log(`   总计: ${data.stats?.total || 0}`)
    console.log(`   需要复习: ${data.stats?.dueForReview || 0}`)
    console.log(`   已掌握: ${data.stats?.mastered || 0}`)
    
  } catch (error) {
    console.error('💥 模拟过程出错:', error)
  }
}

main().catch(console.error)