'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, CheckCircle, Clock, RefreshCw } from 'lucide-react'

interface Question {
  id: string
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  type: string
}

interface ReadingData {
  material: any
  timeSpent: number
  actualWPM: number
}

export default function ReadingQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({})
  const [showResult, setShowResult] = useState<{ [key: number]: boolean }>({})
  const [loading, setLoading] = useState(true)
  const [readingData, setReadingData] = useState<ReadingData | null>(null)
  const [jumpDelay, setJumpDelay] = useState<'manual' | 5 | 10>('manual')
  const [score, setScore] = useState(0)
  const [completed, setCompleted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadReadingData()
    generateQuestions()
  }, [])

  const loadReadingData = () => {
    const data = sessionStorage.getItem('readingData')
    if (data) {
      setReadingData(JSON.parse(data))
    } else {
      // 如果没有阅读数据，重定向回阅读页面
      router.push('/reading')
    }
  }

  const generateQuestions = async () => {
    setLoading(true)
    try {
      // 基于阅读材料生成问题
      const response = await fetch('/api/reading-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material: readingData?.material,
          questionCount: 5
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.questions) {
          setQuestions(data.questions)
        } else {
          // 使用fallback问题
          setQuestions(getFallbackQuestions())
        }
      } else {
        setQuestions(getFallbackQuestions())
      }
    } catch (error) {
      console.error('Error generating questions:', error)
      setQuestions(getFallbackQuestions())
    } finally {
      setLoading(false)
    }
  }

  const getFallbackQuestions = (): Question[] => {
    return [
      {
        id: 'q1',
        question: 'What was the main idea of the passage you just read?',
        options: [
          'To provide historical information',
          'To explain a scientific concept',
          'To persuade readers about a topic',
          'To tell an entertaining story'
        ],
        correct_answer: 'To explain a scientific concept',
        explanation: 'The passage primarily focused on explaining concepts and providing educational information.',
        type: 'comprehension'
      },
      {
        id: 'q2',
        question: 'Which reading strategy would be most helpful for understanding this type of text?',
        options: [
          'Skimming for general ideas',
          'Scanning for specific details',
          'Reading word by word slowly',
          'Focusing on the conclusion only'
        ],
        correct_answer: 'Skimming for general ideas',
        explanation: 'For comprehension passages, skimming helps identify main ideas quickly.',
        type: 'strategy'
      },
      {
        id: 'q3',
        question: 'What can you infer about the author\'s purpose?',
        options: [
          'To entertain readers',
          'To inform and educate',
          'To sell a product',
          'To express personal opinions'
        ],
        correct_answer: 'To inform and educate',
        explanation: 'Educational passages typically aim to inform and teach readers about a topic.',
        type: 'inference'
      }
    ]
  }

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answer
    })
  }

  const handleSubmitAnswer = (questionIndex: number) => {
    const question = questions[questionIndex]
    const selectedAnswer = selectedAnswers[questionIndex]
    
    if (!selectedAnswer) return

    // 显示结果
    setShowResult({
      ...showResult,
      [questionIndex]: true
    })

    // 更新分数
    if (selectedAnswer === question.correct_answer) {
      setScore(score + 1)
    }

    // 根据设置自动跳转或手动跳转
    if (jumpDelay !== 'manual') {
      setTimeout(() => {
        handleNextQuestion(questionIndex)
      }, jumpDelay * 1000)
    }
  }

  const handleNextQuestion = (currentIndex: number) => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // 所有问题完成
      setCompleted(true)
      saveTestResults()
    }
  }

  const saveTestResults = () => {
    const questionsWithResults = questions.map((q, index) => ({
      id: q.id,
      question: q.question,
      userAnswer: selectedAnswers[index] || '',
      correctAnswer: q.correct_answer,
      isCorrect: selectedAnswers[index] === q.correct_answer,
      explanation: q.explanation,
      type: q.type
    }))

    const results = {
      overallScore: Math.round((score / questions.length) * 100),
      correctAnswers: score,
      incorrectAnswers: questions.length - score,
      totalQuestions: questions.length,
      timeSpent: readingData ? `${Math.round(readingData.timeSpent / 60)} minutes` : 'Unknown',
      questions: questionsWithResults,
      readingSpeed: readingData?.actualWPM || 0,
      material: readingData?.material?.title || 'Reading Practice'
    }

    sessionStorage.setItem('testResults', JSON.stringify(results))
    console.log('Test results saved:', results)
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setSelectedAnswers({})
    setShowResult({})
    setScore(0)
    setCompleted(false)
  }

  const handleBackToReading = () => {
    sessionStorage.removeItem('readingData')
    router.push('/reading')
  }

  if (loading) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#197fe5] mb-4"></div>
        <h3 className="text-[#0e141b] text-lg font-bold mb-2">Generating Questions</h3>
        <p className="text-[#4e7397] text-sm text-center px-4">
          Creating comprehension questions based on your reading material...
        </p>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-center items-center p-4">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h3 className="text-[#0e141b] text-2xl font-bold mb-2">Reading Practice Complete!</h3>
        
        {readingData && (
          <div className="bg-white rounded-lg p-6 mb-6 w-full max-w-md">
            <h4 className="text-[#0e141b] text-lg font-semibold mb-4">Your Results</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#4e7397]">Reading Speed:</span>
                <span className="font-semibold">{readingData.actualWPM} WPM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4e7397]">Time Spent:</span>
                <span className="font-semibold">{Math.round(readingData.timeSpent / 60)}m {readingData.timeSpent % 60}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4e7397]">Comprehension Score:</span>
                <span className="font-semibold">{score}/{questions.length} ({Math.round((score/questions.length)*100)}%)</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-md">
          <button
            onClick={() => router.push('/test/results')}
            className="w-full bg-green-500 text-white rounded-lg h-12 px-4 text-sm font-bold hover:bg-green-600"
          >
            View Detailed Results
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleRestart}
              className="flex-1 bg-[#197fe5] text-white rounded-lg h-12 px-4 text-sm font-bold hover:bg-[#1668c7]"
            >
              Review Questions
            </button>
            <button
              onClick={handleBackToReading}
              className="flex-1 bg-gray-200 text-gray-900 rounded-lg h-12 px-4 text-sm font-bold hover:bg-gray-300"
            >
              New Reading
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const hasAnswered = showResult[currentIndex]
  const selectedAnswer = selectedAnswers[currentIndex]

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between border-b border-gray-200">
        <button onClick={handleBackToReading} className="text-[#0e141b] flex size-12 shrink-0 items-center">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          Reading Comprehension
        </h2>
        <button
          onClick={() => {
            const nextDelay = jumpDelay === 'manual' ? 5 : jumpDelay === 5 ? 10 : 'manual'
            setJumpDelay(nextDelay)
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-[#197fe5] hover:text-[#1570d4]"
        >
          <Settings size={16} />
          {jumpDelay === 'manual' ? 'Manual' : `${jumpDelay}s`}
        </button>
      </div>

      {/* Progress */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#4e7397] text-sm">Question {currentIndex + 1} of {questions.length}</span>
          <span className="text-[#4e7397] text-sm">Score: {score}/{currentIndex}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-[#197fe5] h-2 rounded-full transition-all duration-300" 
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg p-4 border border-[#d0dbe7] mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 bg-[#e7edf3] text-[#4e7397] text-xs font-medium rounded">
              {currentQuestion.type}
            </span>
            <span className="px-2 py-1 bg-[#f0f0f0] text-[#666] text-xs font-medium rounded">
              Question {currentIndex + 1}
            </span>
          </div>
          <p className="text-[#0e141b] text-base font-medium leading-normal">
            {currentQuestion.question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <label 
              key={index}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedAnswer === option
                  ? 'border-[#197fe5] bg-blue-50'
                  : 'border-[#d0dbe7] bg-white hover:bg-gray-50'
              } ${
                hasAnswered && option === currentQuestion.correct_answer
                  ? 'border-green-500 bg-green-50'
                  : ''
              } ${
                hasAnswered && selectedAnswer === option && option !== currentQuestion.correct_answer
                  ? 'border-red-500 bg-red-50'
                  : ''
              }`}
            >
              <input
                type="radio"
                name={`question-${currentIndex}`}
                value={option}
                checked={selectedAnswer === option}
                onChange={(e) => handleAnswerSelect(currentIndex, e.target.value)}
                disabled={hasAnswered}
                className="h-4 w-4 text-[#197fe5] border-gray-300 focus:ring-[#197fe5]"
              />
              <span className="text-[#0e141b] text-sm leading-normal flex-1">{option}</span>
              
              {hasAnswered && (
                <div className="flex items-center">
                  {option === currentQuestion.correct_answer ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : selectedAnswer === option ? (
                    <div className="w-5 h-5 rounded-full border-2 border-red-600 flex items-center justify-center">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    </div>
                  ) : null}
                </div>
              )}
            </label>
          ))}
        </div>

        {/* Explanation */}
        {hasAnswered && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-sm text-blue-800">Explanation:</span>
            </div>
            <p className="text-blue-900 text-sm leading-relaxed">
              {currentQuestion.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-200">
        {!hasAnswered ? (
          <button
            onClick={() => handleSubmitAnswer(currentIndex)}
            disabled={!selectedAnswer}
            className={`w-full rounded-lg h-12 px-4 text-sm font-bold leading-normal tracking-[0.015em] ${
              !selectedAnswer
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#197fe5] text-white hover:bg-[#1668c7]'
            }`}
          >
            Submit Answer
          </button>
        ) : (
          <div className="flex gap-3">
            {jumpDelay === 'manual' && (
              <button
                onClick={() => handleNextQuestion(currentIndex)}
                className="flex-1 bg-[#197fe5] text-white rounded-lg h-12 px-4 text-sm font-bold hover:bg-[#1668c7]"
              >
                {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish'}
              </button>
            )}
            {jumpDelay !== 'manual' && (
              <div className="flex-1 flex items-center justify-center gap-2 text-[#4e7397] text-sm">
                <Clock size={16} />
                Next question in {jumpDelay} seconds...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}