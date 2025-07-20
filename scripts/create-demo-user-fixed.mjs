import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createDemoUser() {
  try {
    console.log('Creating demo user with explicit ID...')
    
    // Check if demo user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'demo')
      .single()

    if (existingUser) {
      console.log('Demo user already exists:', existingUser)
      return existingUser
    }

    // Create demo user with explicit ID
    const demoUser = {
      id: randomUUID(),
      email: 'demo@ssatmaster.com',
      username: 'demo',
      full_name: 'Demo Student',
      practice_time: '24h',
      reading_speed: '450 WPM',
      questions_answered: 1250,
      overall_score: 1350,
      accuracy_rate: '87%',
      study_streak: 12,
      rank: '23'
    }

    const { data, error } = await supabase
      .from('users')
      .insert(demoUser)
      .select()
      .single()

    if (error) {
      console.error('Error creating demo user:', error)
      
      // Try with minimal fields
      console.log('Trying with minimal fields...')
      const minimalUser = {
        id: randomUUID(),
        email: 'demo@ssatmaster.com',
        username: 'demo',
        full_name: 'Demo Student'
      }
      
      const { data: minData, error: minError } = await supabase
        .from('users')
        .insert(minimalUser)
        .select()
        .single()
        
      if (minError) {
        console.error('Minimal insert also failed:', minError)
        return null
      } else {
        console.log('✓ Demo user created with minimal fields:', minData)
        return minData
      }
    } else {
      console.log('✓ Demo user created successfully:', data)
      return data
    }

  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

// Run the script
createDemoUser().then((user) => {
  if (user) {
    console.log('Demo user setup complete!')
    console.log('Username: demo')
    console.log('ID:', user.id)
  } else {
    console.log('Failed to create demo user')
  }
  process.exit(0)
})