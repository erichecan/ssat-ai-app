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
    console.log('Creating demo user...')
    
    // 检查演示用户是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'demo')
      .single()

    if (existingUser) {
      console.log('Demo user already exists:', existingUser)
      return existingUser
    }

    // 创建演示用户
    const demoUser = {
      id: randomUUID(),
      email: 'demo@ssatmaster.com',
      username: 'demo',
      full_name: 'Demo Student'
    }

    const { data, error } = await supabase
      .from('users')
      .insert(demoUser)
      .select()
      .single()

    if (error) {
      console.error('Error creating demo user:', error)
      return null
    }

    console.log('Demo user created successfully:', data)
    return data

  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

// 运行脚本
createDemoUser().then(() => {
  console.log('Demo user setup complete')
  process.exit(0)
})