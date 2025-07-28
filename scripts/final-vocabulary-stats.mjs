#!/usr/bin/env node

/**
 * 最终词汇统计脚本
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

async function main() {
  console.log('📊 最终词汇数据库统计分析')
  console.log('=' * 50)
  
  try {
    // 获取所有词汇
    const { data: allWords, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', DEMO_USER_ID)
    
    if (error) {
      console.error('❌ 查询错误:', error)
      return
    }
    
    console.log(`📚 总词汇数量: ${allWords.length}`)
    
    // 按来源分类
    const sourceStats = {}
    allWords.forEach(word => {
      const source = word.source_type || 'unknown'
      sourceStats[source] = (sourceStats[source] || 0) + 1
    })
    
    console.log('\n📊 按来源分类:')
    Object.entries(sourceStats).forEach(([source, count]) => {
      const percentage = ((count / allWords.length) * 100).toFixed(1)
      console.log(`   ${source}: ${count} (${percentage}%)`)
    })
    
    // 按难度分类
    const difficultyStats = { 1: 0, 2: 0, 3: 0 }
    allWords.forEach(word => {
      const difficulty = word.difficulty_level || 2
      difficultyStats[difficulty] = (difficultyStats[difficulty] || 0) + 1
    })
    
    console.log('\n🎯 按难度分类:')
    console.log(`   简单 (Level 1): ${difficultyStats[1]}`)
    console.log(`   中等 (Level 2): ${difficultyStats[2]}`)
    console.log(`   困难 (Level 3): ${difficultyStats[3]}`)
    
    // 检查唯一性
    const uniqueWords = new Set(allWords.map(w => w.word?.toLowerCase()).filter(Boolean))
    console.log(`\n🔍 唯一单词数量: ${uniqueWords.size}`)
    
    if (uniqueWords.size !== allWords.length) {
      console.log(`⚠️  发现 ${allWords.length - uniqueWords.size} 个重复记录`)
    } else {
      console.log(`✅ 所有记录都是唯一的`)
    }
    
    // SSAT文件提取的词汇
    const ssatWords = allWords.filter(w => w.source_type === 'uploaded_content')
    console.log(`\n📁 从SSAT测试文件提取: ${ssatWords.length} 个词汇`)
    
    // 显示一些示例词汇
    console.log('\n📝 示例词汇 (前10个):')
    ssatWords.slice(0, 10).forEach((word, index) => {
      console.log(`   ${index + 1}. ${word.word} - ${word.definition?.substring(0, 50)}...`)
    })
    
    // 检查完整性
    const incompleteWords = allWords.filter(w => 
      !w.word || !w.definition || !w.pronunciation
    )
    
    if (incompleteWords.length > 0) {
      console.log(`\n⚠️  ${incompleteWords.length} 个词汇缺少完整信息`)
    } else {
      console.log(`\n✅ 所有词汇都有完整信息`)
    }
    
    console.log('\n🎉 分析完成!')
    console.log(`✅ 数据库包含 ${uniqueWords.size} 个唯一的高质量词汇`)
    console.log(`📁 其中 ${ssatWords.length} 个来自真实SSAT测试材料`)
    console.log(`📈 SSAT词汇占比: ${((ssatWords.length / allWords.length) * 100).toFixed(1)}%`)
    
  } catch (error) {
    console.error('💥 分析错误:', error)
  }
}

main().catch(console.error)