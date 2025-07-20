'use client'

import Link from 'next/link'
import { 
  X,
  House,
  Check,
  List,
  Search,
  User,
  BookOpen,
  Bot
} from 'lucide-react'

interface QuestionResult {
  id: number
  question: string
  isCorrect: boolean
  userAnswer: string
  correctAnswer: string
  explanation: string
}

const mockResults = {
  overallScore: 75,
  correctAnswers: 60,
  incorrectAnswers: 20,
  totalQuestions: 80,
  timeSpent: '45 minutes',
  questions: [
    { id: 1, question: "Question 1", isCorrect: true, userAnswer: "A", correctAnswer: "A", explanation: "..." },
    { id: 2, question: "Question 2", isCorrect: false, userAnswer: "B", correctAnswer: "C", explanation: "..." },
    { id: 3, question: "Question 3", isCorrect: true, userAnswer: "C", correctAnswer: "C", explanation: "..." },
    { id: 4, question: "Question 4", isCorrect: false, userAnswer: "A", correctAnswer: "D", explanation: "..." },
    { id: 5, question: "Question 5", isCorrect: true, userAnswer: "B", correctAnswer: "B", explanation: "..." },
    { id: 6, question: "Question 6", isCorrect: true, userAnswer: "A", correctAnswer: "A", explanation: "..." },
    { id: 7, question: "Question 7", isCorrect: false, userAnswer: "C", correctAnswer: "B", explanation: "..." },
    { id: 8, question: "Question 8", isCorrect: true, userAnswer: "D", correctAnswer: "D", explanation: "..." },
    { id: 9, question: "Question 9", isCorrect: true, userAnswer: "A", correctAnswer: "A", explanation: "..." },
    { id: 10, question: "Question 10", isCorrect: false, userAnswer: "B", correctAnswer: "C", explanation: "..." },
  ]
}

export default function TestResultsPage() {
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
        <h2 className={`text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5 ${getScoreColor(mockResults.overallScore)}`}>
          Overall Score: {mockResults.overallScore}%
        </h2>

        {/* Score Message */}
        <p className="text-gray-600 text-center px-4 pb-4">
          {getScoreMessage(mockResults.overallScore)}
        </p>

        {/* Stats Cards */}
        <div className="flex flex-wrap gap-4 p-4">
          <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-gray-300 bg-white">
            <p className="text-gray-900 text-base font-medium leading-normal">Correct Answers</p>
            <p className="text-green-600 text-2xl font-bold leading-tight">{mockResults.correctAnswers}</p>
          </div>
          <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-gray-300 bg-white">
            <p className="text-gray-900 text-base font-medium leading-normal">Incorrect Answers</p>
            <p className="text-red-600 text-2xl font-bold leading-tight">{mockResults.incorrectAnswers}</p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="flex flex-wrap gap-4 px-4 pb-4">
          <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-gray-300 bg-white">
            <p className="text-gray-900 text-base font-medium leading-normal">Total Questions</p>
            <p className="text-gray-900 text-2xl font-bold leading-tight">{mockResults.totalQuestions}</p>
          </div>
          <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-gray-300 bg-white">
            <p className="text-gray-900 text-base font-medium leading-normal">Time Spent</p>
            <p className="text-gray-900 text-2xl font-bold leading-tight">{mockResults.timeSpent}</p>
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
          {mockResults.questions.map((question) => (
            <div key={question.id} className="flex items-center gap-4 bg-gray-50 px-4 min-h-14 justify-between rounded-lg">
              <p className="text-gray-900 text-base font-normal leading-normal flex-1 truncate">
                Question {question.id}
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
          <button className="flex-1 py-3 px-4 bg-primary-500 text-white rounded-lg font-medium">
            Review Mistakes
          </button>
          <button className="flex-1 py-3 px-4 bg-gray-200 text-gray-900 rounded-lg font-medium">
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
          href="/aitutor" 
          className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]"
        >
          <div className="text-[#4e7397] flex h-8 items-center justify-center">
            <Bot size={24} />
          </div>
          <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">AI Tutor</p>
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