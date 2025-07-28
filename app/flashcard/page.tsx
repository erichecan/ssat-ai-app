'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft,
  House,
  BookOpen,
  Brain,
  User,
  RotateCcw,
  Volume2,
  RefreshCw,
  CheckSquare,
  Star,
  Trophy,
  Clock,
  Target,
  FileText,
  CalendarCheck
} from 'lucide-react'
import { MockSessionManager as SessionManager } from '@/lib/mock-auth'
import { Flashcard } from '@/lib/flashcard-bank'

interface FlashcardWithProgress extends Flashcard {
  userProgress: {
    mastery_level: number
    times_seen: number
    times_correct: number
    difficulty_rating: number
    is_mastered?: boolean
    next_review?: string
    interval_days?: number
  } | null
  source?: 'static' | 'dynamic'
}

export default function FlashCardPage() {
  const [flashcards, setFlashcards] = useState<FlashcardWithProgress[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)  // 动态决定显示面
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showingAnswer, setShowingAnswer] = useState(false)  // 动态决定显示答案
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [showMastery, setShowMastery] = useState(false) // 显示掌握按钮
  const [stats, setStats] = useState<any>(null)
  const [reviewMode, setReviewMode] = useState(false) // 今日复习模式
  
  const currentCard = flashcards[currentIndex]

  // 根据单词掌握状态决定初始显示面
  const getInitialDisplayState = (card: FlashcardWithProgress) => {
    if (!card) return { showAnswer: false, isFlipped: false }
    
    const isMastered = card.userProgress?.is_mastered === true
    
    if (isMastered) {
      // 已掌握的单词：先显示题目面（问题）
      return { showAnswer: false, isFlipped: false }
    } else {
      // 未掌握的单词：先显示答案面（定义）
      return { showAnswer: true, isFlipped: true }
    }
  }

  // 当卡片变化时更新显示状态
  useEffect(() => {
    if (currentCard) {
      const { showAnswer, isFlipped: flipped } = getInitialDisplayState(currentCard)
      setShowingAnswer(showAnswer)
      setIsFlipped(flipped)
    }
  }, [currentIndex, flashcards])

  useEffect(() => {
    loadFlashcards()
  }, [])

  // 添加键盘事件监听 - 支持空格键翻转flashcard和左右箭头键切换单词
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查是否在输入框中，如果是则不处理键盘事件
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }

      if (event.code === 'Space') {
        event.preventDefault() // 阻止默认的空格键行为（页面滚动）
        handleFlip()
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault()
        handlePrevious()
      } else if (event.code === 'ArrowRight') {
        event.preventDefault()
        handleNext()
      }
    }

    // 添加事件监听器
    document.addEventListener('keydown', handleKeyDown)

    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFlipped]) // 依赖isFlipped状态

  const loadFlashcards = async (todayReviewOnly = false) => {
    // 确保在客户端环境中执行
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      const currentUser = SessionManager.getCurrentUser()
      const userId = currentUser?.id || '00000000-0000-0000-0000-000000000001' // Fixed UUID format

      let endpoint = `/api/flashcards/enhanced?userId=${userId}&limit=50`
      
      if (todayReviewOnly) {
        // 今日复习模式：只加载已掌握且根据艾宾浩斯曲线需要复习的单词
        endpoint += '&todayReviewOnly=true&masteredOnly=true&ebbinghausOrder=true'
        setReviewMode(true)
      } else {
        // 普通模式：按艾宾浩斯记忆曲线加载所有flashcards（无论是否到期）
        // 优先级：1.到期复习 2.新单词 3.困难单词 4.其他
        endpoint += '&ebbinghausOrder=true'
        setReviewMode(false)
      }
      
      const response = await fetch(endpoint)
      const result = await response.json()

      if (response.ok) {
        setFlashcards(result.flashcards || [])
        setStats(result.stats)
        console.log(`Loaded flashcards ${todayReviewOnly ? '(Today Review mode)' : '(Normal mode)'}:`, result.flashcards?.length)
      } else {
        setError('Failed to load flashcards')
      }
    } catch (error) {
      console.error('Error loading flashcards:', error)
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const updateProgress = async (isCorrect: boolean, difficultyRating: number) => {
    if (!currentCard) return
    
    try {
      const currentUser = SessionManager.getCurrentUser()
      if (!currentUser) return

      await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          flashcardId: currentCard.id,
          isCorrect,
          difficultyRating
        })
      })
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
    setShowingAnswer(!showingAnswer)
  }

  const handleNext = () => {
    // 循环到第一张卡片如果已经是最后一张
    const nextIndex = currentIndex >= flashcards.length - 1 ? 0 : currentIndex + 1
    setCurrentIndex(nextIndex)
    // 显示状态将由useEffect自动更新
  }

  const handlePrevious = () => {
    // 循环到最后一张卡片如果已经是第一张
    const prevIndex = currentIndex <= 0 ? flashcards.length - 1 : currentIndex - 1
    setCurrentIndex(prevIndex)
    // 显示状态将由useEffect自动更新
  }

  const handleDifficultyRating = async (rating: number) => {
    const isCorrect = rating >= 3 // Consider 3+ as correct
    await updateProgress(isCorrect, rating)
    
    // Auto advance to next card after rating
    setTimeout(() => {
      handleNext()
    }, 500)
  }

  const handleMaster = async () => {
    if (!currentCard) return
    
    try {
      const currentUser = SessionManager.getCurrentUser()
      const userId = currentUser?.id || '00000000-0000-0000-0000-000000000001' // Fixed UUID format

      const response = await fetch('/api/flashcards/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          flashcardId: currentCard.id,
          action: 'master'
        })
      })

      if (response.ok) {
        // 更新当前卡片状态
        const updatedFlashcards = [...flashcards]
        if (updatedFlashcards[currentIndex]) {
          if (updatedFlashcards[currentIndex].userProgress) {
            updatedFlashcards[currentIndex].userProgress!.is_mastered = true
          }
        }
        setFlashcards(updatedFlashcards)
        
        // 自动跳到下一张卡片
        setTimeout(() => {
          handleNext()
        }, 1000)
      }
    } catch (error) {
      console.error('Error mastering flashcard:', error)
    }
  }

  const handleUnmaster = async () => {
    if (!currentCard) return
    
    try {
      const currentUser = SessionManager.getCurrentUser()
      const userId = currentUser?.id || '00000000-0000-0000-0000-000000000001' // Fixed UUID format

      const response = await fetch('/api/flashcards/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          flashcardId: currentCard.id,
          action: 'unmaster'
        })
      })

      if (response.ok) {
        // 更新当前卡片状态
        const updatedFlashcards = [...flashcards]
        if (updatedFlashcards[currentIndex]) {
          if (updatedFlashcards[currentIndex].userProgress) {
            updatedFlashcards[currentIndex].userProgress!.is_mastered = false
          }
        }
        setFlashcards(updatedFlashcards)
        
        // 自动跳到下一张卡片
        setTimeout(() => {
          handleNext()
        }, 800)
      }
    } catch (error) {
      console.error('Error unmastering flashcard:', error)
    }
  }

  // 收藏单词 - 增加在艾宾浩斯曲线中的出现频率
  const handleStar = async () => {
    if (!currentCard) return
    
    try {
      const currentUser = SessionManager.getCurrentUser()
      const userId = currentUser?.id || '00000000-0000-0000-0000-000000000001' // Fixed UUID format

      const response = await fetch('/api/flashcards/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          flashcardId: currentCard.id,
          action: 'star', // 新的收藏操作
          quality: 2 // 降低质量评分，增加出现频率
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Word starred for enhanced review:', result.message)
        
        // 更新当前卡片状态，标记为需要增强复习
        const updatedFlashcards = [...flashcards]
        if (updatedFlashcards[currentIndex]?.userProgress) {
          updatedFlashcards[currentIndex].userProgress!.difficulty_rating = 5 // 标记为困难
        }
        setFlashcards(updatedFlashcards)
        
        // 自动跳到下一张卡片
        setTimeout(() => {
          handleNext()
        }, 800)
      }
    } catch (error) {
      console.error('Error starring flashcard:', error)
    }
  }

  const handleReview = async (quality: number) => {
    if (!currentCard) return
    
    try {
      const currentUser = SessionManager.getCurrentUser()
      const userId = currentUser?.id || '00000000-0000-0000-0000-000000000001' // Fixed UUID format

      const response = await fetch('/api/flashcards/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          flashcardId: currentCard.id,
          action: 'review',
          quality: quality, // 0-5 质量评分
          isCorrect: quality >= 3
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Review updated:', result.message)
        
        // 自动跳到下一张卡片
        setTimeout(() => {
          handleNext()
        }, 800)
      }
    } catch (error) {
      console.error('Error reviewing flashcard:', error)
    }
  }

  const handlePronounce = (e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡，防止触发卡片翻转
    if (currentCard && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentCard.word)
      
      // 设置美式发音 - 更新于 2024-01-21 05:30:00
      utterance.lang = 'en-US' // 设置为美式英语
      utterance.rate = 0.8 // 语速稍慢，便于听清
      utterance.pitch = 1.0 // 正常音调
      utterance.volume = 1.0 // 最大音量
      
      // 尝试选择美式发音的语音
      const voices = speechSynthesis.getVoices()
      const usVoice = voices.find(voice => 
        voice.lang === 'en-US' && 
        (voice.name.includes('US') || voice.name.includes('American') || voice.name.includes('Samantha'))
      )
      
      if (usVoice) {
        utterance.voice = usVoice
        console.log('Using US voice:', usVoice.name)
      } else {
        console.log('No US voice found, using default')
      }
      
      speechSynthesis.speak(utterance)
    }
  }

  // 触屏滑动处理
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) {
      handleNext() // 循环处理已在handleNext中实现
    }
    if (isRightSwipe) {
      handlePrevious() // 循环处理已在handlePrevious中实现
    }
  }

  if (loading) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#197fe5]"></div>
        <p className="text-[#4e7397] text-sm mt-2">Loading flashcards...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-center items-center">
        <p className="text-[#4e7397] text-base mb-4">{error}</p>
        <button onClick={loadFlashcards} className="text-[#197fe5] flex items-center gap-2">
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    )
  }

  if (flashcards.length === 0) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-center items-center">
        {reviewMode ? (
          <>
            <CalendarCheck className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-[#0e141b] text-lg font-bold mb-2">All Caught Up! 🎉</h3>
            <p className="text-[#4e7397] text-sm mb-4">No mastered words are due for review today according to the Ebbinghaus curve.</p>
            <p className="text-[#4e7397] text-xs mb-4">Come back tomorrow or switch to normal mode to continue learning.</p>
            <button 
              onClick={() => {
                setLoading(true)
                setCurrentIndex(0)
                loadFlashcards(false)
              }} 
              className="text-[#197fe5] font-semibold bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Switch to Normal Mode
            </button>
          </>
        ) : (
          <>
            <BookOpen className="w-16 h-16 text-[#197fe5] mb-4" />
            <h3 className="text-[#0e141b] text-lg font-bold mb-2">No Flashcards Available</h3>
            <p className="text-[#4e7397] text-sm mb-4">No flashcards found. Please try again later.</p>
            <button onClick={() => loadFlashcards(false)} className="text-[#197fe5] font-semibold">
              Refresh
            </button>
          </>
        )}
      </div>
    )
  }

  if (currentIndex >= flashcards.length) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-center items-center">
        <CheckSquare className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-[#0e141b] text-lg font-bold mb-2">Session Complete!</h3>
        <p className="text-[#4e7397] text-sm mb-4">You've completed all flashcards in this session.</p>
        <button onClick={() => { setCurrentIndex(0); loadFlashcards() }} className="text-[#197fe5] font-semibold flex items-center gap-2">
          <RotateCcw size={16} />
          Start New Session
        </button>
      </div>
    )
  }

  return (
    <div 
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-[#0e141b] flex size-10 shrink-0 items-center justify-center">
            <ArrowLeft size={20} />
          </Link>
          {/* Today Review Button */}
          <button
            onClick={() => {
              setLoading(true)
              setCurrentIndex(0)
              loadFlashcards(!reviewMode)
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
              reviewMode 
                ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm hover:bg-blue-50' 
                : 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm hover:bg-amber-50'
            }`}
            title={reviewMode ? 'Switch to Normal Mode' : 'Today Review (Ebbinghaus Curve)'}
          >
            <CalendarCheck size={12} />
            <span className="hidden sm:inline">{reviewMode ? 'Normal' : 'Today Review'}</span>
            <span className="sm:hidden">{reviewMode ? '📚' : '📅'}</span>
          </button>
        </div>
        <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          {reviewMode ? 'Today Review' : 'Flashcard'}
        </h2>
        <Link href="/vocabulary/admin" className="text-[#4e7397] flex size-12 shrink-0 items-center justify-center">
          <Brain size={20} />
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="flex flex-col items-stretch justify-start rounded-xl">
          {/* Card Container - 触屏滑动优化 */}
          <div 
            className="relative w-full min-h-80 bg-white rounded-3xl shadow-xl border border-zinc-200 mb-6 transition-all duration-300 hover:shadow-2xl"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Question Side (Word Only) - 紧凑布局 */}
            {!isFlipped && (
              <div className="flex flex-col justify-center items-center p-6 bg-gradient-to-br from-slate-50 to-white rounded-3xl min-h-80">
                <div className="text-center max-w-sm">
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <span className="px-3 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-2xl border border-zinc-200 shadow-sm">
                      {currentCard.category}
                    </span>
                    <span className="px-3 py-1.5 bg-rose-100 text-rose-700 text-xs font-medium rounded-2xl border border-rose-200 shadow-sm">
                      {currentCard.difficulty}
                    </span>
                  </div>
                  <h3 className="text-zinc-900 text-4xl font-bold mb-4 tracking-tight">{currentCard.word}</h3>
                  {currentCard.pronunciation && (
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <p className="text-zinc-500 text-lg font-mono tracking-wide">{currentCard.pronunciation}</p>
                      <button
                        onClick={handlePronounce}
                        className="p-1.5 bg-white text-zinc-700 rounded-xl border border-zinc-200 shadow-sm transition-all duration-200 hover:bg-zinc-50 hover:shadow-md z-30"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                  )}
                  <p className="text-zinc-600 text-lg font-normal mb-6">{currentCard.part_of_speech}</p>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl shadow-sm">
                    <p className="text-blue-800 text-sm font-medium">💭 Try to recall the meaning, then flip to check!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Answer Side (Full Details) - 紧凑布局 */}
            {isFlipped && (
              <div className="p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 rounded-3xl">
                <div className="min-h-full flex flex-col space-y-3">
                  {/* Header */}
                  <div className="text-center pb-3 border-b border-zinc-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-xl border border-zinc-200">
                        {currentCard.category}
                      </span>
                      <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-medium rounded-xl border border-rose-200">
                        {currentCard.difficulty}
                      </span>
                    </div>
                    <h3 className="text-zinc-900 text-2xl font-bold mb-2 tracking-tight">{currentCard.word}</h3>
                    {currentCard.pronunciation && (
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <p className="text-zinc-500 text-sm font-mono tracking-wide">{currentCard.pronunciation}</p>
                        <button
                          onClick={handlePronounce}
                          className="p-1 bg-white text-zinc-700 rounded-lg border border-zinc-200 shadow-sm transition-all duration-200 hover:bg-zinc-50 z-30"
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                        >
                          <Volume2 size={14} />
                        </button>
                      </div>
                    )}
                    <p className="text-zinc-600 text-sm font-medium">{currentCard.part_of_speech}</p>
                  </div>
                  
                  {/* Main Definition */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200 transition-all duration-200 hover:shadow-md">
                    <p className="text-zinc-800 text-base font-medium leading-relaxed text-center">
                      {currentCard.definition}
                    </p>
                  </div>
                  
                  {/* Content Sections - 紧凑布局 */}
                  <div className="flex-1 space-y-2">
                    {/* Hint Sentence */}
                    {currentCard.memory_tip && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 shadow-sm transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                          <p className="text-amber-800 text-xs font-semibold">Context Hint</p>
                        </div>
                        <p className="text-amber-900 text-xs italic leading-relaxed pl-3">"{currentCard.memory_tip}"</p>
                      </div>
                    )}
                    
                    {/* Example */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-3 shadow-sm transition-all duration-200 hover:shadow-md">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <p className="text-zinc-700 text-xs font-semibold">Example Usage</p>
                      </div>
                      <p className="text-zinc-600 text-xs italic leading-relaxed pl-3">"{currentCard.example_sentence}"</p>
                    </div>
                    
                    {/* Synonyms & Antonyms */}
                    <div className="grid grid-cols-1 gap-2">
                      {currentCard.synonyms.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 shadow-sm transition-all duration-200 hover:shadow-md">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                            <p className="text-emerald-700 text-xs font-semibold">Similar Words</p>
                          </div>
                          <p className="text-emerald-800 text-xs pl-3">{currentCard.synonyms.slice(0, 3).join(' • ')}</p>
                        </div>
                      )}
                      
                      {currentCard.antonyms.length > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 shadow-sm transition-all duration-200 hover:shadow-md">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                            <p className="text-rose-700 text-xs font-semibold">Opposite Words</p>
                          </div>
                          <p className="text-rose-800 text-xs pl-3">{currentCard.antonyms.slice(0, 3).join(' • ')}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Etymology */}
                    {currentCard.etymology && (
                      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 shadow-sm transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                          <p className="text-purple-700 text-xs font-semibold">Word Origin</p>
                        </div>
                        <p className="text-purple-800 text-xs pl-3">{currentCard.etymology}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Flip Animation - positioned to not interfere with content flow */}
            <div 
              className="absolute inset-0 cursor-pointer rounded-3xl z-10"
              onClick={handleFlip}
            />

            {/* Mastery and Review Control Buttons - Top Right */}
            <div className="absolute top-4 right-4 z-30 flex gap-2">
              {/* 掌握按钮 - 未掌握时灰色，已掌握时绿色 (2024-12-19 17:45:00) */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  if (currentCard?.userProgress?.is_mastered) {
                    handleUnmaster()
                  } else {
                    handleMaster()
                  }
                }}
                className={`inline-flex items-center justify-center w-10 h-10 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${
                  currentCard?.userProgress?.is_mastered
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gray-400 hover:bg-gray-500'
                }`}
                title={currentCard?.userProgress?.is_mastered ? "Click to unmaster" : "Mark as Mastered (✅)"}
              >
                <CheckSquare size={16} />
              </button>

              {/* 收藏按钮 - 未收藏时灰色，已收藏时土黄色 (2024-12-19 17:45:00) */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handleStar()
                }}
                className={`inline-flex items-center justify-center w-10 h-10 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${
                  currentCard?.userProgress?.difficulty_rating === 5
                    ? 'bg-yellow-600 hover:bg-yellow-700'  // 土黄色
                    : 'bg-gray-400 hover:bg-gray-500'      // 灰色
                }`}
                title={currentCard?.userProgress?.difficulty_rating === 5 ? 'Starred for Enhanced Review ⭐' : 'Star for Enhanced Review (⭐)'}
              >
                <Star size={16} fill={currentCard?.userProgress?.difficulty_rating === 5 ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          {/* 滑动提示 */}
          <div className="text-center mt-4">
            <p className="text-zinc-400 text-sm">👈 Swipe to navigate • Tap to flip • Spacebar to flip • ← → Arrow keys 👆</p>
          </div>

          {/* 学习统计 - 简化版本 */}
          {showingAnswer && currentCard && stats && (
            <div className="mt-6">
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                <h4 className="text-blue-800 text-sm font-semibold mb-2 flex items-center gap-2">
                  <Target size={16} />
                  学习进度
                </h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-blue-900 text-lg font-bold">{stats.dueForReview || 0}</p>
                    <p className="text-blue-600 text-xs">待复习</p>
                  </div>
                  <div>
                    <p className="text-green-600 text-lg font-bold">{stats.mastered || 0}</p>
                    <p className="text-green-600 text-xs">已掌握</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bottom Navigation */}
      <div>
        <div className="flex gap-2 border-t border-[#e7edf3] bg-slate-50 px-4 pb-3 pt-2">
          <Link href="/" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <House size={24} />
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Home</p>
          </Link>
          <Link href="/practice" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <BookOpen size={24} />
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Practice</p>
          </Link>
          <Link href="/grammar" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <FileText size={24} />
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Grammar</p>
          </Link>
          <Link href="/flashcard" className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full text-[#0e141b]">
            <div className="text-[#0e141b] flex h-8 items-center justify-center">
              <Brain size={24} fill="currentColor" />
            </div>
            <p className="text-[#0e141b] text-xs font-medium leading-normal tracking-[0.015em]">Vocabulary</p>
          </Link>
          <Link href="/profile" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <User size={24} />
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Profile</p>
          </Link>
        </div>
        <div className="h-5 bg-slate-50"></div>
      </div>
    </div>
  )
}