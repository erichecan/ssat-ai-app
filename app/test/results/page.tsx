'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  X,
  House,
  Check,
  List,
  Search,
  User,
  BookOpen
} from 'lucide-react'

interface QuestionResult {
  id: string
  question: string
  isCorrect: boolean
  userAnswer: string
  correctAnswer: string
  explanation: string
  type?: string
}

interface TestResults {
  overallScore: number
  correctAnswers: number
  incorrectAnswers: number
  totalQuestions: number
  timeSpent: string
  questions: QuestionResult[]
}

export default function TestResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<TestResults | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 尝试从sessionStorage获取真实的测试结果
    const loadTestResults = () => {
      try {
        const sessionResults = sessionStorage.getItem('testResults')
        const readingData = sessionStorage.getItem('readingData')
        
        if (sessionResults) {
          const parsedResults = JSON.parse(sessionResults)
          setResults(parsedResults)
        } else if (readingData) {
          // 如果有阅读数据，从中构造结果
          const readingSession = JSON.parse(readingData)
          const mockResults = createResultsFromReadingData(readingSession)
          setResults(mockResults)
        } else {
          // 如果没有真实数据，使用默认值但标记为演示
          setResults(createDemoResults())
        }
      } catch (error) {
        console.error('Error loading test results:', error)
        setResults(createDemoResults())
      } finally {
        setLoading(false)
      }
    }

    loadTestResults()
  }, [])

  const createResultsFromReadingData = (readingData: any): TestResults => {
    // 从阅读数据创建结果
    const questions = readingData.questions || []
    const correctCount = questions.filter((q: any) => q.isCorrect).length
    const totalCount = questions.length
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
    
    return {
      overallScore: score,
      correctAnswers: correctCount,
      incorrectAnswers: totalCount - correctCount,
      totalQuestions: totalCount,
      timeSpent: readingData.timeSpent || 'Unknown',
      questions: questions
    }
  }

  const createDemoResults = (): TestResults => {
    // 创建演示结果（标记为演示）
    return {
      overallScore: 80,
      correctAnswers: 4,
      incorrectAnswers: 1,
      totalQuestions: 5,
      timeSpent: '3 minutes',
      questions: [
        { id: '1', question: "Demo Question 1", isCorrect: true, userAnswer: "A", correctAnswer: "A", explanation: "Correct answer", type: "reading" },
        { id: '2', question: "Demo Question 2", isCorrect: true, userAnswer: "B", correctAnswer: "B", explanation: "Correct answer", type: "reading" },
        { id: '3', question: "Demo Question 3", isCorrect: false, userAnswer: "C", correctAnswer: "D", explanation: "The correct answer was D", type: "reading" },
        { id: '4', question: "Demo Question 4", isCorrect: true, userAnswer: "A", correctAnswer: "A", explanation: "Correct answer", type: "reading" },
        { id: '5', question: "Demo Question 5", isCorrect: true, userAnswer: "B", correctAnswer: "B", explanation: "Correct answer", type: "reading" },
      ]
    }
  }

  const handleReviewMistakes = () => {
    if (!results) return
    
    const mistakes = results.questions.filter(q => !q.isCorrect)
    if (mistakes.length === 0) {
      alert('Congratulations! You got all questions correct!')
      return
    }
    
    // 将错误问题存储到sessionStorage
    sessionStorage.setItem('reviewQuestions', JSON.stringify(mistakes))
    router.push('/review/mistakes')
  }

  const handleTakeAgain = () => {
    // 清除之前的结果并重新开始测试
    sessionStorage.removeItem('testResults')
    sessionStorage.removeItem('readingData')
    router.push('/reading')
  }

  if (loading) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading results...</p>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-center items-center">
        <p className="text-gray-600">No test results found</p>
        <Link href="/reading" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">
          Take a Test
        </Link>
      </div>
    )
  }
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreMessage = (score: number) => {
    if (score >= 80) return 'Excellent work! 🎉'
    if (score >= 60) return 'Good job! Keep practicing 📚'
    return 'Keep studying! You can do it 💪'
  }

  return (
    <div 
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
          <Link href="/test" className="text-[#0e141b] flex size-12 shrink-0 items-center">
            <X size={24} />
          </Link>
          <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Test Results
          </h2>
        </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Overall Score */}
        <h2 className={`text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5 ${getScoreColor(results.overallScore)}`}>
          Overall Score: {results.overallScore}%
        </h2>

        {/* Score Message */}
        <p className="text-gray-600 text-center px-4 pb-4">
          {getScoreMessage(results.overallScore)}
        </p>

        {/* Stats Cards */}
        <div className="flex flex-wrap gap-4 p-4">
          <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-gray-300 bg-white">
            <p className="text-gray-900 text-base font-medium leading-normal">Correct Answers</p>
            <p className="text-green-600 text-2xl font-bold leading-tight">{results.correctAnswers}</p>
          </div>
          <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-gray-300 bg-white">
            <p className="text-gray-900 text-base font-medium leading-normal">Incorrect Answers</p>
            <p className="text-red-600 text-2xl font-bold leading-tight">{results.incorrectAnswers}</p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="flex flex-wrap gap-4 px-4 pb-4">
          <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-gray-300 bg-white">
            <p className="text-gray-900 text-base font-medium leading-normal">Total Questions</p>
            <p className="text-gray-900 text-2xl font-bold leading-tight">{results.totalQuestions}</p>
          </div>
          <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-gray-300 bg-white">
            <p className="text-gray-900 text-base font-medium leading-normal">Time Spent</p>
            <p className="text-gray-900 text-2xl font-bold leading-tight">{results.timeSpent}</p>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="mx-4 mb-4 p-6 bg-white rounded-xl border border-gray-300">
          <h3 className="text-gray-900 text-lg font-semibold mb-4">Performance Breakdown</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Vocabulary</span>
                <span className="text-sm text-gray-900">85%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill bg-green-500" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Reading Comprehension</span>
                <span className="text-sm text-gray-900">70%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill bg-yellow-500" style={{ width: '70%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Mathematics</span>
                <span className="text-sm text-gray-900">65%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill bg-orange-500" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Review */}
        <h2 className="text-gray-900 text-[22px] font-bold leading-tight tracking-tight px-4 pb-3 pt-5">
          Question Review
        </h2>
        
        <div className="space-y-1 px-4">
          {results.questions.map((question, index) => (
            <div key={question.id} className="flex items-center gap-4 bg-gray-50 px-4 min-h-14 justify-between rounded-lg">
              <p className="text-gray-900 text-base font-normal leading-normal flex-1 truncate">
                Question {index + 1}: {question.question.substring(0, 40)}...
              </p>
              <div className="shrink-0">
                {question.isCorrect ? (
                  <div className="text-green-600 flex size-7 items-center justify-center">
                    <Check className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="text-red-600 flex size-7 items-center justify-center">
                    <X className="h-5 w-5" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 px-4 py-6">
          <button 
            onClick={handleReviewMistakes}
            className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Review Mistakes
          </button>
          <button 
            onClick={handleTakeAgain}
            className="flex-1 py-3 px-4 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Take Again
          </button>
        </div>

        {/* Recommendations */}
        <div className="mx-4 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">📚 Study Recommendations</h4>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Focus on reading comprehension practice</li>
            <li>• Review mathematical concepts and formulas</li>
            <li>• Practice more vocabulary questions</li>
          </ul>
        </div>
      </div>

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
          href="/test" 
          className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full text-[#0e141b]"
        >
          <div className="text-[#0e141b] flex h-8 items-center justify-center">
            <List size={24} fill="currentColor" />
          </div>
          <p className="text-[#0e141b] text-xs font-medium leading-normal tracking-[0.015em]">Tests</p>
        </Link>
        <Link 
          href="/review" 
          className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]"
        >
          <div className="text-[#4e7397] flex h-8 items-center justify-center">
            <Search size={24} />
          </div>
          <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Review</p>
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