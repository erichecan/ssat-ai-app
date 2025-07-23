'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, House, BookOpen, Brain, User, ChevronLeft, ChevronRight, RefreshCw, Bot , FileText} from 'lucide-react';
import { MockSessionManager as SessionManager } from '@/lib/mock-auth';

interface ReviewQuestion {
  id: string
  question: string
  passage?: string
  options: string[]
  correct_answer: string
  user_answer: string
  explanation: string
  type: string
  difficulty: string
  answered_at: string
  time_spent: number
  session_id: string
}

interface ReviewStats {
  totalIncorrect: number
  bySubject: Record<string, number>
  byDifficulty: Record<string, number>
  averageTime: number
}


export default function ReviewPage() {
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser) return;

      const response = await fetch(`/api/review?userId=${currentUser.id}`);
      const result = await response.json();

      if (response.ok) {
        setQuestions(result.questions);
        setStats(result.stats);
      } else {
        setError('Failed to load review data');
      }
    } catch (error) {
      console.error('Error loading review data:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const markAsReviewed = async (questionId: string) => {
    try {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser) return;

      await fetch('/api/review', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          userId: currentUser.id,
          action: 'mark_reviewed'
        })
      });
    } catch (error) {
      console.error('Error marking question as reviewed:', error);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion) {
      markAsReviewed(currentQuestion.id);
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const getAnswerStatus = (option: string) => {
    if (option === currentQuestion.correct_answer) {
      return 'correct';
    }
    if (option === currentQuestion.user_answer && option !== currentQuestion.correct_answer) {
      return 'incorrect';
    }
    return 'default';
  };

  const getOptionStyle = (option: string) => {
    const status = getAnswerStatus(option);
    if (status === 'correct') {
      return 'border-green-500 bg-green-50';
    }
    if (status === 'incorrect') {
      return 'border-red-500 bg-red-50';
    }
    return 'border-[#d0dbe7]';
  };

  if (loading) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#197fe5]"></div>
        <p className="text-[#4e7397] text-sm mt-2">Loading review questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-center items-center">
        <p className="text-[#4e7397] text-base mb-4">{error}</p>
        <button onClick={loadReviewData} className="text-[#197fe5] flex items-center gap-2">
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-center items-center">
        <div className="text-center px-4">
          <Bot className="w-16 h-16 text-[#197fe5] mx-auto mb-4" />
          <h3 className="text-[#0e141b] text-lg font-bold mb-2">No Questions to Review</h3>
          <p className="text-[#4e7397] text-sm mb-4">You haven't answered any questions incorrectly yet. Keep practicing!</p>
          <Link href="/practice" className="text-[#197fe5] font-semibold">Start Practice Session</Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between overflow-x-hidden"
      style={{ 
        fontFamily: 'Lexend, "Noto Sans", sans-serif'
      } as React.CSSProperties}
    >
      <div>
        {/* Header */}
        <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
          <Link href="/" className="text-[#0e141b] flex size-12 shrink-0 items-center">
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Review
          </h2>
        </div>

        {/* Question Counter and Stats */}
        <div className="px-4 py-4">
          <h3 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] mb-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h3>
          {stats && (
            <p className="text-[#4e7397] text-sm">
              {stats.totalIncorrect} incorrect answers to review
            </p>
          )}
        </div>

        {/* Subject and Difficulty Badges */}
        <div className="px-4 pb-2 flex gap-2">
          <span className="inline-block px-3 py-1 bg-[#e7edf3] text-[#4e7397] text-xs font-medium rounded-full">
            {currentQuestion.type}
          </span>
          <span className="inline-block px-3 py-1 bg-[#f0f0f0] text-[#666] text-xs font-medium rounded-full">
            {currentQuestion.difficulty}
          </span>
        </div>

        {/* Passage (if exists) */}
        {currentQuestion.passage && (
          <div className="px-4 py-3">
            <div className="bg-white rounded-lg p-4 border border-[#d0dbe7]">
              <p className="text-[#0e141b] text-base font-normal leading-normal">
                {currentQuestion.passage}
              </p>
            </div>
          </div>
        )}

        {/* Question */}
        <p className="text-[#0e141b] text-base font-normal leading-normal pb-3 pt-1 px-4 font-medium">
          {currentQuestion.question}
        </p>

        {/* Options */}
        <div className="flex flex-col gap-3 p-4">
          {currentQuestion.options.map((option, index) => (
            <label 
              key={index}
              className={`flex items-center gap-4 rounded-lg border border-solid p-[15px] ${getOptionStyle(option)}`}
            >
              <input
                type="radio"
                className="h-5 w-5 border-2 border-[#d0dbe7] bg-transparent text-transparent checked:border-[#197fe5] checked:bg-[#197fe5] focus:outline-none focus:ring-0 focus:ring-offset-0 checked:focus:border-[#197fe5]"
                name={`question-${currentQuestion.id}`}
                checked={option === currentQuestion.user_answer}
                readOnly
              />
              <div className="flex grow flex-col">
                <p className="text-[#0e141b] text-sm font-medium leading-normal">
                  {option}
                </p>
                {getAnswerStatus(option) === 'correct' && (
                  <p className="text-green-600 text-xs mt-1">✓ Correct Answer</p>
                )}
                {getAnswerStatus(option) === 'incorrect' && (
                  <p className="text-red-600 text-xs mt-1">✗ Your Answer</p>
                )}
              </div>
            </label>
          ))}
        </div>

        {/* Answer Summary */}
        <div className="px-4 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-[#4e7397] text-sm font-medium min-w-fit">Your answer:</span>
            <span className="text-[#0e141b] text-sm">
              {currentQuestion.user_answer || 'Not answered'}
            </span>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-[#4e7397] text-sm font-medium min-w-fit">Correct answer:</span>
            <span className="text-[#0e141b] text-sm">
              {currentQuestion.correct_answer}
            </span>
          </div>
          
          <div className="flex items-start gap-2">
            <span className="text-[#4e7397] text-sm font-medium min-w-fit">Time spent:</span>
            <span className="text-[#0e141b] text-sm">
              {currentQuestion.time_spent}s
            </span>
          </div>
        </div>

        {/* AI Feedback */}
        <div className="px-4 py-3">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-[#0e141b] text-sm font-semibold mb-2 flex items-center gap-2">
              <Bot size={16} className="text-[#197fe5]" />
              Explanation
            </h4>
            <p className="text-[#0e141b] text-sm leading-relaxed">
              {currentQuestion.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation and Bottom */}
      <div>
        {/* Navigation Buttons */}
        <div className="flex justify-stretch">
          <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 text-sm font-bold leading-normal tracking-[0.015em] ${
                currentQuestionIndex === 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#e7edf3] text-[#0e141b] hover:bg-[#d0dbe7]'
              }`}
            >
              <ChevronLeft size={16} className="mr-1" />
              <span className="truncate">Previous</span>
            </button>
            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
              className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 text-sm font-bold leading-normal tracking-[0.015em] ${
                currentQuestionIndex === questions.length - 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#197fe5] text-slate-50 hover:bg-[#1570d4]'
              }`}
            >
              <span className="truncate">Next</span>
              <ChevronRight size={16} className="ml-1" />
            </button>
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
          <Link href="/flashcard" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <Brain size={24} />
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Vocabulary</p>
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
    </div>
  );
}