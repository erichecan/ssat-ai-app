import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export interface UserSettings {
  id?: string
  user_id: string
  // Study reminders
  reminder_enabled: boolean
  reminder_time: string
  reminder_frequency: 'daily' | 'weekly' | 'custom'
  reminder_days?: string[] // for custom frequency
  
  // Study preferences
  difficulty_level: 'easy' | 'medium' | 'hard' | 'adaptive'
  study_goal_minutes: number
  preferred_subjects: string[]
  time_limit_enabled: boolean
  
  // Appearance settings
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'zh' | 'es' | 'fr'
  font_size: 'small' | 'medium' | 'large'
  
  // Notification settings
  email_notifications: boolean
  push_notifications: boolean
  practice_reminders: boolean
  achievement_notifications: boolean
  
  // Privacy settings
  data_sharing: boolean
  analytics_enabled: boolean
  
  created_at?: string
  updated_at?: string
}

// Get user settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching user settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    // If no settings found, return default settings
    if (!settings) {
      const defaultSettings: UserSettings = {
        user_id: userId,
        reminder_enabled: false,
        reminder_time: '18:00',
        reminder_frequency: 'daily',
        difficulty_level: 'adaptive',
        study_goal_minutes: 30,
        preferred_subjects: ['vocabulary', 'reading'],
        time_limit_enabled: true,
        theme: 'light',
        language: 'en',
        font_size: 'medium',
        email_notifications: true,
        push_notifications: true,
        practice_reminders: true,
        achievement_notifications: true,
        data_sharing: false,
        analytics_enabled: true
      }

      return NextResponse.json({
        success: true,
        settings: defaultSettings,
        isDefault: true
      })
    }

    return NextResponse.json({
      success: true,
      settings,
      isDefault: false
    })

  } catch (error) {
    console.error('Get settings API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// Update user settings
export async function PUT(request: NextRequest) {
  try {
    const settings: UserSettings = await request.json()
    
    if (!settings.user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if settings already exist
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', settings.user_id)
      .single()

    const settingsData = {
      ...settings,
      updated_at: new Date().toISOString()
    }

    if (existingSettings) {
      // Update existing settings
      const { data: updatedSettings, error } = await supabase
        .from('user_settings')
        .update(settingsData)
        .eq('user_id', settings.user_id)
        .select()
        .single()

      if (error) {
        console.error('Error updating settings:', error)
        return NextResponse.json(
          { error: 'Failed to update settings' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        settings: updatedSettings,
        message: 'Settings updated successfully'
      })
    } else {
      // Create new settings
      const newSettingsData = {
        ...settingsData,
        created_at: new Date().toISOString()
      }

      const { data: createdSettings, error } = await supabase
        .from('user_settings')
        .insert(newSettingsData)
        .select()
        .single()

      if (error) {
        console.error('Error creating settings:', error)
        return NextResponse.json(
          { error: 'Failed to create settings' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        settings: createdSettings,
        message: 'Settings created successfully'
      })
    }

  } catch (error) {
    console.error('Update settings API error:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}

// Reset settings to default
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting settings:', error)
      return NextResponse.json(
        { error: 'Failed to reset settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Settings reset to default successfully'
    })

  } catch (error) {
    console.error('Reset settings API error:', error)
    return NextResponse.json(
      { error: 'Failed to reset settings' },
      { status: 500 }
    )
  }
}