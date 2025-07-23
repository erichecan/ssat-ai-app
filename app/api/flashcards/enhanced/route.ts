import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { flashcards as staticFlashcards } from '@/lib/flashcard-bank'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface EbbinghausCalculation {
  nextInterval: number
  nextEaseFactor: number
  nextReviewDate: string
}

// 获取增强的flashcards（支持动态词汇、掌握状态、艾宾浩斯曲线）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'demo-user-123'
    const dueOnly = searchParams.get('dueOnly') === 'true' // 只返回需要复习的
    const masteredOnly = searchParams.get('masteredOnly') === 'true' // 只返回已掌握的
    const limit = parseInt(searchParams.get('limit') || '20')

    console.log('Enhanced flashcards API called:', { userId, dueOnly, masteredOnly, limit })

    // 1. 获取用户的flashcard进度数据
    let progressQuery = supabase
      .from('user_flashcard_progress')
      .select('*')
      .eq('user_id', userId)

    if (dueOnly) {
      progressQuery = progressQuery
        .lte('next_review', new Date().toISOString())
        .eq('is_mastered', false)
    }

    if (masteredOnly) {
      progressQuery = progressQuery.eq('is_mastered', true)
    }

    const { data: progressData, error: progressError } = await progressQuery
      .order('next_review', { ascending: true })
      .limit(limit)

    if (progressError) {
      console.error('Error fetching flashcard progress:', progressError)
      return NextResponse.json(
        { error: 'Failed to fetch flashcard progress' },
        { status: 500 }
      )
    }

    // 2. 获取动态添加的flashcards
    const { data: dynamicFlashcards, error: dynamicError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)

    if (dynamicError) {
      console.error('Error fetching dynamic flashcards:', dynamicError)
    }

    // 3. 合并静态和动态flashcards
    const allFlashcards: any[] = []

    // 处理进度数据对应的flashcards
    for (const progress of progressData || []) {
      let flashcard = null

      // 从静态flashcard bank查找
      const staticFlashcard = staticFlashcards.find(f => f.id === progress.flashcard_id)
      if (staticFlashcard) {
        flashcard = {
          ...staticFlashcard,
          source: 'static',
          userProgress: progress
        }
      } else {
        // 从动态flashcards表查找
        const dynamicFlashcard = dynamicFlashcards?.find(f => 
          f.word === progress.flashcard_id || f.id === progress.flashcard_id
        )
        if (dynamicFlashcard) {
          flashcard = {
            id: dynamicFlashcard.word || dynamicFlashcard.id,
            word: dynamicFlashcard.word,
            pronunciation: dynamicFlashcard.pronunciation,
            part_of_speech: dynamicFlashcard.part_of_speech,
            definition: dynamicFlashcard.definition,
            example_sentence: dynamicFlashcard.example_sentence,
            memory_tip: dynamicFlashcard.memory_tip,
            synonyms: dynamicFlashcard.synonyms || [],
            antonyms: dynamicFlashcard.antonyms || [],
            etymology: dynamicFlashcard.etymology,
            category: dynamicFlashcard.category || 'vocabulary',
            difficulty: 'medium', // 默认难度
            frequency_score: dynamicFlashcard.frequency_score || 50,
            source: 'dynamic',
            userProgress: progress
          }
        }
      }

      if (flashcard) {
        allFlashcards.push(flashcard)
      }
    }

    // 4. 计算统计信息
    const stats = {
      total: progressData?.length || 0,
      dueForReview: progressData?.filter(p => 
        new Date(p.next_review) <= new Date() && !p.is_mastered
      ).length || 0,
      mastered: progressData?.filter(p => p.is_mastered).length || 0,
      learning: progressData?.filter(p => 
        p.mastery_level > 0 && p.mastery_level < 4 && !p.is_mastered
      ).length || 0,
      new: progressData?.filter(p => p.times_seen === 0).length || 0
    }

    return NextResponse.json({
      success: true,
      flashcards: allFlashcards,
      stats,
      filters: { dueOnly, masteredOnly, limit }
    })

  } catch (error) {
    console.error('Enhanced flashcards API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enhanced flashcards' },
      { status: 500 }
    )
  }
}

