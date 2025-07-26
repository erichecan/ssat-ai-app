'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Brain, 
  Zap, 
  TrendingUp, 
  Database, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  BookOpen
} from 'lucide-react'

interface VocabularyStats {
  total: number
  byDifficulty: {
    easy: number
    medium: number
    hard: number
  }
  bySource: {
    static: number
    aiGenerated: number
    userAdded: number
  }
  recent: Array<{
    word: string
    difficulty_level: number
    category: string
    created_at: string
  }>
}

export default function VocabularyAdminPage() {
  const [stats, setStats] = useState<VocabularyStats | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 延迟加载统计数据，避免服务端渲染问题
    const timer = setTimeout(() => {
      loadStats()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  const loadStats = async () => {
    // 确保在客户端环境中执行
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      const response = await fetch('/api/vocabulary/generate-bulk')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.stats)
      } else {
        console.warn('API returned no success flag, using empty stats')
        setStats({
          total: 0,
          byDifficulty: { easy: 0, medium: 0, hard: 0 },
          bySource: { static: 0, aiGenerated: 0, userAdded: 0 },
          recent: []
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
      // 设置默认stats避免页面崩溃
      setStats({
        total: 0,
        byDifficulty: { easy: 0, medium: 0, hard: 0 },
        bySource: { static: 0, aiGenerated: 0, userAdded: 0 },
        recent: []
      })
    } finally {
      setLoading(false)
    }
  }

  const startBulkGeneration = async () => {
    // 确保在客户端环境中执行
    if (typeof window === 'undefined') {
      return
    }
    
    setIsGenerating(true)
    setGenerationProgress('Initializing AI vocabulary generation...')

    try {
      const response = await fetch('/api/vocabulary/generate-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user-123',
          batchSize: 30,
          totalTarget: 3000
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setGenerationProgress(`Generation completed! Added ${result.stats.totalGenerated} new words.`)
        await loadStats() // Refresh stats
      } else {
        setGenerationProgress(`Generation failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Generation error:', error)
      setGenerationProgress(`Error: ${error instanceof Error ? error.message : 'Network or server error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const progressPercentage = stats ? Math.round((stats.total / 3000) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
          <Link href="/flashcard" className="text-[#0e141b] flex size-12 shrink-0 items-center">
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Vocabulary Management
          </h2>
        </div>

        {/* Progress Overview */}
        <div className="px-4 py-6">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Brain size={24} />
              <h3 className="text-xl font-bold">SSAT Vocabulary Database</h3>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-blue-100 text-sm">Progress to 3,000 words</span>
                <span className="text-white font-bold">{stats?.total || 0} / 3,000</span>
              </div>
              <div className="w-full bg-blue-800 rounded-full h-3">
                <div 
                  className="bg-white rounded-full h-3 transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-blue-100 text-xs mt-2">{progressPercentage}% complete</p>
            </div>

            {stats && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{stats.byDifficulty.easy}</p>
                  <p className="text-blue-200 text-xs">Easy</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.byDifficulty.medium}</p>
                  <p className="text-blue-200 text-xs">Medium</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.byDifficulty.hard}</p>
                  <p className="text-blue-200 text-xs">Hard</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-2">
          <h3 className="text-[#0e141b] text-lg font-bold mb-4">AI Generation</h3>
          
          <div className="space-y-4">
            {/* Bulk Generation */}
            <div className="bg-white rounded-xl p-4 border border-[#d0dbe7] shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Zap size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[#0e141b] font-semibold text-base">Generate SSAT Vocabulary</h4>
                  <p className="text-[#4e7397] text-sm">AI-powered bulk generation from historical SSAT tests</p>
                </div>
              </div>
              
              <button
                onClick={startBulkGeneration}
                disabled={isGenerating}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  isGenerating 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin" />
                    Generating...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Zap size={16} />
                    Generate 30 New Words
                  </div>
                )}
              </button>

              {generationProgress && (
                <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
                  generationProgress.includes('completed') 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : generationProgress.includes('failed') || generationProgress.includes('Error') 
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  {generationProgress.includes('completed') ? (
                    <CheckCircle size={16} />
                  ) : generationProgress.includes('failed') || generationProgress.includes('Error') ? (
                    <AlertCircle size={16} />
                  ) : (
                    <RefreshCw size={16} className="animate-spin" />
                  )}
                  <p className="text-sm">{generationProgress}</p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl p-4 border border-[#d0dbe7] shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Database size={20} className="text-blue-600" />
                <h4 className="text-[#0e141b] font-semibold text-base">Database Statistics</h4>
              </div>
              
              {stats && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#4e7397]">Static Words:</span>
                    <span className="font-medium">{stats.bySource.static}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4e7397]">AI Generated:</span>
                    <span className="font-medium">{stats.bySource.aiGenerated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4e7397]">User Added:</span>
                    <span className="font-medium">{stats.bySource.userAdded}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4e7397]">Total Words:</span>
                    <span className="font-bold text-blue-600">{stats.total}</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={loadStats}
                className="mt-3 w-full py-2 px-4 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                Refresh Stats
              </button>
            </div>
          </div>
        </div>

        {/* Recent Words Preview */}
        {stats?.recent && stats.recent.length > 0 && (
          <div className="px-4 py-6">
            <h3 className="text-[#0e141b] text-lg font-bold mb-4">Recently Added Words</h3>
            <div className="bg-white rounded-xl p-4 border border-[#d0dbe7] shadow-sm">
              <div className="space-y-3">
                {stats.recent.slice(0, 5).map((word, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-[#0e141b] capitalize">{word.word}</p>
                      <p className="text-xs text-[#4e7397]">{word.category}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        word.difficulty_level === 1 
                          ? 'bg-green-100 text-green-700' 
                          : word.difficulty_level === 3 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {word.difficulty_level === 1 ? 'Easy' : word.difficulty_level === 3 ? 'Hard' : 'Medium'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div>
        <div className="flex gap-2 border-t border-[#e7edf3] bg-slate-50 px-4 pb-3 pt-2">
          <Link href="/" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Home</p>
          </Link>
          <Link href="/practice" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <BookOpen size={24} />
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Practice</p>
          </Link>
          <Link href="/flashcard" className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full text-[#0e141b]">
            <div className="text-[#0e141b] flex h-8 items-center justify-center">
              <Brain size={24} fill="currentColor" />
            </div>
            <p className="text-[#0e141b] text-xs font-medium leading-normal tracking-[0.015em]">Vocabulary</p>
          </Link>
          <Link href="/profile" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Profile</p>
          </Link>
        </div>
        <div className="h-5 bg-slate-50"></div>
      </div>
    </div>
  )
}