import { supabase } from './supabase'
import { Database } from '@/types/database'

type MistakeQuestion = Database['public']['Tables']['mistake_questions']['Row']
type MistakeQuestionInsert = Database['public']['Tables']['mistake_questions']['Insert']
type MistakeQuestionUpdate = Database['public']['Tables']['mistake_questions']['Update']

export interface MistakeWithQuestion extends MistakeQuestion {
  questions: {
    id: string
    type: string
    difficulty: string
    question: string
    options: string[]
    correct_answer: string
    explanation: string
    tags: string[]
  }
}

export interface MistakeStats {
  totalMistakes: number
  newMistakes: number
  learningMistakes: number
  reviewMistakes: number
  masteredMistakes: number
  byTopic: {
    [key: string]: number
  }
  byDifficulty: {
    [key: string]: number
  }
}

export class MistakeSystem {
  /**
   * Add a question to the mistake book
   */
  async addMistake(
    userId: string,
    questionId: string,
    tags: string[] = [],
    userNotes?: string
  ): Promise<void> {
    try {
      // Check if mistake already exists
      const { data: existing } = await supabase
        .from('mistake_questions')
        .select('*')
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .single()
      
      if (existing) {
        // Update existing mistake
        await supabase
          .from('mistake_questions')
          .update({
            mistake_count: existing.mistake_count + 1,
            last_mistake_at: new Date().toISOString(),
            mastery_level: Math.max(0, existing.mastery_level - 1), // Reduce mastery level
            tags: Array.from(new Set([...existing.tags, ...tags])),
            user_notes: userNotes || existing.user_notes
          })
          .eq('id', existing.id)
      } else {
        // Insert new mistake
        await supabase
          .from('mistake_questions')
          .insert({
            user_id: userId,
            question_id: questionId,
            tags,
            user_notes: userNotes
          })
      }
      
      // Update user stats
      await this.updateUserStats(userId)
    } catch (error) {
      console.error('Error adding mistake:', error)
      throw error
    }
  }
  
