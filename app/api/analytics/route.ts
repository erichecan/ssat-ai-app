import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface ProgressAnalytics {
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  overallAccuracy: number
  averageTimePerQuestion: number
  totalStudyTime: number
  sessionsCompleted: number
  subjectPerformance: {
    [subject: string]: {
      total: number
      correct: number
      accuracy: number
      averageTime: number
    }
  }
  difficultyPerformance: {
    [difficulty: string]: {
      total: number
      correct: number
      accuracy: number
    }
  }
  streakData: {
    currentStreak: number
    longestStreak: number
    lastStudyDate: string
  }
  dailyActivity: {
    date: string
    questionsAnswered: number
    accuracy: number
    studyTime: number
  }[]
  weeklyProgress: {
    week: string
    questionsAnswered: number
    accuracy: number
    studyTime: number
  }[]
  monthlyProgress: {
    month: string
    questionsAnswered: number
    accuracy: number
    studyTime: number
  }[]
}

// Get comprehensive user progress analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const timeframe = searchParams.get('timeframe') || 'all' // all, week, month, 3months
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Calculate date filters based on timeframe
    let dateFilter = ''
    const now = new Date()
    switch (timeframe) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = `AND answered_at >= '${weekAgo.toISOString()}'`
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateFilter = `AND answered_at >= '${monthAgo.toISOString()}'`
        break
      case '3months':
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        dateFilter = `AND answered_at >= '${threeMonthsAgo.toISOString()}'`
        break
    }

    // Get all user answers
    const { data: answers, error: answersError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_id', userId)
      .order('answered_at', { ascending: true })

    if (answersError) {
      console.error('Error fetching user answers:', answersError)
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      )
    }

    // Get practice sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true })

    if (sessionsError) {
      console.error('Error fetching practice sessions:', sessionsError)
    }

    // Calculate basic metrics
    const totalQuestions = answers.length
    const correctAnswers = answers.filter(a => a.is_correct).length
    const incorrectAnswers = totalQuestions - correctAnswers
    const overallAccuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
    
    const totalTimeSpent = answers.reduce((sum, a) => sum + (a.time_spent || 0), 0)
    const averageTimePerQuestion = totalQuestions > 0 ? Math.round(totalTimeSpent / totalQuestions) : 0
    
    const sessionsCompleted = sessions?.filter(s => s.status === 'completed').length || 0

    // Calculate subject performance
    const subjectPerformance: { [key: string]: any } = {}
    const subjectStats = answers.reduce((acc, answer) => {
      const subject = answer.question_type || 'unknown'
      if (!acc[subject]) {
        acc[subject] = { total: 0, correct: 0, totalTime: 0 }
      }
      acc[subject].total++
      if (answer.is_correct) acc[subject].correct++
      acc[subject].totalTime += answer.time_spent || 0
      return acc
    }, {} as { [key: string]: { total: number, correct: number, totalTime: number } })

    Object.entries(subjectStats).forEach(([subject, stats]) => {
      const typedStats = stats as { total: number, correct: number, totalTime: number }
      subjectPerformance[subject] = {
        total: typedStats.total,
        correct: typedStats.correct,
        accuracy: Math.round((typedStats.correct / typedStats.total) * 100),
        averageTime: Math.round(typedStats.totalTime / typedStats.total)
      }
    })

    // Calculate difficulty performance
    const difficultyPerformance: { [key: string]: any } = {}
    const difficultyStats = answers.reduce((acc, answer) => {
      const difficulty = answer.difficulty || 'medium'
      if (!acc[difficulty]) {
        acc[difficulty] = { total: 0, correct: 0 }
      }
      acc[difficulty].total++
      if (answer.is_correct) acc[difficulty].correct++
      return acc
    }, {} as { [key: string]: { total: number, correct: number } })

    Object.entries(difficultyStats).forEach(([difficulty, stats]) => {
      const typedStats = stats as { total: number, correct: number }
      difficultyPerformance[difficulty] = {
        total: typedStats.total,
        correct: typedStats.correct,
        accuracy: Math.round((typedStats.correct / typedStats.total) * 100)
      }
    })

    // Calculate streak data
    const streakData = calculateStreakData(answers, sessions || [])

    // Calculate daily activity for the last 30 days
    const dailyActivity = calculateDailyActivity(answers, 30)

    // Calculate weekly progress for the last 12 weeks
    const weeklyProgress = calculateWeeklyProgress(answers, 12)

    // Calculate monthly progress for the last 6 months
    const monthlyProgress = calculateMonthlyProgress(answers, 6)

    const analytics: ProgressAnalytics = {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      overallAccuracy,
      averageTimePerQuestion,
      totalStudyTime: Math.round(totalTimeSpent / 60), // Convert to minutes
      sessionsCompleted,
      subjectPerformance,
      difficultyPerformance,
      streakData,
      dailyActivity,
      weeklyProgress,
      monthlyProgress
    }

    return NextResponse.json({
      success: true,
      analytics,
      timeframe
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

function calculateStreakData(answers: any[], sessions: any[]) {
  const studyDates = new Set()
  
  // Add dates from answers
  answers.forEach(answer => {
    const date = new Date(answer.answered_at).toDateString()
    studyDates.add(date)
  })
  
  // Add dates from sessions
  sessions.forEach(session => {
    if (session.start_time) {
      const date = new Date(session.start_time).toDateString()
      studyDates.add(date)
    }
  })

  const sortedDates = Array.from(studyDates).sort((a, b) => 
    new Date(a as string).getTime() - new Date(b as string).getTime()
  )

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  let lastDate: Date | null = null

  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

  for (const dateStr of sortedDates) {
    const currentDate = new Date(dateStr as string)
    
    if (lastDate === null) {
      tempStreak = 1
    } else {
      const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000))
      if (daysDiff === 1) {
        tempStreak++
      } else {
        tempStreak = 1
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak)
    lastDate = currentDate
  }

  // Calculate current streak
  if (sortedDates.length > 0) {
    const lastStudyDate = new Date(sortedDates[sortedDates.length - 1] as string)
    const isToday = lastStudyDate.toDateString() === today.toDateString()
    const isYesterday = lastStudyDate.toDateString() === yesterday.toDateString()
    
    if (isToday || isYesterday) {
      // Work backwards to find current streak
      let streakCount = 0
      let checkDate = new Date(today)
      
      for (let i = sortedDates.length - 1; i >= 0; i--) {
        const studyDate = new Date(sortedDates[i] as string)
        if (studyDate.toDateString() === checkDate.toDateString()) {
          streakCount++
          checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000)
        } else if (Math.floor((checkDate.getTime() - studyDate.getTime()) / (24 * 60 * 60 * 1000)) === 1) {
          checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000)
        } else {
          break
        }
      }
      currentStreak = streakCount
    }
  }

  return {
    currentStreak,
    longestStreak,
    lastStudyDate: sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] as string : ''
  }
}

