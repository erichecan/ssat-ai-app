import { AuthUser } from './auth'

// Mock user for testing authentication flow
export const mockDemoUser: AuthUser = {
  id: '12345678-1234-1234-1234-123456789012',
  email: 'demo@ssatmaster.com',
  username: 'demo',
  full_name: 'Demo Student',
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  grade: '10th Grade',
  target_score: 1500,
  current_level: 8,
  total_points: 2850,
  practice_time: '24h',
  reading_speed: '450 WPM',
  questions_answered: 1250,
  overall_score: 1350,
  accuracy_rate: '87%',
  study_streak: 12,
  rank: '23',
  created_at: '2024-01-15T10:30:00Z'
}

// Enhanced SessionManager with mock fallback
export class MockSessionManager {
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
      if (session) {
        return JSON.parse(session)
      }
      
      // Return mock user if no session exists (for demo purposes)
      return mockDemoUser
    } catch {
      return mockDemoUser
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

  static setDemoUser(): void {
    this.setUser(mockDemoUser)
  }
}