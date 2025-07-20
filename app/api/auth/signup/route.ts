import { NextRequest, NextResponse } from 'next/server'
import { authSystem } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, fullName } = await request.json()
    
    if (!email || !username) {
      return NextResponse.json(
        { error: 'Email and username are required' },
        { status: 400 }
      )
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // 用户名长度验证
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 20 characters' },
        { status: 400 }
      )
    }

    const result = await authSystem.signUp(email, password, username, fullName)
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: result.user
    })

  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}