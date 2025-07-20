'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  X,
  House,
  Search,
  Bookmark,
  User,
  BookOpen,
  Bot
} from 'lucide-react'
import AIAssistantButton from '@/components/ui/ai-assistant-button'

interface Question {
  id: string
  type: 'vocabulary' | 'reading' | 'math'
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

const mockQuestion: Question = {
  id: '1',
  type: 'vocabulary',
  question: "Which of the following is the best definition of 'ambivalent'?",
  options: [
    "Having mixed feelings or contradictory ideas about something or someone.",
    "Showing or feeling active opposition toward something or someone.",
    "Feeling or showing sympathy and concern for others.",
    "Having or showing a lack of ambition or determination."
  ],
  correctAnswer: "Having mixed feelings or contradictory ideas about something or someone.",
  explanation: "Ambivalent means having mixed feelings or contradictory ideas about something or someone. It comes from the Latin 'ambi' (both) and 'valent' (strong), literally meaning 'having strength in both directions.'"
}

export default function TestPage() {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [totalQuestions] = useState(5)
  const [showAnswer, setShowAnswer] = useState(false)
  const [currentTab, setCurrentTab] = useState('test')
  
  // Mock user ID - replace with actual auth
  const userId = 'user-1'

  const progress = (currentQuestion / totalQuestions) * 100

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
  }

  const handleNext = () => {
    if (selectedAnswer) {
      // Process answer logic here
      setShowAnswer(true)
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1)
        setSelectedAnswer('')
        setShowAnswer(false)
      }, 2000)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(prev => prev - 1)
      setSelectedAnswer('')
      setShowAnswer(false)
    }
  }

  return (
    <div 
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center bg-gray-50 p-3 pb-2 justify-between">
        <Link href="/" className="text-gray-900 flex size-12 shrink-0 items-center justify-center">
          <X className="h-6 w-6" />
        </Link>
        <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-12">
          Section 1
        </h2>
      </div>

      {/* Progress Section */}
      <div className="flex flex-col gap-2 p-3">
        <div className="flex gap-6 justify-between">
          <p className="text-gray-900 text-sm font-medium leading-normal">
            Question {currentQuestion} of {totalQuestions}
          </p>
          <p className="text-gray-600 text-sm">{Math.round(progress)}%</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-[#197fe5] h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 max-h-[calc(100vh-280px)] overflow-y-auto">
        <p className="text-gray-900 text-base font-normal leading-normal pb-3 pt-1 px-3">
          {mockQuestion.question}
        </p>

        {/* Answer Options */}
        <div className="flex flex-col gap-3 p-3">
          {mockQuestion.options.map((option, index) => (
            <label 
              key={index}
              className={`flex items-center gap-4 rounded-lg border-2 border-solid p-3 cursor-pointer transition-colors ${
                selectedAnswer === option ? 'border-primary-500 bg-primary-50' : ''
              } ${
                showAnswer && option === mockQuestion.correctAnswer ? 'border-green-500 bg-green-50' : ''
              } ${
                showAnswer && selectedAnswer === option && option !== mockQuestion.correctAnswer ? 'border-red-500 bg-red-50' : ''
              }`}
            >
              <input
                type="radio"
                className="h-5 w-5 border-2 border-gray-300 bg-transparent text-transparent checked:border-primary-500 checked:bg-primary-500 focus:outline-none focus:ring-0 focus:ring-offset-0 checked:focus:border-primary-500"
                name="answer"
                value={option}
                checked={selectedAnswer === option}
                onChange={() => handleAnswerSelect(option)}
                disabled={showAnswer}
              />
              <div className="flex grow flex-col">
                <p className="text-gray-900 text-sm font-medium leading-normal">
                  {option}
                </p>
              </div>
              
              {/* Show correct/incorrect icons when answer is revealed */}
              {showAnswer && (
                <div className="flex items-center">
                  {option === mockQuestion.correctAnswer ? (
                    <div className="text-green-600 text-xl">✓</div>
                  ) : selectedAnswer === option ? (
                    <div className="text-red-600 text-xl">✗</div>
                  ) : null}
                </div>
              )}
            </label>
          ))}
        </div>

        {/* Explanation (shown after answer) */}
        {showAnswer && (
          <div className="mx-3 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">Explanation:</h4>
            <p className="text-blue-800 text-sm leading-relaxed">
              {mockQuestion.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-stretch">
        <div className="flex flex-1 gap-3 flex-wrap px-3 py-2 justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 1}
            className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 text-sm font-bold leading-normal tracking-wide ${
              currentQuestion === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-900'
            }`}
          >
            <span className="truncate">Previous</span>
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedAnswer || showAnswer}
            className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 text-sm font-bold leading-normal tracking-wide ${
              !selectedAnswer || showAnswer
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-500 text-white'
            }`}
          >
            <span className="truncate">
              {currentQuestion === totalQuestions ? 'Finish' : 'Next'}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
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
        <Link href="/review" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
          <div className="text-[#4e7397] flex h-8 items-center justify-center">
            <Search size={24} />
          </div>
          <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Review</p>
        </Link>
        <Link href="/aitutor" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
          <div className="text-[#4e7397] flex h-8 items-center justify-center">
            <Bot size={24} />
          </div>
          <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">AI Tutor</p>
        </Link>
        <Link href="/profile" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
          <div className="text-[#4e7397] flex h-8 items-center justify-center">
            <User size={24} />
          </div>
          <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Profile</p>
        </Link>
      </div>
      
      {/* Safe area for mobile */}
      <div className="h-5 bg-slate-50"></div>
    </div>
  )
}