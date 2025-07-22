'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  X,
  House,
  Search,
  Bookmark,
  User,
  BookOpen,
  Loader2
} from 'lucide-react'
import { MockSessionManager as SessionManager } from '@/lib/mock-auth'

interface Question {
  id: string
  type: 'vocabulary' | 'reading' | 'math' | 'writing'
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
}

export default function TestPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [totalQuestions] = useState(5)
  const [showAnswer, setShowAnswer] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isFallback, setIsFallback] = useState(false)
  const [basedOnUserMaterials, setBasedOnUserMaterials] = useState(false)
  const [userMaterialsCount, setUserMaterialsCount] = useState(0)
  
  const currentUser = SessionManager.getCurrentUser()
  const userId = currentUser?.id || 'anonymous'

  const progress = (currentQuestion / totalQuestions) * 100
  const currentQuestionData = questions[currentQuestion - 1]

  // 加载AI生成的题目
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoading(true)
        setError('')

        console.log('Requesting questions with userId:', userId)
        
        // 确保API URL正确
        const apiUrl = process.env.NODE_ENV === 'production' 
          ? '/api/generate-questions' 
          : '/api/generate-questions'
        
        console.log('Making request to:', apiUrl)
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            questionType: 'mixed',
            count: totalQuestions
          })
        })

        console.log('Response status:', response.status)
        console.log('Response headers:', Object.fromEntries(response.headers.entries()))

        // 先获取响应文本，然后检查是否为JSON
        const responseText = await response.text()
        console.log('Response text preview:', responseText.substring(0, 200))

        if (!response.ok) {
          // 尝试解析为JSON，如果失败就使用原始文本
          let errorData
          try {
            errorData = JSON.parse(responseText)
          } catch {
            throw new Error(`Server error (${response.status}): ${responseText.substring(0, 100)}`)
          }
          throw new Error(errorData.error || 'Failed to generate questions')
        }

        // 解析JSON响应
        let data
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error('JSON parse error:', parseError)
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`)
        }
        
        if (data.success && data.questions) {
          console.log('Successfully loaded questions:', data.questions.length)
          console.log('Questions based on user materials:', data.metadata?.basedOnUserMaterials)
          console.log('User materials count:', data.metadata?.userMaterialsCount)
          
          if (data.metadata?.isFallback) {
            console.log('Using fallback questions due to AI timeout')
            setIsFallback(true)
          } else {
            setBasedOnUserMaterials(data.metadata?.basedOnUserMaterials || false)
            setUserMaterialsCount(data.metadata?.userMaterialsCount || 0)
          }
          setQuestions(data.questions)
        } else {
          throw new Error('Invalid response format: ' + JSON.stringify(data))
        }
      } catch (error) {
        console.error('Error loading questions:', error)
        setError(error instanceof Error ? error.message : 'Failed to load questions')
        
        // 如果AI生成失败，使用备用题目
        setQuestions([
          {
            id: 'fallback_1',
            type: 'vocabulary',
            question: "Which word is closest in meaning to 'meticulous'?",
            options: ["Careless", "Detailed", "Quick", "Loud"],
            correctAnswer: "Detailed",
            explanation: "Meticulous means showing great attention to detail; very careful and precise."
          },
          {
            id: 'fallback_2',
            type: 'math',
            question: "If x + 5 = 12, what is x?",
            options: ["5", "7", "17", "12"],
            correctAnswer: "7",
            explanation: "To solve x + 5 = 12, subtract 5 from both sides: x = 7."
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadQuestions()
  }, [userId, totalQuestions])

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
  }

  const handleNext = () => {
    if (selectedAnswer) {
      // Process answer logic here
      setShowAnswer(true)
      setTimeout(() => {
        if (currentQuestion < totalQuestions) {
          setCurrentQuestion(prev => prev + 1)
          setSelectedAnswer('')
          setShowAnswer(false)
        } else {
          // Navigate to results page
          window.location.href = '/test/results'
        }
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

      {/* Question Content */}
      <div className="flex-1 max-h-[calc(100vh-280px)] overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] px-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#197fe5] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI正在为您生成题目...</h3>
            <p className="text-sm text-gray-600 text-center">
              根据您的学习材料和历史表现，AI正在创建个性化的SSAT题目
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] px-4">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">生成题目时遇到问题</h3>
            <p className="text-sm text-gray-600 text-center mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#197fe5] text-white rounded-lg text-sm font-medium"
            >
              重试
            </button>
          </div>
        ) : !currentQuestionData ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] px-4">
            <p className="text-gray-600">没有可用的题目</p>
          </div>
        ) : (
          <>
            <div className="px-3 pt-1 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {currentQuestionData.type.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  {isFallback 
                    ? '标准题库' 
                    : basedOnUserMaterials 
                      ? `基于您的学习材料 (${userMaterialsCount}份)` 
                      : 'AI生成 (通用)'
                  }
                </span>
              </div>
              <p className="text-gray-900 text-base font-normal leading-normal">
                {currentQuestionData.question}
              </p>
            </div>

            {/* Answer Options */}
            <div className="flex flex-col gap-3 p-3">
              {currentQuestionData.options.map((option, index) => (
                <label 
                  key={index}
                  className={`flex items-center gap-4 rounded-lg border-2 border-solid p-3 cursor-pointer transition-colors ${
                    selectedAnswer === option ? 'border-primary-500 bg-primary-50' : ''
                  } ${
                    showAnswer && option === currentQuestionData.correctAnswer ? 'border-green-500 bg-green-50' : ''
                  } ${
                    showAnswer && selectedAnswer === option && option !== currentQuestionData.correctAnswer ? 'border-red-500 bg-red-50' : ''
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
                      {option === currentQuestionData.correctAnswer ? (
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
                <h4 className="font-semibold text-blue-900 mb-2 text-sm">AI解释:</h4>
                <p className="text-blue-800 text-sm leading-relaxed">
                  {currentQuestionData.explanation}
                </p>
              </div>
            )}
          </>
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
            disabled={!selectedAnswer || showAnswer || isLoading || !currentQuestionData}
            className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 text-sm font-bold leading-normal tracking-wide ${
              !selectedAnswer || showAnswer || isLoading || !currentQuestionData
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-500 text-white'
            }`}
          >
            <span className="truncate">
              {isLoading ? 'Loading...' : currentQuestion === totalQuestions ? 'Finish' : 'Next'}
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