'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft,
  House,
  BookOpen,
  File,
  CheckSquare,
  User,
  RotateCcw,
  Volume2,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import { MockSessionManager as SessionManager } from '@/lib/mock-auth'
import { Flashcard } from '@/lib/flashcard-bank'

interface FlashcardWithProgress extends Flashcard {
  userProgress: {
    mastery_level: number
    times_seen: number
    times_correct: number
    difficulty_rating: number
  } | null
}

export default function FlashCardPage() {
  const [flashcards, setFlashcards] = useState<FlashcardWithProgress[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(true)  // 默认显示答案面
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showingAnswer, setShowingAnswer] = useState(true)  // 默认显示答案
  
  const currentCard = flashcards[currentIndex]

  useEffect(() => {
    loadFlashcards()
  }, [])

  const loadFlashcards = async () => {
    try {
      const currentUser = SessionManager.getCurrentUser()
      if (!currentUser) return

      const response = await fetch(`/api/flashcards?userId=${currentUser.id}&limit=20&random=true`)
      const result = await response.json()

      if (response.ok) {
        setFlashcards(result.flashcards)
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
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(true)
      setShowingAnswer(true)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(true)
      setShowingAnswer(true)
    }
  }

  const handleDifficultyRating = async (rating: number) => {
    const isCorrect = rating >= 3 // Consider 3+ as correct
    await updateProgress(isCorrect, rating)
    
    // Auto advance to next card after rating
    setTimeout(() => {
      handleNext()
    }, 500)
  }

  const handlePronounce = () => {
    if (currentCard && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentCard.word)
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
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
        <BookOpen className="w-16 h-16 text-[#197fe5] mb-4" />
        <h3 className="text-[#0e141b] text-lg font-bold mb-2">No Flashcards Available</h3>
        <p className="text-[#4e7397] text-sm mb-4">No flashcards found. Please try again later.</p>
        <button onClick={loadFlashcards} className="text-[#197fe5] font-semibold">
          Refresh
        </button>
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
        <Link href="/" className="text-[#0e141b] flex size-12 shrink-0 items-center">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          Flashcard
        </h2>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3 max-h-[calc(100vh-140px)] overflow-y-auto">
        <div className="flex flex-col items-stretch justify-start rounded-xl">
          {/* Card Container */}
          <div className="relative w-full min-h-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-3">
            {/* Question Side (Word Only) */}
            {!isFlipped && (
              <div className="absolute inset-0 flex flex-col justify-center items-center p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <span className="px-3 py-1 bg-[#e7edf3] text-[#4e7397] text-xs font-medium rounded-full">
                      {currentCard.category}
                    </span>
                    <span className="px-3 py-1 bg-[#f0f0f0] text-[#666] text-xs font-medium rounded-full">
                      {currentCard.difficulty}
                    </span>
                  </div>
                  <h3 className="text-gray-900 text-4xl font-bold mb-4">{currentCard.word}</h3>
                  {currentCard.pronunciation && (
                    <p className="text-gray-500 text-lg font-mono mb-4">{currentCard.pronunciation}</p>
                  )}
                  <p className="text-gray-600 text-lg font-normal">{currentCard.part_of_speech}</p>
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm font-medium">💭 Try to recall the meaning, then flip to check!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Answer Side (Full Details) */}
            {isFlipped && (
              <div className="absolute inset-0 p-4 bg-gradient-to-br from-blue-50 to-blue-100 overflow-y-auto">
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="text-center mb-3">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-[#e7edf3] text-[#4e7397] text-xs font-medium rounded-full">
                        {currentCard.category}
                      </span>
                      <span className="px-2 py-1 bg-[#f0f0f0] text-[#666] text-xs font-medium rounded-full">
                        {currentCard.difficulty}
                      </span>
                    </div>
                    <h3 className="text-gray-900 text-2xl font-bold mb-1">{currentCard.word}</h3>
                    {currentCard.pronunciation && (
                      <p className="text-gray-500 text-sm font-mono">{currentCard.pronunciation}</p>
                    )}
                    <p className="text-gray-600 text-sm font-medium">{currentCard.part_of_speech}</p>
                  </div>
                  
                  {/* Main Definition */}
                  <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                    <p className="text-gray-800 text-base font-medium leading-relaxed text-center">
                      {currentCard.definition}
                    </p>
                  </div>
                  
                  {/* Content Sections */}
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {/* Hint Sentence */}
                    {currentCard.memory_tip && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-yellow-800 text-xs font-semibold mb-1">💡 Context Hint:</p>
                        <p className="text-yellow-900 text-sm italic leading-relaxed">"{currentCard.memory_tip}"</p>
                      </div>
                    )}
                    
                    {/* Example */}
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-gray-600 text-xs font-semibold mb-1">📝 Example:</p>
                      <p className="text-gray-700 text-sm italic leading-relaxed">"{currentCard.example_sentence}"</p>
                    </div>
                    
                    {/* Synonyms & Antonyms */}
                    <div className="grid grid-cols-1 gap-2">
                      {currentCard.synonyms.length > 0 && (
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-green-600 text-xs font-semibold mb-1">✅ Synonyms:</p>
                          <p className="text-gray-700 text-sm">{currentCard.synonyms.slice(0, 3).join(', ')}</p>
                        </div>
                      )}
                      
                      {currentCard.antonyms.length > 0 && (
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-red-600 text-xs font-semibold mb-1">❌ Antonyms:</p>
                          <p className="text-gray-700 text-sm">{currentCard.antonyms.slice(0, 3).join(', ')}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Etymology */}
                    {currentCard.etymology && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-purple-600 text-xs font-semibold mb-1">🏛️ Etymology:</p>
                        <p className="text-gray-700 text-sm">{currentCard.etymology}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Flip Animation */}
            <div 
              className="absolute inset-0 cursor-pointer"
              onClick={handleFlip}
            />
          </div>

          {/* Card Info */}
          <div className="flex w-full flex-col gap-1 py-2">
            <div className="flex justify-between items-center">
              <p className="text-gray-600 text-sm font-normal">{currentCard.category}</p>
              <div className="flex items-center gap-2">
                {currentCard.userProgress && (
                  <span className="text-xs text-gray-500">
                    Seen {currentCard.userProgress.times_seen} times
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-900 text-lg font-bold">{currentCard.word}</p>
            <div className="flex items-end gap-3 justify-between">
              <p className="text-gray-500 text-base">{currentCard.part_of_speech}</p>
              {currentCard.userProgress && (
                <div className="flex items-center gap-1">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#197fe5] h-2 rounded-full transition-all" 
                      style={{ width: `${(currentCard.userProgress.mastery_level / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">Mastery</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-stretch">
          <div className="flex flex-1 gap-2 flex-wrap py-2">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`flex items-center justify-center gap-2 h-10 px-3 rounded-xl text-sm font-bold ${
                currentIndex === 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              <ChevronLeft size={16} />
              Prev
            </button>
            
            <button
              onClick={handleFlip}
              className="flex-1 max-w-[200px] cursor-pointer items-center justify-center rounded-xl h-10 px-4 bg-[#197fe5] text-white text-sm font-bold leading-normal tracking-wide hover:bg-[#1668c7]"
            >
              <span className="truncate">{isFlipped ? 'Test Yourself' : 'Show Answer'}</span>
            </button>
            
            <button
              onClick={handlePronounce}
              className="flex items-center justify-center gap-2 h-10 px-3 bg-gray-200 text-gray-900 text-sm font-bold leading-normal tracking-wide rounded-xl hover:bg-gray-300"
            >
              <Volume2 size={16} />
            </button>
            
            <button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className={`flex items-center justify-center gap-2 h-10 px-3 rounded-xl text-sm font-bold ${
                currentIndex === flashcards.length - 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              }`}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Card {currentIndex + 1} of {flashcards.length}</span>
            <span className="text-sm text-gray-600">{Math.round(((currentIndex + 1) / flashcards.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#197fe5] h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Difficulty Buttons - Only show after seeing the answer */}
        {showingAnswer && (
          <div className="mt-3">
            <p className="text-gray-600 text-sm font-medium mb-3 text-center">How well did you know this word?</p>
            <div className="flex gap-2">
              <button 
                onClick={() => handleDifficultyRating(1)}
                className="flex-1 py-2 px-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors text-sm"
              >
                Don't Know
              </button>
              <button 
                onClick={() => handleDifficultyRating(3)}
                className="flex-1 py-2 px-3 bg-yellow-100 text-yellow-700 rounded-lg font-medium hover:bg-yellow-200 transition-colors text-sm"
              >
                Somewhat
              </button>
              <button 
                onClick={() => handleDifficultyRating(5)}
                className="flex-1 py-2 px-3 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors text-sm"
              >
                Know Well
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div>
        <div className="flex gap-2 border-t border-[#e7edf3] bg-slate-50 px-4 pb-3 pt-2">
        <Link 
          href="/" 
          className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]"
        >
          <div className="text-[#4e7397] flex h-8 items-center justify-center">
            <House size={24} />
          </div>
          <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Home</p>
        </Link>
        <Link 
          href="/flashcard" 
          className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full text-[#0e141b]"
        >
          <div className="text-[#0e141b] flex h-8 items-center justify-center">
            <BookOpen size={24} fill="currentColor" />
          </div>
          <p className="text-[#0e141b] text-xs font-medium leading-normal tracking-[0.015em]">Learn</p>
        </Link>
        <Link 
          href="/practice" 
          className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]"
        >
          <div className="text-[#4e7397] flex h-8 items-center justify-center">
            <File size={24} />
          </div>
          <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Practice</p>
        </Link>
        <Link 
          href="/test" 
          className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]"
        >
          <div className="text-[#4e7397] flex h-8 items-center justify-center">
            <CheckSquare size={24} />
          </div>
          <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Test</p>
        </Link>
        <Link 
          href="/profile" 
          className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]"
        >
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