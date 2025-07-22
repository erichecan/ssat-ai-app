'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft,
  Filter,
  BookOpen,
  Clock,
  Tag,
  MessageSquare,
  Trash,
  House,
  Search,
  User
} from 'lucide-react'
import { mistakeSystem, MistakeWithQuestion, MistakeStats } from '@/lib/mistakes'
import { cn } from '@/lib/utils'

// Mock user ID for now - replace with actual auth
const MOCK_USER_ID = 'user-1'

interface FilterOptions {
  masteryLevel?: number
  topic?: string
  difficulty?: string
  tags?: string[]
}

const MASTERY_LEVELS = {
  0: { label: 'New', color: 'bg-red-100 text-red-800' },
  1: { label: 'Learning', color: 'bg-yellow-100 text-yellow-800' },
  2: { label: 'Review', color: 'bg-blue-100 text-blue-800' },
  3: { label: 'Mastered', color: 'bg-green-100 text-green-800' }
}

const TOPICS = ['vocabulary', 'reading', 'math', 'writing']
const DIFFICULTIES = ['easy', 'medium', 'hard']

export default function MistakesPage() {
  const [mistakes, setMistakes] = useState<MistakeWithQuestion[]>([])
  const [stats, setStats] = useState<MistakeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({})
  const [selectedMistake, setSelectedMistake] = useState<MistakeWithQuestion | null>(null)
  const [showReviewMode, setShowReviewMode] = useState(false)
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)
  const [reviewMistakes, setReviewMistakes] = useState<MistakeWithQuestion[]>([])
  
  useEffect(() => {
    loadMistakes()
    loadStats()
  }, [filters])
  
  const loadMistakes = async () => {
    try {
      setLoading(true)
      const data = await mistakeSystem.getMistakes(MOCK_USER_ID, filters)
      setMistakes(data)
    } catch (error) {
      console.error('Error loading mistakes:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadStats = async () => {
    try {
      const data = await mistakeSystem.getMistakeStats(MOCK_USER_ID)
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }
  
  const loadReviewMistakes = async () => {
    try {
      const data = await mistakeSystem.getMistakesDueForReview(MOCK_USER_ID)
      setReviewMistakes(data)
      setCurrentReviewIndex(0)
      setShowReviewMode(true)
    } catch (error) {
      console.error('Error loading review mistakes:', error)
    }
  }
  
  const handleMasteryUpdate = async (mistakeId: string, newLevel: number) => {
    try {
      await mistakeSystem.updateMasteryLevel(MOCK_USER_ID, mistakeId, newLevel)
      await loadMistakes()
      await loadStats()
    } catch (error) {
      console.error('Error updating mastery:', error)
    }
  }
  
  const handleRemoveMistake = async (mistakeId: string) => {
    try {
      await mistakeSystem.removeMistake(MOCK_USER_ID, mistakeId)
      await loadMistakes()
      await loadStats()
    } catch (error) {
      console.error('Error removing mistake:', error)
    }
  }
  
  const handleReviewAnswer = async (wasCorrect: boolean) => {
    if (!reviewMistakes[currentReviewIndex]) return
    
    try {
      await mistakeSystem.markAsReviewed(
        MOCK_USER_ID,
        reviewMistakes[currentReviewIndex].id,
        wasCorrect
      )
      
      if (currentReviewIndex < reviewMistakes.length - 1) {
        setCurrentReviewIndex(currentReviewIndex + 1)
      } else {
        setShowReviewMode(false)
        await loadMistakes()
        await loadStats()
      }
    } catch (error) {
      console.error('Error marking as reviewed:', error)
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }
  
  const getMasteryBadge = (level: number) => {
    const mastery = MASTERY_LEVELS[level as keyof typeof MASTERY_LEVELS]
    return (
      <span className={cn("px-2 py-1 text-xs font-medium rounded-full", mastery.color)}>
        {mastery.label}
      </span>
    )
  }
  
  if (showReviewMode && reviewMistakes.length > 0) {
    const currentMistake = reviewMistakes[currentReviewIndex]
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowReviewMode(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Mistakes
            </button>
            <div className="text-sm text-gray-600">
              {currentReviewIndex + 1} of {reviewMistakes.length}
            </div>
          </div>
        </div>
        
        {/* Review Question */}
        <div className="p-4">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">
                {currentMistake.questions.type} • {currentMistake.questions.difficulty}
              </span>
              {getMasteryBadge(currentMistake.mastery_level)}
            </div>
            
            <h3 className="text-lg font-semibold mb-4">
              {currentMistake.questions.question}
            </h3>
            
            <div className="space-y-2 mb-6">
              {currentMistake.questions.options.map((option, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  {option}
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Correct Answer:</strong> {currentMistake.questions.correct_answer}
              </p>
              <p className="text-sm text-blue-700 mt-2">
                {currentMistake.questions.explanation}
              </p>
            </div>
            
            {currentMistake.user_notes && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Your Notes:</strong> {currentMistake.user_notes}
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => handleReviewAnswer(false)}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
              >
                Still Difficult
              </button>
              <button
                onClick={() => handleReviewAnswer(true)}
                className="flex-1 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
              >
                Got It Right
              </button>
            </div>
          </div>
        </div>
        
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold text-gray-900">错题本</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Stats */}
      {stats && (
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalMistakes}</div>
              <div className="text-sm text-gray-600">Total Mistakes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.masteredMistakes}</div>
              <div className="text-sm text-gray-600">Mastered</div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">{stats.newMistakes}</div>
              <div className="text-xs text-gray-500">New</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-600">{stats.learningMistakes}</div>
              <div className="text-xs text-gray-500">Learning</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{stats.reviewMistakes}</div>
              <div className="text-xs text-gray-500">Review</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{stats.masteredMistakes}</div>
              <div className="text-xs text-gray-500">Mastered</div>
            </div>
          </div>
          
          <button
            onClick={loadReviewMistakes}
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
          >
            Start Review Session
          </button>
        </div>
      )}
      
      {/* Filters */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Mastery Level
              </label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(MASTERY_LEVELS).map(([level, config]) => (
                  <button
                    key={level}
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      masteryLevel: prev.masteryLevel === parseInt(level) ? undefined : parseInt(level)
                    }))}
                    className={cn(
                      "px-3 py-1 text-sm rounded-full border",
                      filters.masteryLevel === parseInt(level)
                        ? config.color
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Topic
              </label>
              <div className="flex gap-2 flex-wrap">
                {TOPICS.map(topic => (
                  <button
                    key={topic}
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      topic: prev.topic === topic ? undefined : topic
                    }))}
                    className={cn(
                      "px-3 py-1 text-sm rounded-full border capitalize",
                      filters.topic === topic
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Difficulty
              </label>
              <div className="flex gap-2 flex-wrap">
                {DIFFICULTIES.map(difficulty => (
                  <button
                    key={difficulty}
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      difficulty: prev.difficulty === difficulty ? undefined : difficulty
                    }))}
                    className={cn(
                      "px-3 py-1 text-sm rounded-full border capitalize",
                      filters.difficulty === difficulty
                        ? "bg-purple-100 text-purple-800 border-purple-200"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => setFilters({})}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Mistakes List */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading mistakes...</p>
          </div>
        ) : mistakes.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No mistakes found</p>
            <p className="text-sm text-gray-500 mt-2">
              {Object.keys(filters).length > 0 ? "Try adjusting your filters" : "Keep practicing to add questions here"}
            </p>
          </div>
        ) : (
          mistakes.map((mistake) => (
            <div key={mistake.id} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 capitalize">
                    {mistake.questions.type} • {mistake.questions.difficulty}
                  </span>
                  {getMasteryBadge(mistake.mastery_level)}
                </div>
                <button
                  onClick={() => handleRemoveMistake(mistake.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
              
              <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                {mistake.questions.question}
              </h3>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDate(mistake.last_mistake_at)}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-500">✗</span>
                  {mistake.mistake_count}x
                </div>
              </div>
              
              {mistake.tags.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <div className="flex gap-1 flex-wrap">
                    {mistake.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {mistake.user_notes && (
                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                  <p className="text-sm text-gray-700">{mistake.user_notes}</p>
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedMistake(mistake)}
                  className="flex-1 py-2 px-3 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  View Details
                </button>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map(level => (
                    <button
                      key={level}
                      onClick={() => handleMasteryUpdate(mistake.id, level)}
                      className={cn(
                        "w-8 h-8 rounded text-xs font-medium border",
                        mistake.mastery_level === level
                          ? MASTERY_LEVELS[level as keyof typeof MASTERY_LEVELS].color
                          : "border-gray-200 text-gray-400 hover:bg-gray-50"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Mistake Detail Modal */}
      {selectedMistake && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Question Details</h3>
                <button
                  onClick={() => setSelectedMistake(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500 capitalize">
                    {selectedMistake.questions.type} • {selectedMistake.questions.difficulty}
                  </span>
                  {getMasteryBadge(selectedMistake.mastery_level)}
                </div>
                <p className="font-medium text-gray-900">
                  {selectedMistake.questions.question}
                </p>
              </div>
              
              <div className="space-y-2 mb-4">
                {selectedMistake.questions.options.map((option, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "p-3 border rounded-lg text-sm",
                      option === selectedMistake.questions.correct_answer
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200"
                    )}
                  >
                    {option}
                    {option === selectedMistake.questions.correct_answer && (
                      <span className="text-green-600 ml-2">✓</span>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Explanation:</strong> {selectedMistake.questions.explanation}
                </p>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p>Last mistake: {formatDate(selectedMistake.last_mistake_at)}</p>
                <p>Mistake count: {selectedMistake.mistake_count}</p>
                <p>Next review: {formatDate(selectedMistake.next_review_at)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}