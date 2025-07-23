import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { DEMO_USER_UUID } from '@/lib/demo-user'

// SM2算法计算下次复习间隔
function calculateNextReview(
  currentEaseFactor: number,
  currentInterval: number,
  quality: number, // 0-5，5表示完全记住
  masteryLevel: number
) {
  let newEaseFactor = currentEaseFactor
  let newInterval = currentInterval
  let newMasteryLevel = masteryLevel

  if (quality >= 3) {
    // 回答正确
    newMasteryLevel = Math.min(5, masteryLevel + 1)
    
    if (masteryLevel === 0) {
      newInterval = 1
    } else if (masteryLevel === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(currentInterval * currentEaseFactor)
    }
    
    newEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  } else {
    // 回答错误，重置间隔但保持一定进度
    newMasteryLevel = Math.max(0, masteryLevel - 1)
    newInterval = 1
    newEaseFactor = Math.max(1.3, currentEaseFactor - 0.2)
  }

  newEaseFactor = Math.max(1.3, Math.min(2.5, newEaseFactor))
  
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval)

  return {
    newEaseFactor,
    newInterval,
    newMasteryLevel,
    nextReviewDate: nextReviewDate.toISOString(),
    isScheduled: true
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, word, isCorrect, responseTime, difficulty } = await request.json()
    const finalUserId = userId === 'demo-user-123' ? DEMO_USER_UUID : userId

    if (!word) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      )
    }

    console.log('Updating vocabulary progress:', { word, isCorrect, userId: finalUserId })

    // 获取flashcard信息
    const { data: flashcard, error: flashcardError } = await supabase
      .from('flashcards')
      .select('id, word')
      .eq('user_id', finalUserId)
      .eq('word', word.toLowerCase())
      .eq('type', 'vocabulary')
      .single()

    if (flashcardError || !flashcard) {
      console.error('Flashcard not found:', flashcardError)
      return NextResponse.json(
        { error: 'Flashcard not found' },
        { status: 404 }
      )
    }

    // 获取或创建进度记录
    const { data: existingProgress, error: progressError } = await supabase
      .from('user_flashcard_progress')
      .select('*')
      .eq('user_id', finalUserId)
      .eq('flashcard_id', flashcard.id)
      .single()

    const currentProgress = existingProgress || {
      mastery_level: 0,
      times_seen: 0,
      times_correct: 0,
      difficulty_rating: 3,
      interval_days: 1,
      ease_factor: 2.5,
      is_mastered: false
    }

    // 计算质量评分 (0-5)
    let quality = isCorrect ? 4 : 1
    if (isCorrect && responseTime) {
      // 基于响应时间调整质量评分
      if (responseTime < 3000) quality = 5 // 3秒内答对
      else if (responseTime < 8000) quality = 4 // 8秒内答对
      else quality = 3 // 较慢但正确
    }
    if (difficulty === 'easy' && isCorrect) quality = Math.min(5, quality + 1)
    if (difficulty === 'hard') quality = Math.max(1, quality - 1)

    // 使用SM2算法计算下次复习
    const {
      newEaseFactor,
      newInterval,
      newMasteryLevel,
      nextReviewDate
    } = calculateNextReview(
      currentProgress.ease_factor,
      currentProgress.interval_days,
      quality,
      currentProgress.mastery_level
    )

    const updatedProgress = {
      user_id: finalUserId,
      flashcard_id: flashcard.id,
      mastery_level: newMasteryLevel,
      times_seen: currentProgress.times_seen + 1,
      times_correct: currentProgress.times_correct + (isCorrect ? 1 : 0),
      last_seen: new Date().toISOString(),
      next_review_date: nextReviewDate,
      difficulty_rating: difficulty === 'easy' ? Math.max(1, currentProgress.difficulty_rating - 1) :
                        difficulty === 'hard' ? Math.min(5, currentProgress.difficulty_rating + 1) :
                        currentProgress.difficulty_rating,
      interval_days: newInterval,
      ease_factor: newEaseFactor,
      is_mastered: newMasteryLevel >= 4,
      updated_at: new Date().toISOString()
    }

    // 更新或插入进度
    const { data: updatedRecord, error: updateError } = await supabase
      .from('user_flashcard_progress')
      .upsert(updatedProgress)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating progress:', updateError)
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      )
    }

    console.log(`Updated progress for ${word}: mastery ${newMasteryLevel}/5, next review in ${newInterval} days`)

    return NextResponse.json({
      success: true,
      progress: updatedRecord,
      masteryLevel: newMasteryLevel,
      nextReviewDate,
      intervalDays: newInterval,
      message: newMasteryLevel >= 4 ? 'Word mastered!' : 
               newMasteryLevel > currentProgress.mastery_level ? 'Progress improved!' :
               'Keep practicing!'
    })

  } catch (error) {
    console.error('Error updating vocabulary progress:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const finalUserId = userId === 'demo-user-123' ? DEMO_USER_UUID : userId || DEMO_USER_UUID

    // 获取用户所有vocabulary进度
    const { data: progress, error } = await supabase
      .from('user_flashcard_progress')
      .select(`
        *,
        flashcards (
          word,
          definition,
          pronunciation,
          example_sentence
        )
      `)
      .eq('user_id', finalUserId)
      .order('next_review_date', { ascending: true })

    if (error) {
      console.error('Error fetching vocabulary progress:', error)
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      )
    }

    const now = new Date()
    const dueForReview = progress?.filter(p => 
      new Date(p.next_review_date) <= now && !p.is_mastered
    ) || []

    return NextResponse.json({
      success: true,
      totalWords: progress?.length || 0,
      masteredWords: progress?.filter(p => p.is_mastered).length || 0,
      dueForReview: dueForReview.length,
      progress: progress || [],
      dueWords: dueForReview
    })

  } catch (error) {
    console.error('Error fetching vocabulary progress:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}