import { supabase } from './supabase'
import { Database } from '@/types/database'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']

export interface AuthUser {
  id: string
  email: string
  username: string
  full_name?: string
  avatar_url?: string
  phone?: string
  location?: string
  grade?: string
  target_score?: number
  current_level?: number
  total_points?: number
  practice_time?: string
  reading_speed?: string
  questions_answered?: number
  overall_score?: number
  accuracy_rate?: string
  study_streak?: number
  rank?: string
  created_at: string
}

export interface AuthResponse {
  user: AuthUser | null
  error: string | null
}

export class AuthSystem {
  /**
   * 注册新用户
   */
  async signUp(
    email: string, 
    password: string, 
    username: string, 
    fullName?: string
  ): Promise<AuthResponse> {
    try {
      // 检查用户名是否已存在
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single()

      if (existingUser) {
        return {
          user: null,
          error: 'Username already exists'
        }
      }

      // 创建用户记录
      const userId = crypto.randomUUID()
      const userRecord: UserInsert = {
        id: userId,
        email,
        username,
        full_name: fullName || null,
        current_level: 1,
        total_points: 0,
        total_mistakes: 0,
        mastered_mistakes: 0,
        ai_interactions_count: 0,
        learning_preferences: {}
      }

      const { data, error } = await supabase
        .from('users')
        .insert(userRecord)
        .select()
        .single()

      if (error) {
        console.error('User creation error:', error)
        return {
          user: null,
          error: error.message
        }
      }

      return {
        user: this.formatUser(data),
        error: null
      }

    } catch (error) {
      console.error('Sign up error:', error)
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Registration failed'
      }
    }
  }

  /**
   * 用户登录 (简化版本 - 仅用用户名)
   */
  async signIn(username: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

      if (error || !data) {
        return {
          user: null,
          error: 'User not found'
        }
      }

      // 更新最后登录时间
      await supabase
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', data.id)

      return {
        user: this.formatUser(data),
        error: null
      }

    } catch (error) {
      console.error('Sign in error:', error)
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Login failed'
      }
    }
  }

  /**
   * 获取用户信息
   */
  async getUser(userId: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !data) {
        return {
          user: null,
          error: 'User not found'
        }
      }

      return {
        user: this.formatUser(data),
        error: null
      }

    } catch (error) {
      console.error('Get user error:', error)
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Failed to get user'
      }
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(
    userId: string, 
    updates: Partial<Omit<UserInsert, 'id' | 'created_at'>>
  ): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return {
          user: null,
          error: error.message
        }
      }

      return {
        user: this.formatUser(data),
        error: null
      }

    } catch (error) {
      console.error('Update user error:', error)
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Failed to update user'
      }
    }
  }

  /**
   * 增加用户积分
   */
  async addPoints(userId: string, points: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          total_points: supabase.raw(`total_points + ${points}`),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      return !error
    } catch (error) {
      console.error('Add points error:', error)
      return false
    }
  }

  /**
   * 更新用户等级
   */
  async updateLevel(userId: string, newLevel: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          current_level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      return !error
    } catch (error) {
      console.error('Update level error:', error)
      return false
    }
  }

  /**
   * 增加 AI 交互计数
   */
  async incrementAIInteractions(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ai_interactions_count: supabase.raw('ai_interactions_count + 1'),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      return !error
    } catch (error) {
      console.error('Increment AI interactions error:', error)
      return false
    }
  }

  /**
   * 格式化用户数据
   */
  private formatUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name || undefined,
      avatar_url: user.avatar_url || undefined,
      phone: user.phone || undefined,
      location: user.location || undefined,
      grade: user.grade || undefined,
      target_score: user.target_score || undefined,
      current_level: user.current_level || 1,
      total_points: user.total_points || 0,
      practice_time: user.practice_time || '0h',
      reading_speed: user.reading_speed || 'N/A',
      questions_answered: user.questions_answered || 0,
      overall_score: user.overall_score || 0,
      accuracy_rate: user.accuracy_rate || '0%',
      study_streak: user.study_streak || 0,
      rank: user.rank || 'N/A',
      created_at: user.created_at
    }
  }
}

export const authSystem = new AuthSystem()

// 简化的会话管理 (使用 localStorage)
export class SessionManager {
  private static readonly SESSION_KEY = 'ssat_user_session'

  static setUser(user: AuthUser): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(user))
    }
  }

  static getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null
    
    try {
      const session = localStorage.getItem(this.SESSION_KEY)
      return session ? JSON.parse(session) : null
    } catch {
      return null
    }
  }

  static getUser(): AuthUser | null {
    return this.getCurrentUser()
  }

  static clearUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.SESSION_KEY)
    }
  }

  static isLoggedIn(): boolean {
    return this.getCurrentUser() !== null
  }
}