import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { flashcards, getFlashcardsByDifficulty, getFlashcardsByCategory, searchFlashcards, getRandomFlashcards, getFlashcardStats } from '@/lib/flashcard-bank'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface UserFlashcardProgress {
  id?: string
  user_id: string
  flashcard_id: string
  mastery_level: number // 0-5 scale
  times_seen: number
  times_correct: number
  last_seen: string
  next_review: string
  difficulty_rating: number // User's personal difficulty rating 1-5
  created_at?: string
  updated_at?: string
}

// Get flashcards with user progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const difficulty = searchParams.get('difficulty') as 'easy' | 'medium' | 'hard' | null
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const random = searchParams.get('random') === 'true'
    const statsOnly = searchParams.get('stats') === 'true'

    // Return stats only if requested
    if (statsOnly) {
      const stats = getFlashcardStats()
      return NextResponse.json({
        success: true,
        stats
      })
    }

    // Filter flashcards based on parameters
    let filteredFlashcards = flashcards

    if (difficulty) {
      filteredFlashcards = getFlashcardsByDifficulty(difficulty)
    }

    if (category) {
      filteredFlashcards = getFlashcardsByCategory(category)
    }

    if (search) {
      filteredFlashcards = searchFlashcards(search)
    }

    if (random) {
      filteredFlashcards = getRandomFlashcards(limit)
    } else {
      filteredFlashcards = filteredFlashcards.slice(0, limit)
    }

    // Get user progress if userId is provided
    let userProgress: UserFlashcardProgress[] = []
    if (userId) {
      const { data: progressData, error: progressError } = await supabase
        .from('user_flashcard_progress')
        .select('*')
        .eq('user_id', userId)
        .in('flashcard_id', filteredFlashcards.map(f => f.id))

      if (progressError) {
        console.error('Error fetching flashcard progress:', progressError)
      } else {
        userProgress = progressData || []
      }
    }

    // Combine flashcards with user progress
    const flashcardsWithProgress = filteredFlashcards.map(flashcard => {
      const progress = userProgress.find(p => p.flashcard_id === flashcard.id)
      return {
        ...flashcard,
        userProgress: progress || null
      }
    })

    return NextResponse.json({
      success: true,
      flashcards: flashcardsWithProgress,
      total: filteredFlashcards.length,
      filters: { difficulty, category, search, random, limit }
    })

  } catch (error) {
    console.error('Flashcards API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flashcards' },
      { status: 500 }
    )
  }
}

// Update user progress for a flashcard
export async function POST(request: NextRequest) {
  try {
    const { userId, flashcardId, isCorrect, difficultyRating } = await request.json()
    
    if (!userId || !flashcardId) {
      return NextResponse.json(
        { error: 'User ID and flashcard ID are required' },
        { status: 400 }
      )
    }

    // Get existing progress
    const { data: existingProgress, error: fetchError } = await supabase
      .from('user_flashcard_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('flashcard_id', flashcardId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching flashcard progress:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      )
    }

    const now = new Date().toISOString()
    
    if (existingProgress) {
      // Update existing progress
      const newTimesCorrect = isCorrect ? existingProgress.times_correct + 1 : existingProgress.times_correct
      const newTimesSeen = existingProgress.times_seen + 1
      const accuracy = newTimesSeen > 0 ? newTimesCorrect / newTimesSeen : 0
      
      // Calculate new mastery level (0-5 scale based on accuracy and frequency)
      let newMasteryLevel = existingProgress.mastery_level
      if (isCorrect) {
        newMasteryLevel = Math.min(5, newMasteryLevel + 0.2)
      } else {
        newMasteryLevel = Math.max(0, newMasteryLevel - 0.3)
      }

      // Calculate next review date using spaced repetition
      const hoursUntilNextReview = calculateNextReviewHours(newMasteryLevel, newTimesSeen)
      const nextReview = new Date(Date.now() + hoursUntilNextReview * 60 * 60 * 1000).toISOString()

      const updateData = {
        mastery_level: newMasteryLevel,
        times_seen: newTimesSeen,
        times_correct: newTimesCorrect,
        last_seen: now,
        next_review: nextReview,
        difficulty_rating: difficultyRating || existingProgress.difficulty_rating,
        updated_at: now
      }

      const { error: updateError } = await supabase
        .from('user_flashcard_progress')
        .update(updateData)
        .eq('user_id', userId)
        .eq('flashcard_id', flashcardId)

      if (updateError) {
        console.error('Error updating flashcard progress:', updateError)
        return NextResponse.json(
          { error: 'Failed to update progress' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        progress: { ...existingProgress, ...updateData },
        message: 'Progress updated successfully'
      })
    } else {
      // Create new progress record
      const initialMasteryLevel = isCorrect ? 1 : 0
      const hoursUntilNextReview = calculateNextReviewHours(initialMasteryLevel, 1)
      const nextReview = new Date(Date.now() + hoursUntilNextReview * 60 * 60 * 1000).toISOString()

      const newProgress: UserFlashcardProgress = {
        user_id: userId,
        flashcard_id: flashcardId,
        mastery_level: initialMasteryLevel,
        times_seen: 1,
        times_correct: isCorrect ? 1 : 0,
        last_seen: now,
        next_review: nextReview,
        difficulty_rating: difficultyRating || 3,
        created_at: now,
        updated_at: now
      }

      const { data: createdProgress, error: createError } = await supabase
        .from('user_flashcard_progress')
        .insert(newProgress)
        .select()
        .single()

      if (createError) {
        console.error('Error creating flashcard progress:', createError)
        return NextResponse.json(
          { error: 'Failed to create progress' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        progress: createdProgress,
        message: 'Progress created successfully'
      })
    }

  } catch (error) {
    console.error('Flashcard progress API error:', error)
    return NextResponse.json(
      { error: 'Failed to update flashcard progress' },
      { status: 500 }
    )
  }
}

// Calculate next review hours using spaced repetition algorithm
function calculateNextReviewHours(masteryLevel: number, timesSeen: number): number {
  // Base intervals in hours: immediate, 1 hour, 4 hours, 1 day, 3 days, 1 week, 2 weeks
  const baseIntervals = [0, 1, 4, 24, 72, 168, 336]
  
  // Adjust based on mastery level (0-5)
  const masteryMultiplier = Math.max(0.1, masteryLevel / 5)
  
  // Calculate interval index based on times seen
  const intervalIndex = Math.min(timesSeen, baseIntervals.length - 1)
  
  // Get base interval and apply mastery multiplier
  const baseHours = baseIntervals[intervalIndex]
  const adjustedHours = baseHours * masteryMultiplier
  
  // Add some randomness (±20%) to avoid review clustering
  const randomFactor = 0.8 + Math.random() * 0.4 // 0.8 to 1.2
  
  return Math.max(1, adjustedHours * randomFactor) // Minimum 1 hour
}