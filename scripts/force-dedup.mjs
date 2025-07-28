#!/usr/bin/env node

/**
 * 强制去重脚本 - 直接SQL操作
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

async function main() {
  console.log('🧹 强制去重开始...')
  
  try {
    // 方法：创建临时表，插入去重数据，删除原表数据，插入回去
    
    // 1. 获取所有唯一词汇（保留最早的记录）
    const { data: uniqueWords, error: selectError } = await supabase.rpc('get_unique_flashcards', {
      target_user_id: DEMO_USER_ID
    })
    
    if (selectError) {
      console.error('❌ 获取唯一词汇失败，使用备用方案...')
      
      // 备用方案：手动去重
      const { data: allWords, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', DEMO_USER_ID)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('❌ 查询失败:', error)
        return
      }
      
      console.log(`📊 找到 ${allWords.length} 条记录`)
      
      // 手动去重
      const wordMap = new Map()
      const duplicateIds = []
      
      for (const word of allWords) {
        const key = word.word?.toLowerCase()
        if (!key) continue
        
        if (!wordMap.has(key)) {
          wordMap.set(key, word)
        } else {
          duplicateIds.push(word.id)
        }
      }
      
      console.log(`🔍 发现 ${duplicateIds.length} 个重复记录`)
      console.log(`✅ 保留 ${wordMap.size} 个唯一词汇`)
      
      // 分批删除重复项
      if (duplicateIds.length > 0) {
        const batchSize = 50
        let deletedCount = 0
        
        for (let i = 0; i < duplicateIds.length; i += batchSize) {
          const batch = duplicateIds.slice(i, i + batchSize)
          
          const { error: deleteError } = await supabase
            .from('flashcards')
            .delete()
            .in('id', batch)
          
          if (deleteError) {
            console.error(`❌ 删除批次 ${i/batchSize + 1} 失败:`, deleteError)
          } else {
            deletedCount += batch.length
            console.log(`🗑️  删除批次 ${Math.floor(i/batchSize) + 1}: ${batch.length} 条记录`)
          }
          
          // 短暂延迟
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        console.log(`✅ 成功删除 ${deletedCount} 个重复记录`)
      }
    }
    
    // 验证结果
    const { data: finalWords, error: finalError } = await supabase
      .from('flashcards')
      .select('word', { count: 'exact' })
      .eq('user_id', DEMO_USER_ID)
    
    if (finalError) {
      console.error('❌ 最终验证失败:', finalError)
    } else {
      console.log(`🎉 去重完成！最终词汇数量: ${finalWords.length}`)
      
      // 检查是否还有重复
      const { data: wordCounts } = await supabase
        .from('flashcards')
        .select('word')
        .eq('user_id', DEMO_USER_ID)
      
      const uniqueCheck = new Set(wordCounts?.map(w => w.word?.toLowerCase()).filter(Boolean))
      
      if (uniqueCheck.size === wordCounts?.length) {
        console.log('✅ 确认：所有词汇都是唯一的')
      } else {
        console.log(`⚠️  警告：仍有 ${(wordCounts?.length || 0) - uniqueCheck.size} 个重复`)
      }
    }
    
  } catch (error) {
    console.error('💥 去重过程出错:', error)
  }
}

main().catch(console.error)