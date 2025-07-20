'use client'

import { useState, useEffect } from 'react'
import { 
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
  BookOpenIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { mistakeSystem } from '@/lib/mistakes'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface LearningAnalytics {
  totalStudyTime: number
  sessionsCompleted: number
  questionsAnswered: number
  overallAccuracy: number
  strengthAreas: Array<{
    topic: string
    accuracy: number
    count: number
  }>
  weakAreas: Array<{
    topic: string
    accuracy: number
    count: number
  }>
  recentProgress: Array<{
    date: string
    score: number
    questionsAnswered: number
  }>
  mistakeStats: {
    totalMistakes: number
    masteredMistakes: number
    improvementRate: number
  }
  recommendations: string[]
}

interface LearningDashboardProps {
  userId: string
}

export default function LearningDashboard({ userId }: LearningDashboardProps) {
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')
  
  useEffect(() => {
    loadAnalytics()
  }, [userId, timeRange])
  
  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Get date range
      const now = new Date()
      let startDate = new Date()
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'all':
          startDate = new Date('2000-01-01')
          break
      }
      
      // Get user sessions
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
      
      // Get user answers with questions
      const { data: answers } = await supabase
        .from('user_answers')
        .select(`
          *,
          questions!inner(type, difficulty)
        `)
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
      
      // Get mistake stats
      const mistakeStats = await mistakeSystem.getMistakeStats(userId)
      
      // Calculate analytics
      const totalStudyTime = sessions?.reduce((sum, session) => sum + session.total_time, 0) || 0
      const questionsAnswered = answers?.length || 0
      const correctAnswers = answers?.filter(a => a.is_correct).length || 0
      const overallAccuracy = questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0
      
      // Calculate topic performance
      const topicStats: { [key: string]: { correct: number, total: number } } = {}
      
      answers?.forEach(answer => {
        const topic = (answer as any).questions.type
        if (!topicStats[topic]) {
          topicStats[topic] = { correct: 0, total: 0 }
        }
        topicStats[topic].total++
        if (answer.is_correct) {
          topicStats[topic].correct++
        }
      })
      
      const topicPerformance = Object.entries(topicStats)
        .map(([topic, stats]) => ({
          topic,
          accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
          count: stats.total
        }))
        .filter(item => item.count >= 3) // Only topics with at least 3 questions
      
      const strengthAreas = topicPerformance
        .filter(item => item.accuracy >= 70)
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 3)
      
      const weakAreas = topicPerformance
        .filter(item => item.accuracy < 70)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3)
      
      // Calculate recent progress (last 7 days)
      const recentProgress = sessions?.slice(0, 7)
        .map(session => ({
          date: new Date(session.created_at).toLocaleDateString(),
          score: session.score,
          questionsAnswered: session.questions_attempted
        }))
        .reverse() || []
      
      // Generate recommendations
      const recommendations = generateRecommendations(
        weakAreas,
        mistakeStats,
        overallAccuracy,
        sessions?.length || 0
      )
      
      setAnalytics({
        totalStudyTime,
        sessionsCompleted: sessions?.length || 0,
        questionsAnswered,
        overallAccuracy,
        strengthAreas,
        weakAreas,
        recentProgress,
        mistakeStats: {
          totalMistakes: mistakeStats.totalMistakes,
          masteredMistakes: mistakeStats.masteredMistakes,
          improvementRate: mistakeStats.totalMistakes > 0 
            ? (mistakeStats.masteredMistakes / mistakeStats.totalMistakes) * 100 
            : 0
        },
        recommendations
      })
      
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const generateRecommendations = (
    weakAreas: any[],
    mistakeStats: any,
    overallAccuracy: number,
    sessionCount: number
  ): string[] => {
    const recommendations: string[] = []
    
    if (weakAreas.length > 0) {
      recommendations.push(`Focus on ${weakAreas[0].topic} - your accuracy is ${Math.round(weakAreas[0].accuracy)}%`)
    }
    
    if (mistakeStats.totalMistakes > 0 && mistakeStats.masteredMistakes < mistakeStats.totalMistakes * 0.5) {
      recommendations.push('Review your mistake book - you have unmastered mistakes')
    }
    
    if (overallAccuracy < 70) {
      recommendations.push('Slow down and focus on accuracy over speed')
    }
    
    if (sessionCount < 3) {
      recommendations.push('Try to study more consistently - aim for daily practice')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Great job! Keep up the consistent practice')
    }
    
    return recommendations
  }
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }
  
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600'
    if (accuracy >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  const getAccuracyBg = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-green-100'
    if (accuracy >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }
  
  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
    } else if (current < previous) {
      return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
    }
    return null
  }
  
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }
  
  if (!analytics) {
    return (
      <div className="p-6 text-center">
        <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No analytics data available</p>
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Learning Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last Month</option>
          <option value="all">All Time</option>
        </select>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Overall Accuracy</p>
              <p className={cn("text-xl font-bold", getAccuracyColor(analytics.overallAccuracy))}>
                {Math.round(analytics.overallAccuracy)}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Study Time</p>
              <p className="text-xl font-bold text-gray-900">
                {formatTime(analytics.totalStudyTime)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <BookOpenIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Questions</p>
              <p className="text-xl font-bold text-gray-900">
                {analytics.questionsAnswered}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <TrophyIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sessions</p>
              <p className="text-xl font-bold text-gray-900">
                {analytics.sessionsCompleted}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Strength Areas */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Strength Areas</h3>
        {analytics.strengthAreas.length > 0 ? (
          <div className="space-y-2">
            {analytics.strengthAreas.map((area, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 capitalize">{area.topic}</p>
                  <p className="text-sm text-gray-600">{area.count} questions</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{Math.round(area.accuracy)}%</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No strength areas identified yet</p>
        )}
      </div>
      
      {/* Weak Areas */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Areas for Improvement</h3>
        {analytics.weakAreas.length > 0 ? (
          <div className="space-y-2">
            {analytics.weakAreas.map((area, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 capitalize">{area.topic}</p>
                  <p className="text-sm text-gray-600">{area.count} questions</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{Math.round(area.accuracy)}%</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Great job! No weak areas identified</p>
        )}
      </div>
      
      {/* Mistake Progress */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Mistake Progress</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{analytics.mistakeStats.totalMistakes}</p>
            <p className="text-sm text-gray-600">Total Mistakes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{analytics.mistakeStats.masteredMistakes}</p>
            <p className="text-sm text-gray-600">Mastered</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Improvement Rate</span>
            <span>{Math.round(analytics.mistakeStats.improvementRate)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${analytics.mistakeStats.improvementRate}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* AI Recommendations */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <LightBulbIcon className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900">AI Recommendations</h3>
        </div>
        <div className="space-y-2">
          {analytics.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-blue-800">{rec}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Progress Chart */}
      {analytics.recentProgress.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Recent Progress</h3>
          <div className="space-y-2">
            {analytics.recentProgress.map((progress, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">{progress.date}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{progress.questionsAnswered} questions</span>
                  <span className={cn("text-sm font-medium", getAccuracyColor(progress.score))}>
                    {Math.round(progress.score)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}