// 更新flashcard进度（支持掌握功能和艾宾浩斯算法）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId = 'demo-user-123', 
      flashcardId, 
      action, 
      quality, // 0-5 质量评分，用于艾宾浩斯算法
      isCorrect,
      difficultyRating 
    } = body
    
    if (!flashcardId) {
      return NextResponse.json(
        { error: 'Flashcard ID is required' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // 获取现有进度
    const { data: existingProgress, error: fetchError } = await supabase
      .from('user_flashcard_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('flashcard_id', flashcardId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching progress:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      )
    }

    // 处理不同的动作
    if (action === 'master') {
      // 标记为已掌握
      const updateData = {
        is_mastered: true,
        mastery_level: 4, // 设置为最高掌握级别
        updated_at: now
      }

      if (existingProgress) {
        await supabase
          .from('user_flashcard_progress')
          .update(updateData)
          .eq('user_id', userId)
          .eq('flashcard_id', flashcardId)
      } else {
        await supabase
          .from('user_flashcard_progress')
          .insert({
            user_id: userId,
            flashcard_id: flashcardId,
            ...updateData,
            times_seen: 1,
            times_correct: 1,
            interval_days: 999, // 很长的间隔，实际上不会复习
            ease_factor: 2.5,
            next_review: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: now
          })
      }

      return NextResponse.json({
        success: true,
        message: 'Word marked as mastered'
      })
    }

    if (action === 'unmaster') {
      // 取消掌握状态
      const updateData = {
        is_mastered: false,
        next_review: now, // 立即安排复习
        updated_at: now
      }

      await supabase
        .from('user_flashcard_progress')
        .update(updateData)
        .eq('user_id', userId)
        .eq('flashcard_id', flashcardId)

      return NextResponse.json({
        success: true,
        message: 'Word unmarked, ready for review'
      })
    }

    if (action === 'review' && typeof quality === 'number') {
      // 使用艾宾浩斯算法更新复习进度
      const currentProgress = existingProgress || {
        times_seen: 0,
        times_correct: 0,
        interval_days: 1,
        ease_factor: 2.5,
        mastery_level: 0
      }

      // 计算下次复习时间
      const ebbinghausResult = calculateEbbinghausReview(
        currentProgress.ease_factor || 2.5,
        currentProgress.interval_days || 1,
        quality
      )

      // 更新统计
      const newTimesSeen = currentProgress.times_seen + 1
      const newTimesCorrect = currentProgress.times_correct + (quality >= 3 ? 1 : 0)
      const accuracy = newTimesSeen > 0 ? newTimesCorrect / newTimesSeen : 0

      // 更新掌握级别
      let newMasteryLevel = currentProgress.mastery_level || 0
      if (quality >= 4) {
        newMasteryLevel = Math.min(4, newMasteryLevel + 0.5)
      } else if (quality >= 3) {
        newMasteryLevel = Math.min(4, newMasteryLevel + 0.2)
      } else {
        newMasteryLevel = Math.max(0, newMasteryLevel - 0.3)
      }

      const updateData = {
        times_seen: newTimesSeen,
        times_correct: newTimesCorrect,
        interval_days: ebbinghausResult.nextInterval,
        ease_factor: ebbinghausResult.nextEaseFactor,
        next_review: ebbinghausResult.nextReviewDate,
        mastery_level: newMasteryLevel,
        difficulty_rating: difficultyRating || currentProgress.difficulty_rating || 3,
        last_seen: now,
        updated_at: now
      }

      if (existingProgress) {
        await supabase
          .from('user_flashcard_progress')
          .update(updateData)
          .eq('user_id', userId)
          .eq('flashcard_id', flashcardId)
      } else {
        await supabase
          .from('user_flashcard_progress')
          .insert({
            user_id: userId,
            flashcard_id: flashcardId,
            ...updateData,
            created_at: now
          })
      }

      return NextResponse.json({
        success: true,
        progress: updateData,
        nextReview: ebbinghausResult.nextReviewDate,
        message: `Review updated, next review in ${ebbinghausResult.nextInterval} days`
      })
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Enhanced flashcard update error:', error)
    return NextResponse.json(
      { error: 'Failed to update flashcard progress' },
      { status: 500 }
    )
  }
}

// 艾宾浩斯遗忘曲线算法实现
function calculateEbbinghausReview(
  easeFactor: number,
  intervalDays: number,
  quality: number // 0-5 质量评分
): EbbinghausCalculation {
  let newInterval: number
  let newEaseFactor = easeFactor

  if (quality < 3) {
    // 答错了，重新开始
    newInterval = 1
  } else {
    // 答对了，根据艾宾浩斯曲线计算
    if (intervalDays === 1) {
      newInterval = 6 // 第一次正确：6天后
    } else if (intervalDays <= 6) {
      newInterval = 15 // 第二次正确：15天后
    } else {
      // 后续：根据难度系数计算
      newInterval = Math.round(intervalDays * newEaseFactor)
    }

    // 调整难度系数
    newEaseFactor = newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    newEaseFactor = Math.max(newEaseFactor, 1.3) // 最小难度系数
  }

  const nextReviewDate = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000).toISOString()

  return {
    nextInterval: newInterval,
    nextEaseFactor: newEaseFactor,
    nextReviewDate
  }
}