'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy, Target, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

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
  status: string
  current_question_index: number
  score: number
  start_time: string
  end_time: string
}

interface SessionStats {
  totalAnswered: number
  correctCount: number
  accuracy: number
  averageTime: number
}

export default function PracticeResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  const loadResults = async () => {
    try {
      // Get session details
      const sessionResponse = await fetch(`/api/practice/${sessionId}`);
      const sessionResult = await sessionResponse.json();

      if (sessionResponse.ok) {
        setSession(sessionResult.session);
      }

      // Get detailed stats from answers API
      const statsResponse = await fetch(`/api/test/answers?userId=${sessionResult.session?.user_id}&sessionId=practice_${sessionId}`);
      const statsResult = await statsResponse.json();

      if (statsResponse.ok) {
        setStats(statsResult.stats);
      }

    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPractice = () => {
    router.push('/practice');
  };

  const calculateDuration = () => {
    if (!session?.start_time || !session?.end_time) return 'N/A';
    
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  const getPerformanceMessage = () => {
    if (!stats) return '';
    
    const accuracy = stats.accuracy;
    if (accuracy >= 90) return 'Excellent work! 🎉';
    if (accuracy >= 80) return 'Great job! 👏';
    if (accuracy >= 70) return 'Good progress! 👍';
    if (accuracy >= 60) return 'Keep practicing! 💪';
    return 'Don\'t give up! 🌟';
  };

  const getPerformanceColor = () => {
    if (!stats) return 'text-gray-500';
    
    const accuracy = stats.accuracy;
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#197fe5]"></div>
        <p className="text-[#4e7397] text-sm mt-2">Loading results...</p>
      </div>
    );
  }

  if (!session) {
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
          <Link href="/practice" className="text-[#0e141b] flex size-12 shrink-0 items-center">
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Practice Results
          </h2>
        </div>

        {/* Congratulations */}
        <div className="px-4 py-6 text-center">
          <div className="bg-white rounded-2xl p-6 border border-[#d0dbe7] shadow-sm">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-[#0e141b] text-xl font-bold mb-2">
              Practice Complete!
            </h3>
            <p className={`text-lg font-semibold mb-2 ${getPerformanceColor()}`}>
              {getPerformanceMessage()}
            </p>
            <p className="text-[#4e7397] text-sm">
              {session.session_type === 'adaptive' ? 'Adaptive Practice' : 'Custom Practice'} • {session.settings.subjects.join(', ')}
            </p>
          </div>
        </div>

        {/* Results Summary */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-[#d0dbe7] text-center">
              <Target className="w-8 h-8 text-[#197fe5] mx-auto mb-2" />
              <p className="text-[#4e7397] text-xs font-medium mb-1">Score</p>
              <p className="text-[#0e141b] text-2xl font-bold">
                {session.score}/{session.current_question_index}
              </p>
              <p className="text-[#4e7397] text-xs">
                {stats ? `${stats.accuracy}% accuracy` : 'Calculating...'}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-[#d0dbe7] text-center">
              <Clock className="w-8 h-8 text-[#197fe5] mx-auto mb-2" />
              <p className="text-[#4e7397] text-xs font-medium mb-1">Duration</p>
              <p className="text-[#0e141b] text-2xl font-bold">
                {calculateDuration()}
              </p>
              <p className="text-[#4e7397] text-xs">
                {stats ? `${stats.averageTime}s avg` : 'Per question'}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="px-4 py-3">
          <h3 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] mb-3">
            Performance Breakdown
          </h3>
          
          <div className="bg-white rounded-lg p-4 border border-[#d0dbe7] space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[#4e7397] text-sm">Questions Answered</span>
              <span className="text-[#0e141b] font-semibold">{session.current_question_index}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[#4e7397] text-sm">Correct Answers</span>
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <CheckCircle size={16} />
                {session.score}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[#4e7397] text-sm">Incorrect Answers</span>
              <span className="text-red-600 font-semibold flex items-center gap-1">
                <XCircle size={16} />
                {session.current_question_index - session.score}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-[#4e7397] text-sm">Accuracy Rate</span>
              <span className={`font-bold ${getPerformanceColor()}`}>
                {stats ? `${stats.accuracy}%` : 'Calculating...'}
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="px-4 py-3">
          <h3 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] mb-3">
            Recommendations
          </h3>
          
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="space-y-2">
              {stats && stats.accuracy < 70 && (
                <p className="text-[#0e141b] text-sm">
                  • Review the question explanations to understand the concepts better
                </p>
              )}
              {stats && stats.averageTime > 120 && (
                <p className="text-[#0e141b] text-sm">
                  • Practice time management - aim for 90 seconds per question
                </p>
              )}
              <p className="text-[#0e141b] text-sm">
                • Review your mistakes in the Review section for targeted practice
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 space-y-3">
        <button
          onClick={handleRetryPractice}
          className="w-full rounded-lg h-12 px-4 bg-[#197fe5] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#1668c7] flex items-center justify-center gap-2"
        >
          <RotateCcw size={20} />
          Practice Again
        </button>
        
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/review"
            className="flex items-center justify-center h-10 px-4 bg-white text-[#197fe5] border border-[#197fe5] rounded-lg text-sm font-semibold hover:bg-blue-50"
          >
            Review Mistakes
          </Link>
          <Link
            href="/flashcard"
            className="flex items-center justify-center h-10 px-4 bg-white text-[#197fe5] border border-[#197fe5] rounded-lg text-sm font-semibold hover:bg-blue-50"
          >
            Study Flashcards
          </Link>
        </div>
      </div>

      <div className="h-5 bg-slate-50"></div>
    </div>
  );
}