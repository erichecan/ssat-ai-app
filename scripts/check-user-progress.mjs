import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUserProgress() {
  console.log('🔍 Checking user flashcard progress...')
  
  try {
    const userId = '00000000-0000-0000-0000-000000000001' // Demo user
    
    // 检查用户进度数据
    const { data: progressData, error: progressError } = await supabase
      .from('user_flashcard_progress')
      .select('*')
      .eq('user_id', userId)
    
    if (progressError) {
      console.error('Error fetching progress:', progressError)
      return
    }
    
    console.log(`📊 Found ${progressData?.length || 0} progress records`)
    
    if (progressData && progressData.length > 0) {
      // 统计信息
      const mastered = progressData.filter(p => p.is_mastered).length
      const learning = progressData.filter(p => !p.is_mastered && p.times_seen > 0).length
      const newWords = progressData.filter(p => p.times_seen === 0).length
      const dueForReview = progressData.filter(p => 
        new Date(p.next_review) <= new Date() && !p.is_mastered
      ).length
      const masteredDueForReview = progressData.filter(p => 
        new Date(p.next_review) <= new Date() && p.is_mastered
      ).length
      
      console.log('\n📈 Progress Statistics:')
      console.log(`   Mastered words: ${mastered}`)
      console.log(`   Learning words: ${learning}`)
      console.log(`   New words: ${newWords}`)
      console.log(`   Due for review (learning): ${dueForReview}`)
      console.log(`   Due for review (mastered): ${masteredDueForReview}`)
      
      // 显示最近的进度记录
      console.log('\n📝 Recent Progress Records:')
      const recentProgress = progressData
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
        .slice(0, 5)
      
      recentProgress.forEach((progress, index) => {
        console.log(`   ${index + 1}. ${progress.flashcard_id}`)
        console.log(`      Mastery: ${progress.mastery_level || 0}/4, Seen: ${progress.times_seen}, Correct: ${progress.times_correct}`)
        console.log(`      Next review: ${progress.next_review}`)
        console.log(`      Mastered: ${progress.is_mastered ? 'Yes' : 'No'}`)
        console.log('')
      })
    }
    
    // 检查Today Review模式的数据
    console.log('\n🎯 Today Review Mode Check:')
    const { data: todayReviewData, error: todayReviewError } = await supabase
      .from('user_flashcard_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('is_mastered', true)
      .lte('next_review', new Date().toISOString())
    
    if (todayReviewError) {
      console.error('Error fetching today review data:', todayReviewError)
    } else {
      console.log(`   Found ${todayReviewData?.length || 0} mastered words due for review today`)
      
      if (todayReviewData && todayReviewData.length > 0) {
        console.log('   Due words:')
        todayReviewData.forEach((progress, index) => {
          const daysOverdue = Math.floor((new Date().getTime() - new Date(progress.next_review).getTime()) / (1000 * 60 * 60 * 24))
          console.log(`     ${index + 1}. ${progress.flashcard_id} (${daysOverdue} days overdue)`)
        })
      }
    }
    
  } catch (error) {
    console.error('Error checking user progress:', error)
  }
}

checkUserProgress() 