'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { X, ArrowLeft, Check } from 'lucide-react'

interface Question {
  id: string
  question: string
  isCorrect: boolean
  userAnswer: string
  correctAnswer: string
  explanation: string
  type?: string
}

export default function ReviewMistakesPage() {
  const router = useRouter()
  const [mistakes, setMistakes] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMistakes = () => {
      try {
        const reviewQuestions = sessionStorage.getItem('reviewQuestions')
        if (reviewQuestions) {
          const parsedMistakes = JSON.parse(reviewQuestions)
          setMistakes(parsedMistakes)
        } else {
          // No mistakes to review, redirect back
          router.push('/test/results')
        }
      } catch (error) {
        console.error('Error loading review questions:', error)
        router.push('/test/results')
      } finally {
        setLoading(false)
      }
    }

    loadMistakes()
  }, [router])

  const handleNext = () => {
    if (currentIndex < mistakes.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Finished reviewing all mistakes
      router.push('/test/results')
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  if (loading) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading review questions...</p>
      </div>
    )
  }

  if (mistakes.length === 0) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-center items-center">
        <Check className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Perfect Score!</h2>
        <p className="text-gray-600 mb-4">You didn't make any mistakes to review.</p>
        <Link href="/test/results" className="px-4 py-2 bg-blue-500 text-white rounded-lg">
          Back to Results
        </Link>
      </div>
    )
  }

  const currentMistake = mistakes[currentIndex]

  return (
    <div 
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
          <Link href="/test/results" className="text-[#0e141b] flex size-12 shrink-0 items-center">
            <X size={24} />
          </Link>
          <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Review Mistakes
          </h2>
        </div>

        {/* Progress */}
        <div className="flex flex-col gap-3 p-4">
          <div className="flex gap-6 justify-between">
            <p className="text-[#0e141b] text-base font-medium leading-normal">
              Question {currentIndex + 1} of {mistakes.length}
            </p>
            <p className="text-[#4e7397] text-sm">
              {Math.round(((currentIndex + 1) / mistakes.length) * 100)}% Complete
            </p>
          </div>
          <div className="rounded bg-[#d0dbe7]">
            <div 
              className="h-2 rounded bg-[#197fe5] transition-all duration-300" 
              style={{ width: `${((currentIndex + 1) / mistakes.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              INCORRECT
            </span>
            {currentMistake.type && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {currentMistake.type.toUpperCase()}
              </span>
            )}
          </div>
          
          <p className="text-[#0e141b] text-base font-normal leading-normal mb-4">
            {currentMistake.question}
          </p>

          {/* Your Answer vs Correct Answer */}
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm font-semibold mb-1">Your Answer:</p>
              <p className="text-red-700 text-sm">{currentMistake.userAnswer}</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 text-sm font-semibold mb-1">Correct Answer:</p>
              <p className="text-green-700 text-sm">{currentMistake.correctAnswer}</p>
            </div>
          </div>

          {/* Explanation */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">Explanation:</h4>
            <p className="text-blue-800 text-sm leading-relaxed">
              {currentMistake.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-stretch">
        <div className="flex flex-1 gap-3 flex-wrap px-4 py-6 justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 text-sm font-bold leading-normal tracking-wide ${
              currentIndex === 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            <span className="truncate">Previous</span>
          </button>
          <button
            onClick={handleNext}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 text-sm font-bold leading-normal tracking-wide bg-[#197fe5] text-white hover:bg-[#1570d4]"
          >
            <span className="truncate">
              {currentIndex === mistakes.length - 1 ? 'Finish Review' : 'Next'}
            </span>
          </button>
        </div>
      </div>
      
      <div className="h-5 bg-slate-50"></div>
    </div>
  )
}