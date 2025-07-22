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
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckSquare
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
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="flex flex-col items-stretch justify-start rounded-xl">
          {/* Card Container - 21st.dev inspired design */}
          <div className="relative w-full h-96 bg-white rounded-3xl shadow-xl border border-zinc-200 overflow-hidden mb-4 transition-all duration-300 hover:shadow-2xl">
            {/* Question Side (Word Only) - 21st.dev style */}
            {!isFlipped && (
              <div className="absolute inset-0 flex flex-col justify-center items-center p-8 bg-gradient-to-br from-slate-50 to-white">
                <div className="text-center max-w-sm">
                  <div className="flex items-center justify-center gap-3 mb-8">
                    <span className="px-4 py-2 bg-zinc-100 text-zinc-700 text-sm font-medium rounded-2xl border border-zinc-200 shadow-sm">
                      {currentCard.category}
                    </span>
                    <span className="px-4 py-2 bg-rose-100 text-rose-700 text-sm font-medium rounded-2xl border border-rose-200 shadow-sm">
                      {currentCard.difficulty}
                    </span>
                  </div>
                  <h3 className="text-zinc-900 text-5xl font-bold mb-6 tracking-tight">{currentCard.word}</h3>
                  {currentCard.pronunciation && (
                    <p className="text-zinc-500 text-xl font-mono mb-4 tracking-wide">{currentCard.pronunciation}</p>
                  )}
                  <p className="text-zinc-600 text-xl font-normal mb-8">{currentCard.part_of_speech}</p>
                  <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl shadow-sm">
                    <p className="text-blue-800 text-base font-medium">💭 Try to recall the meaning, then flip to check!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Answer Side (Full Details) - 21st.dev style */}
            {isFlipped && (
              <div className="absolute inset-0 p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 overflow-y-auto">
                <div className="min-h-full flex flex-col space-y-4">
                  {/* Header */}
                  <div className="text-center pb-4 border-b border-zinc-200">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <span className="px-3 py-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-xl border border-zinc-200">
                        {currentCard.category}
                      </span>
                      <span className="px-3 py-1.5 bg-rose-100 text-rose-700 text-xs font-medium rounded-xl border border-rose-200">
                        {currentCard.difficulty}
                      </span>
                    </div>
                    <h3 className="text-zinc-900 text-3xl font-bold mb-2 tracking-tight">{currentCard.word}</h3>
                    {currentCard.pronunciation && (
                      <p className="text-zinc-500 text-base font-mono tracking-wide">{currentCard.pronunciation}</p>
                    )}
                    <p className="text-zinc-600 text-base font-medium">{currentCard.part_of_speech}</p>
                  </div>
                  
                  {/* Main Definition */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 transition-all duration-200 hover:shadow-md">
                    <p className="text-zinc-800 text-lg font-medium leading-relaxed text-center">
                      {currentCard.definition}
                    </p>
                  </div>
                  
                  {/* Content Sections - 21st.dev modern cards */}
                  <div className="flex-1 space-y-3 divide-y divide-zinc-100">
                    {/* Hint Sentence */}
                    {currentCard.memory_tip && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                          <p className="text-amber-800 text-sm font-semibold">Context Hint</p>
                        </div>
                        <p className="text-amber-900 text-sm italic leading-relaxed pl-4">"{currentCard.memory_tip}"</p>
                      </div>
                    )}
                    
                    {/* Example */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm transition-all duration-200 hover:shadow-md pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <p className="text-zinc-700 text-sm font-semibold">Example Usage</p>
                      </div>
                      <p className="text-zinc-600 text-sm italic leading-relaxed pl-4">"{currentCard.example_sentence}"</p>
                    </div>
                    
                    {/* Synonyms & Antonyms */}
                    <div className="grid grid-cols-1 gap-3 pt-3">
                      {currentCard.synonyms.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm transition-all duration-200 hover:shadow-md">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <p className="text-emerald-700 text-sm font-semibold">Similar Words</p>
                          </div>
                          <p className="text-emerald-800 text-sm pl-4">{currentCard.synonyms.slice(0, 3).join(' • ')}</p>
                        </div>
                      )}
                      
                      {currentCard.antonyms.length > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-sm transition-all duration-200 hover:shadow-md">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                            <p className="text-rose-700 text-sm font-semibold">Opposite Words</p>
                          </div>
                          <p className="text-rose-800 text-sm pl-4">{currentCard.antonyms.slice(0, 3).join(' • ')}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Etymology */}
                    {currentCard.etymology && (
                      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 shadow-sm transition-all duration-200 hover:shadow-md pt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <p className="text-purple-700 text-sm font-semibold">Word Origin</p>
                        </div>
                        <p className="text-purple-800 text-sm pl-4">{currentCard.etymology}</p>
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

        </div>

        {/* Action Buttons - 21st.dev modern style */}
        <div className="flex justify-stretch">
          <div className="flex flex-1 gap-3 flex-wrap py-3">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`flex items-center justify-center gap-2 h-11 px-4 rounded-2xl text-sm font-semibold border transition-all duration-200 ${
                currentIndex === 0 
                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border-zinc-200' 
                  : 'bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-200 shadow-sm hover:shadow-md'
              }`}
            >
              <ChevronLeft size={18} />
              Prev
            </button>
            
            <button
              onClick={handleFlip}
              className="flex-1 max-w-[200px] cursor-pointer items-center justify-center rounded-2xl h-11 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold shadow-lg border border-blue-600 transition-all duration-200 hover:shadow-xl hover:from-blue-700 hover:to-blue-800"
            >
              <span className="truncate">{isFlipped ? 'Test Yourself' : 'Show Answer'}</span>
            </button>
            
            <button
              onClick={handlePronounce}
              className="flex items-center justify-center gap-2 h-11 px-4 bg-white text-zinc-700 text-sm font-semibold rounded-2xl border border-zinc-200 shadow-sm transition-all duration-200 hover:bg-zinc-50 hover:shadow-md"
            >
              <Volume2 size={18} />
            </button>
            
            <button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className={`flex items-center justify-center gap-2 h-11 px-4 rounded-2xl text-sm font-semibold border transition-all duration-200 ${
                currentIndex === flashcards.length - 1
                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border-zinc-200'
                  : 'bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-200 shadow-sm hover:shadow-md'
              }`}
            >
              Next
              <ChevronRight size={18} />
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
          <div className="mt-4">
            <p className="text-zinc-600 text-base font-medium mb-4 text-center">How well did you know this word?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => handleDifficultyRating(1)}
                className="flex-1 py-3 px-4 bg-rose-50 text-rose-700 rounded-2xl font-semibold border border-rose-200 shadow-sm transition-all duration-200 hover:bg-rose-100 hover:shadow-md text-sm"
              >
                Don't Know
              </button>
              <button 
                onClick={() => handleDifficultyRating(3)}
                className="flex-1 py-3 px-4 bg-amber-50 text-amber-700 rounded-2xl font-semibold border border-amber-200 shadow-sm transition-all duration-200 hover:bg-amber-100 hover:shadow-md text-sm"
              >
                Somewhat
              </button>
              <button 
                onClick={() => handleDifficultyRating(5)}
                className="flex-1 py-3 px-4 bg-emerald-50 text-emerald-700 rounded-2xl font-semibold border border-emerald-200 shadow-sm transition-all duration-200 hover:bg-emerald-100 hover:shadow-md text-sm"
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