function calculateDailyActivity(answers: any[], days: number) {
  const dailyData: { [key: string]: { total: number, correct: number, time: number } } = {}
  
  // Initialize last N days
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    dailyData[dateStr] = { total: 0, correct: 0, time: 0 }
  }

  // Aggregate answers by day
  answers.forEach(answer => {
    const dateStr = new Date(answer.answered_at).toISOString().split('T')[0]
    if (dailyData[dateStr]) {
      dailyData[dateStr].total++
      if (answer.is_correct) dailyData[dateStr].correct++
      dailyData[dateStr].time += answer.time_spent || 0
    }
  })

  return Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      questionsAnswered: data.total,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      studyTime: Math.round(data.time / 60) // Convert to minutes
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function calculateWeeklyProgress(answers: any[], weeks: number) {
  const weeklyData: { [key: string]: { total: number, correct: number, time: number } } = {}
  
  // Initialize last N weeks
  for (let i = 0; i < weeks; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (i * 7))
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
    const weekStr = weekStart.toISOString().split('T')[0]
    weeklyData[weekStr] = { total: 0, correct: 0, time: 0 }
  }

  // Aggregate answers by week
  answers.forEach(answer => {
    const answerDate = new Date(answer.answered_at)
    const weekStart = new Date(answerDate.setDate(answerDate.getDate() - answerDate.getDay()))
    const weekStr = weekStart.toISOString().split('T')[0]
    
    if (weeklyData[weekStr]) {
      weeklyData[weekStr].total++
      if (answer.is_correct) weeklyData[weekStr].correct++
      weeklyData[weekStr].time += answer.time_spent || 0
    }
  })

  return Object.entries(weeklyData)
    .map(([week, data]) => ({
      week,
      questionsAnswered: data.total,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      studyTime: Math.round(data.time / 60) // Convert to minutes
    }))
    .sort((a, b) => a.week.localeCompare(b.week))
}

function calculateMonthlyProgress(answers: any[], months: number) {
  const monthlyData: { [key: string]: { total: number, correct: number, time: number } } = {}
  
  // Initialize last N months
  for (let i = 0; i < months; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0')
    monthlyData[monthStr] = { total: 0, correct: 0, time: 0 }
  }

  // Aggregate answers by month
  answers.forEach(answer => {
    const answerDate = new Date(answer.answered_at)
    const monthStr = answerDate.getFullYear() + '-' + String(answerDate.getMonth() + 1).padStart(2, '0')
    
    if (monthlyData[monthStr]) {
      monthlyData[monthStr].total++
      if (answer.is_correct) monthlyData[monthStr].correct++
      monthlyData[monthStr].time += answer.time_spent || 0
    }
  })

  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      questionsAnswered: data.total,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      studyTime: Math.round(data.time / 60) // Convert to minutes
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}