  /**
   * Update mastery level of a mistake
   */
  async updateMasteryLevel(
    userId: string,
    mistakeId: string,
    newLevel: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('mistake_questions')
        .update({
          mastery_level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', mistakeId)
        .eq('user_id', userId)
      
      if (error) throw error
      
      // Update user stats
      await this.updateUserStats(userId)
    } catch (error) {
      console.error('Error updating mastery level:', error)
      throw error
    }
  }
  
  /**
   * Get all mistakes for a user
   */
  async getMistakes(
    userId: string,
    filters?: {
      masteryLevel?: number
      topic?: string
      difficulty?: string
      tags?: string[]
      limit?: number
    }
  ): Promise<MistakeWithQuestion[]> {
    try {
      let query = supabase
        .from('mistake_questions')
        .select(`
          *,
          questions!inner(*)
        `)
        .eq('user_id', userId)
        .order('last_mistake_at', { ascending: false })
      
      // Apply filters
      if (filters?.masteryLevel !== undefined) {
        query = query.eq('mastery_level', filters.masteryLevel)
      }
      
      if (filters?.topic) {
        query = query.eq('questions.type', filters.topic)
      }
      
      if (filters?.difficulty) {
        query = query.eq('questions.difficulty', filters.difficulty)
      }
      
      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      return data as MistakeWithQuestion[]
    } catch (error) {
      console.error('Error getting mistakes:', error)
      throw error
    }
  }
  
  /**
   * Get mistakes due for review
   */
  async getMistakesDueForReview(userId: string): Promise<MistakeWithQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('mistake_questions')
        .select(`
          *,
          questions!inner(*)
        `)
        .eq('user_id', userId)
        .lte('next_review_at', new Date().toISOString())
        .lt('mastery_level', 3) // Not mastered yet
        .order('next_review_at', { ascending: true })
        .limit(20)
      
      if (error) throw error
      
      return data as MistakeWithQuestion[]
    } catch (error) {
      console.error('Error getting mistakes due for review:', error)
      throw error
    }
  }
  
  /**
   * Mark a mistake as reviewed
   */
  async markAsReviewed(
    userId: string,
    mistakeId: string,
    wasCorrect: boolean
  ): Promise<void> {
    try {
      const { data: mistake } = await supabase
        .from('mistake_questions')
        .select('*')
        .eq('id', mistakeId)
        .eq('user_id', userId)
        .single()
      
      if (!mistake) return
      
      let newMasteryLevel = mistake.mastery_level
      
      if (wasCorrect) {
        // Increase mastery level
        newMasteryLevel = Math.min(3, mistake.mastery_level + 1)
      } else {
        // Decrease mastery level
        newMasteryLevel = Math.max(0, mistake.mastery_level - 1)
        
        // Add to mistake count
        await supabase
          .from('mistake_questions')
          .update({
            mistake_count: mistake.mistake_count + 1,
            last_mistake_at: new Date().toISOString()
          })
          .eq('id', mistakeId)
      }
      
      // Update mastery level
      await supabase
        .from('mistake_questions')
        .update({
          mastery_level: newMasteryLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', mistakeId)
      
      // Update user stats
      await this.updateUserStats(userId)
    } catch (error) {
      console.error('Error marking as reviewed:', error)
      throw error
    }
  }
  
  /**
   * Get mistake statistics for a user
   */
  async getMistakeStats(userId: string): Promise<MistakeStats> {
    try {
      const { data: mistakes } = await supabase
        .from('mistake_questions')
        .select(`
          *,
          questions!inner(type, difficulty)
        `)
        .eq('user_id', userId)
      
      if (!mistakes) {
        return {
          totalMistakes: 0,
          newMistakes: 0,
          learningMistakes: 0,
          reviewMistakes: 0,
          masteredMistakes: 0,
          byTopic: {},
          byDifficulty: {}
        }
      }
      
      const stats: MistakeStats = {
        totalMistakes: mistakes.length,
        newMistakes: 0,
        learningMistakes: 0,
        reviewMistakes: 0,
        masteredMistakes: 0,
        byTopic: {},
        byDifficulty: {}
      }
      
      mistakes.forEach(mistake => {
        // Count by mastery level
        switch (mistake.mastery_level) {
          case 0:
            stats.newMistakes++
            break
          case 1:
            stats.learningMistakes++
            break
          case 2:
            stats.reviewMistakes++
            break
          case 3:
            stats.masteredMistakes++
            break
        }
        
        // Count by topic
        const topic = (mistake as any).questions.type
        stats.byTopic[topic] = (stats.byTopic[topic] || 0) + 1
        
        // Count by difficulty
        const difficulty = (mistake as any).questions.difficulty
        stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1
      })
      
      return stats
    } catch (error) {
      console.error('Error getting mistake stats:', error)
      throw error
    }
  }
  
  /**
   * Add notes to a mistake
   */
  async addNotes(
    userId: string,
    mistakeId: string,
    notes: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('mistake_questions')
        .update({
          user_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', mistakeId)
        .eq('user_id', userId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error adding notes:', error)
      throw error
    }
  }
  
  /**
   * Add tags to a mistake
   */
  async addTags(
    userId: string,
    mistakeId: string,
    tags: string[]
  ): Promise<void> {
    try {
      const { data: mistake } = await supabase
        .from('mistake_questions')
        .select('tags')
        .eq('id', mistakeId)
        .eq('user_id', userId)
        .single()
      
      if (!mistake) return
      
      const newTags = Array.from(new Set([...mistake.tags, ...tags]))
      
      const { error } = await supabase
        .from('mistake_questions')
        .update({
          tags: newTags,
          updated_at: new Date().toISOString()
        })
        .eq('id', mistakeId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error adding tags:', error)
      throw error
    }
  }
  
  /**
   * Remove a mistake from the book
   */
  async removeMistake(userId: string, mistakeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('mistake_questions')
        .delete()
        .eq('id', mistakeId)
        .eq('user_id', userId)
      
      if (error) throw error
      
      // Update user stats
      await this.updateUserStats(userId)
    } catch (error) {
      console.error('Error removing mistake:', error)
      throw error
    }
  }
  
  /**
   * Update user statistics
   */
  private async updateUserStats(userId: string): Promise<void> {
    try {
      const stats = await this.getMistakeStats(userId)
      
      const { error } = await supabase
        .from('users')
        .update({
          total_mistakes: stats.totalMistakes,
          mastered_mistakes: stats.masteredMistakes
        })
        .eq('id', userId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error updating user stats:', error)
    }
  }
}

export const mistakeSystem = new MistakeSystem()

// Helper function to automatically add mistakes when user answers incorrectly
export async function handleIncorrectAnswer(
  userId: string,
  questionId: string,
  userAnswer: string,
  correctAnswer: string,
  sessionId?: string
) {
  try {
    // Record the answer in user_answers table
    await supabase
      .from('user_answers')
      .insert({
        user_id: userId,
        question_id: questionId,
        session_id: sessionId || null,
        user_answer: userAnswer,
        is_correct: false,
        time_taken: 0 // Will be updated by the client
      })
    
    // Add to mistake book
    await mistakeSystem.addMistake(userId, questionId)
    
    return true
  } catch (error) {
    console.error('Error handling incorrect answer:', error)
    return false
  }
}