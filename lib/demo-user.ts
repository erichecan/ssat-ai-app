// Demo user configuration for development and testing
export const DEMO_USER_UUID = '00000000-0000-0000-0000-000000000001'
export const DEMO_USER_EMAIL = 'demo@example.com'
export const DEMO_USER_USERNAME = 'demo-user'

// Helper function to get current user ID or fallback to demo user
export function getCurrentUserId(userSession?: any): string {
  // If user is logged in, use their ID
  if (userSession?.user?.id) {
    return userSession.user.id
  }
  
  // Otherwise use demo user UUID
  return DEMO_USER_UUID
}

// Helper function to check if current user is demo user
export function isDemoUser(userId: string): boolean {
  return userId === DEMO_USER_UUID
}