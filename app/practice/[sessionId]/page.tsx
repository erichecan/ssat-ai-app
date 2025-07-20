'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { X, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Question {
  id: string
  type: string
  question: string
  options: string[]
  correct_answer: string
  explanation: string
  difficulty: string
  topic: string
  passage?: string
  tags: string[]
  time_limit?: number
}

interface Session {
  id: string
  user_id: string
  session_type: 'adaptive' | 'custom'
  settings: {
    subjects: string[]
    difficulty: string
    question_count: number
    time_limit?: number
  }
  questions: string[]
  status: 'active' | 'completed' | 'paused'
  current_question_index: number
  score: number
  start_time: string
  end_time?: string
}

interface Progress {
  current: number
  total: number
  percentage: number
}

export default function PracticeSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [progress, setProgress] = useState<Progress>({ current: 0, total: 0, percentage: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (currentQuestion?.time_limit) {
      setTimeLeft(currentQuestion.time_limit);
      setStartTime(Date.now());
    }
  }, [currentQuestion]);

  useEffect(() => {
    if (timeLeft && timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      // Time's up - auto submit
      handleSubmitAnswer();
    }
  }, [timeLeft, showResult]);

  const loadSession = async () => {
    try {
      const response = await fetch(`/api/practice/${sessionId}`);
      const result = await response.json();

      if (response.ok) {
        setSession(result.session);
        setCurrentQuestion(result.currentQuestion);
        setProgress(result.progress);
      } else {
        console.error('Error loading session:', result.error);
        router.push('/practice');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      router.push('/practice');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer && timeLeft !== 0) return;
    
    setSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    try {
      const response = await fetch(`/api/practice/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'answer',
          answer: selectedAnswer,
          timeSpent
        })
      });

      const result = await response.json();

      if (response.ok) {
        const correct = selectedAnswer === currentQuestion?.correct_answer;
        setIsCorrect(correct);
        setShowResult(true);
        
        // Update session state
        setSession(result.session);
        setProgress(result.progress);

        // Show result for 2 seconds, then move to next question
        setTimeout(() => {
          if (result.session.status === 'completed') {
            router.push(`/practice/${sessionId}/results`);
          } else if (result.nextQuestion) {
            setCurrentQuestion(result.nextQuestion);
            setSelectedAnswer('');
            setShowResult(false);
            setStartTime(Date.now());
            setTimeLeft(result.nextQuestion.time_limit || null);
          }
        }, 2500);
      } else {
        console.error('Error submitting answer:', result.error);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExitSession = async () => {
    if (confirm('Are you sure you want to exit this practice session? Your progress will be saved.')) {
      try {
        await fetch(`/api/practice/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'pause' })
        });
      } catch (error) {
        console.error('Error pausing session:', error);
      }
      router.push('/practice');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#197fe5]"></div>
        <p className="text-[#4e7397] text-sm mt-2">Loading practice session...</p>
      </div>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-center items-center">
        <p className="text-[#4e7397] text-base">Session not found</p>
        <Link href="/practice" className="text-[#197fe5] mt-2">Return to Practice</Link>
      </div>
    );
  }

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
          <button onClick={handleExitSession} className="text-[#0e141b] flex size-12 shrink-0 items-center">
            <X size={24} />
          </button>
          <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Practice Session
          </h2>
        </div>

        {/* Progress and Timer */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[#0e141b] text-sm font-medium">
              Question {progress.current} of {progress.total}
            </span>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#197fe5] h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
          </div>
          {timeLeft !== null && (
            <div className="flex items-center gap-1">
              <Clock size={16} className="text-[#4e7397]" />
              <span className={`text-sm font-medium ${timeLeft <= 10 ? 'text-red-500' : 'text-[#4e7397]'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>

        {/* Score */}
        <div className="px-4 pb-2">
          <span className="text-[#4e7397] text-sm">Score: {session.score}/{progress.current - 1}</span>
        </div>

        {/* Question */}
        <div className="px-4 py-3">
          <div className="bg-white rounded-lg p-4 border border-[#d0dbe7] mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 bg-[#e7edf3] text-[#4e7397] text-xs font-medium rounded">
                {currentQuestion.type}
              </span>
              <span className="px-2 py-1 bg-[#e7edf3] text-[#4e7397] text-xs font-medium rounded">
                {currentQuestion.difficulty}
              </span>
            </div>
            
            {currentQuestion.passage && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-[#0e141b] text-sm leading-relaxed">{currentQuestion.passage}</p>
              </div>
            )}
            
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
                  showResult && option === currentQuestion.correct_answer
                    ? 'border-green-500 bg-green-50'
                    : ''
                } ${
                  showResult && selectedAnswer === option && option !== currentQuestion.correct_answer
                    ? 'border-red-500 bg-red-50'
                    : ''
                }`}
              >
                <input
                  type="radio"
                  name="answer"
                  value={option}
                  checked={selectedAnswer === option}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  disabled={showResult || submitting}
                  className="h-4 w-4 text-[#197fe5] border-gray-300 focus:ring-[#197fe5]"
                />
                <span className="text-[#0e141b] text-sm leading-normal flex-1">{option}</span>
                
                {showResult && (
                  <div className="flex items-center">
                    {option === currentQuestion.correct_answer ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : selectedAnswer === option ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : null}
                  </div>
                )}
              </label>
            ))}
          </div>

          {/* Result Explanation */}
          {showResult && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-semibold text-sm">
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              <p className="text-[#0e141b] text-sm leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      {!showResult && (
        <div className="p-4">
          <button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer || submitting}
            className={`w-full rounded-lg h-12 px-4 text-sm font-bold leading-normal tracking-[0.015em] ${
              !selectedAnswer || submitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#197fe5] text-white hover:bg-[#1668c7]'
            }`}
          >
            {submitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        </div>
      )}

      <div className="h-5 bg-slate-50"></div>
    </div>
  );
}