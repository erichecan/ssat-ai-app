export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          full_name: string | null
          avatar_url: string | null
          grade: string | null
          target_score: number | null
          current_level: number
          total_points: number
          learning_preferences: Record<string, any>
          total_mistakes: number
          mastered_mistakes: number
          ai_interactions_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          grade?: string | null
          target_score?: number | null
          current_level?: number
          total_points?: number
          learning_preferences?: Record<string, any>
          total_mistakes?: number
          mastered_mistakes?: number
          ai_interactions_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          grade?: string | null
          target_score?: number | null
          current_level?: number
          total_points?: number
          learning_preferences?: Record<string, any>
          total_mistakes?: number
          mastered_mistakes?: number
          ai_interactions_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          type: 'vocabulary' | 'reading' | 'math' | 'writing'
          difficulty: 'easy' | 'medium' | 'hard'
          question: string
          options: string[]
          correct_answer: string
          explanation: string
          tags: string[]
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          type: 'vocabulary' | 'reading' | 'math' | 'writing'
          difficulty: 'easy' | 'medium' | 'hard'
          question: string
          options: string[]
          correct_answer: string
          explanation: string
          tags?: string[]
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          type?: 'vocabulary' | 'reading' | 'math' | 'writing'
          difficulty?: 'easy' | 'medium' | 'hard'
          question?: string
          options?: string[]
          correct_answer?: string
          explanation?: string
          tags?: string[]
          created_at?: string
          created_by?: string | null
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_type: 'practice' | 'test' | 'flashcard'
          questions_attempted: number
          questions_correct: number
          total_time: number
          score: number
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_type: 'practice' | 'test' | 'flashcard'
          questions_attempted: number
          questions_correct: number
          total_time: number
          score: number
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_type?: 'practice' | 'test' | 'flashcard'
          questions_attempted?: number
          questions_correct?: number
          total_time?: number
          score?: number
          completed_at?: string
          created_at?: string
        }
      }
      user_answers: {
        Row: {
          id: string
          user_id: string
          question_id: string
          session_id: string | null
          user_answer: string
          is_correct: boolean
          time_taken: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          session_id?: string | null
          user_answer: string
          is_correct: boolean
          time_taken: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          session_id?: string | null
          user_answer?: string
          is_correct?: boolean
          time_taken?: number
          created_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          condition_type: string
          condition_value: number
          points_reward: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon: string
          condition_type: string
          condition_value: number
          points_reward: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          condition_type?: string
          condition_value?: number
          points_reward?: number
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string
        }
      }
      mistake_questions: {
        Row: {
          id: string
          user_id: string
          question_id: string
          mistake_count: number
          last_mistake_at: string
          next_review_at: string
          mastery_level: number
          tags: string[]
          user_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          mistake_count?: number
          last_mistake_at?: string
          next_review_at?: string
          mastery_level?: number
          tags?: string[]
          user_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          mistake_count?: number
          last_mistake_at?: string
          next_review_at?: string
          mastery_level?: number
          tags?: string[]
          user_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          question_id: string | null
          user_message: string
          ai_response: string
          context_data: Record<string, any> | null
          rating: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id?: string | null
          user_message: string
          ai_response: string
          context_data?: Record<string, any> | null
          rating?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string | null
          user_message?: string
          ai_response?: string
          context_data?: Record<string, any> | null
          rating?: number | null
          created_at?: string
        }
      }
      knowledge_base: {
        Row: {
          id: string
          title: string
          content: string
          topic: string
          difficulty: 'easy' | 'medium' | 'hard'
          type: 'concept' | 'strategy' | 'example' | 'common_mistake'
          tags: string[]
          source: string | null
          vector_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          topic: string
          difficulty: 'easy' | 'medium' | 'hard'
          type: 'concept' | 'strategy' | 'example' | 'common_mistake'
          tags?: string[]
          source?: string | null
          vector_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          topic?: string
          difficulty?: 'easy' | 'medium' | 'hard'
          type?: 'concept' | 'strategy' | 'example' | 'common_mistake'
          tags?: string[]
          source?: string | null
          vector_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          title: string
          content: string
          topic_category: string
          standard_summary: string
          keywords: string[]
          difficulty: 'easy' | 'medium' | 'hard'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          topic_category: string
          standard_summary: string
          keywords?: string[]
          difficulty?: 'easy' | 'medium' | 'hard'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          topic_category?: string
          standard_summary?: string
          keywords?: string[]
          difficulty?: 'easy' | 'medium' | 'hard'
          created_at?: string
          updated_at?: string
        }
      }
      logic_puzzles: {
        Row: {
          id: string
          main_thesis: string
          elements: Record<string, any>
          difficulty: 'easy' | 'medium' | 'hard'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          main_thesis: string
          elements: Record<string, any>
          difficulty?: 'easy' | 'medium' | 'hard'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          main_thesis?: string
          elements?: Record<string, any>
          difficulty?: 'easy' | 'medium' | 'hard'
          created_at?: string
          updated_at?: string
        }
      }
      mock_test_prompts: {
        Row: {
          id: string
          prompt_text: string
          prompt_type: 'Persuasive' | 'Narrative'
          difficulty: 'easy' | 'medium' | 'hard'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          prompt_text: string
          prompt_type: 'Persuasive' | 'Narrative'
          difficulty?: 'easy' | 'medium' | 'hard'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          prompt_text?: string
          prompt_type?: 'Persuasive' | 'Narrative'
          difficulty?: 'easy' | 'medium' | 'hard'
          created_at?: string
          updated_at?: string
        }
      }
      user_submissions: {
        Row: {
          id: string
          user_id: string
          submission_type: 'summary' | 'logic' | 'essay'
          content: string
          score: Record<string, any> | null
          feedback: string | null
          article_id: string | null
          puzzle_id: string | null
          prompt_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          submission_type: 'summary' | 'logic' | 'essay'
          content: string
          score?: Record<string, any> | null
          feedback?: string | null
          article_id?: string | null
          puzzle_id?: string | null
          prompt_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          submission_type?: 'summary' | 'logic' | 'essay'
          content?: string
          score?: Record<string, any> | null
          feedback?: string | null
          article_id?: string | null
          puzzle_id?: string | null
          prompt_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}