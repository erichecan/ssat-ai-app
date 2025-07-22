'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  House,
  BookOpen,
  Brain,
  User,
  TrendingUp,
  Target,
  Clock,
  Award,
  RefreshCw
} from 'lucide-react';
import { AuthUser } from '@/lib/auth';
import { MockSessionManager as SessionManager } from '@/lib/mock-auth';

interface ProgressAnalytics {
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  overallAccuracy: number
  averageTimePerQuestion: number
  totalStudyTime: number
  sessionsCompleted: number
  subjectPerformance: {
    [subject: string]: {
      total: number
      correct: number
      accuracy: number
      averageTime: number
    }
  }
  difficultyPerformance: {
    [difficulty: string]: {
      total: number
      correct: number
      accuracy: number
    }
  }
  streakData: {
    currentStreak: number
    longestStreak: number
    lastStudyDate: string
  }
}

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const currentUser = SessionManager.getCurrentUser();
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    setUser(currentUser);
    setLoading(false);
    loadAnalytics(currentUser.id);
  }, [router]);

  const loadAnalytics = async (userId: string) => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch(`/api/analytics?userId=${userId}&timeframe=all`);
      const result = await response.json();

      if (response.ok) {
        setAnalytics(result.analytics);
      } else {
        setError('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Network error');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-center items-center overflow-x-hidden">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#197fe5]"></div>
        <p className="text-[#4e7397] text-sm mt-2">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
          <Link href="/" className="text-[#0e141b] flex size-12 shrink-0 items-center">
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Profile
          </h2>
        </div>

        {/* Profile Section */}
        <div className="flex p-4">
          <div className="flex w-full flex-col gap-4 items-center">
            <div className="flex gap-4 flex-col items-center">
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-32 w-32 bg-gradient-to-br from-[#197fe5] to-[#1668c7] flex items-center justify-center">
                <User size={48} className="text-white" />
              </div>
              <div className="flex flex-col items-center justify-center">
                <p className="text-[#0e141b] text-[22px] font-bold leading-tight tracking-[-0.015em] text-center">
                  {user.full_name || user.username}
                </p>
                <p className="text-[#4e7397] text-base font-normal leading-normal text-center">
                  @{user.username}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <h3 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
          Personal Information
        </h3>
        
        <div className="space-y-0">
          <div className="flex items-center gap-4 bg-slate-50 px-4 min-h-[72px] py-2">
            <div className="text-[#0e141b] flex items-center justify-center rounded-lg bg-[#e7edf3] shrink-0 size-12">
              <Mail size={24} />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-[#0e141b] text-base font-medium leading-normal line-clamp-1">Email</p>
              <p className="text-[#4e7397] text-sm font-normal leading-normal line-clamp-2">
                {user.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 px-4 min-h-[72px] py-2">
            <div className="text-[#0e141b] flex items-center justify-center rounded-lg bg-[#e7edf3] shrink-0 size-12">
              <Phone size={24} />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-[#0e141b] text-base font-medium leading-normal line-clamp-1">Phone</p>
              <p className="text-[#4e7397] text-sm font-normal leading-normal line-clamp-2">
                {user.phone || 'Not provided'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 px-4 min-h-[72px] py-2">
            <div className="text-[#0e141b] flex items-center justify-center rounded-lg bg-[#e7edf3] shrink-0 size-12">
              <MapPin size={24} />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-[#0e141b] text-base font-medium leading-normal line-clamp-1">Location</p>
              <p className="text-[#4e7397] text-sm font-normal leading-normal line-clamp-2">
                {user.location || 'Not provided'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <h3 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
          Progress Summary
        </h3>
        {analyticsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#197fe5]"></div>
          </div>
        ) : error ? (
          <div className="px-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600 text-sm mb-2">{error}</p>
              <button onClick={() => loadAnalytics(user!.id)} className="text-[#197fe5] text-sm flex items-center gap-1 mx-auto">
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 p-4">
            <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 border border-[#d0dbe7] bg-white">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="text-[#197fe5]" size={20} />
                <p className="text-[#0e141b] text-base font-medium leading-normal">Study Time</p>
              </div>
              <p className="text-[#0e141b] tracking-light text-2xl font-bold leading-tight">
                {analytics ? `${analytics.totalStudyTime}m` : '0m'}
              </p>
            </div>
            <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 border border-[#d0dbe7] bg-white">
              <div className="flex items-center gap-2 mb-1">
                <Target className="text-[#197fe5]" size={20} />
                <p className="text-[#0e141b] text-base font-medium leading-normal">Accuracy</p>
              </div>
              <p className="text-[#0e141b] tracking-light text-2xl font-bold leading-tight">
                {analytics ? `${analytics.overallAccuracy}%` : '0%'}
              </p>
            </div>
            <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 border border-[#d0dbe7] bg-white">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="text-[#197fe5]" size={20} />
                <p className="text-[#0e141b] text-base font-medium leading-normal">Questions</p>
              </div>
              <p className="text-[#0e141b] tracking-light text-2xl font-bold leading-tight">
                {analytics ? analytics.totalQuestions : '0'}
              </p>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        <h3 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
          Performance Metrics
        </h3>
        <div className="px-4 py-6">
          <div className="bg-white rounded-lg p-6 border border-[#d0dbe7]">
            {analyticsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#197fe5]"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <p className="text-[#4e7397] text-sm font-medium mb-1">Correct Answers</p>
                  <p className="text-[#0e141b] text-2xl font-bold">{analytics?.correctAnswers || '0'}</p>
                  <p className="text-green-600 text-xs">out of {analytics?.totalQuestions || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-[#4e7397] text-sm font-medium mb-1">Avg. Time</p>
                  <p className="text-[#0e141b] text-2xl font-bold">{analytics?.averageTimePerQuestion || '0'}s</p>
                  <p className="text-blue-600 text-xs">per question</p>
                </div>
                <div className="text-center">
                  <p className="text-[#4e7397] text-sm font-medium mb-1">Current Streak</p>
                  <p className="text-[#0e141b] text-2xl font-bold">{analytics?.streakData.currentStreak || '0'}</p>
                  <p className="text-orange-600 text-xs">days in a row</p>
                </div>
                <div className="text-center">
                  <p className="text-[#4e7397] text-sm font-medium mb-1">Sessions</p>
                  <p className="text-[#0e141b] text-2xl font-bold">{analytics?.sessionsCompleted || '0'}</p>
                  <p className="text-purple-600 text-xs">completed</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subject Performance */}
        {analytics && Object.keys(analytics.subjectPerformance).length > 0 && (
          <>
            <h3 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
              Subject Performance
            </h3>
            <div className="px-4 py-3">
              <div className="bg-white rounded-lg p-4 border border-[#d0dbe7] space-y-4">
                {Object.entries(analytics.subjectPerformance).map(([subject, stats]) => (
                  <div key={subject} className="flex justify-between items-center">
                    <div>
                      <p className="text-[#0e141b] text-sm font-medium capitalize">{subject}</p>
                      <p className="text-[#4e7397] text-xs">{stats.correct}/{stats.total} correct</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#0e141b] text-lg font-bold">{stats.accuracy}%</p>
                      <p className="text-[#4e7397] text-xs">{stats.averageTime}s avg</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* File Management Section */}
        <h3 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
          File Management
        </h3>
        <div className="px-4 py-3">
          <div className="bg-white rounded-lg p-4 border border-[#d0dbe7]">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-[#197fe5] flex items-center justify-center rounded-lg bg-[#e7edf3] shrink-0 size-12">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[#0e141b] text-base font-medium">Upload Study Materials</p>
                <p className="text-[#4e7397] text-sm">Upload PDFs and text files for AI learning</p>
              </div>
            </div>
            <Link 
              href="/upload"
              className="w-full bg-[#197fe5] text-white py-2 px-4 rounded-lg text-center block hover:bg-[#1668c7] transition-colors"
            >
              Manage Files
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 pb-6">
          <div className="grid grid-cols-3 gap-3">
            <Link 
              href="/practice"
              className="bg-white rounded-lg p-4 border border-[#d0dbe7] hover:shadow-md transition-shadow text-center"
            >
              <TrendingUp className="mx-auto text-[#197fe5] mb-2" size={24} />
              <p className="text-[#0e141b] font-medium text-sm">Practice</p>
            </Link>
            
            <Link 
              href="/review"
              className="bg-white rounded-lg p-4 border border-[#d0dbe7] hover:shadow-md transition-shadow text-center"
            >
              <Award className="mx-auto text-[#197fe5] mb-2" size={24} />
              <p className="text-[#0e141b] font-medium text-sm">Review</p>
            </Link>
            
            <Link 
              href="/settings"
              className="bg-white rounded-lg p-4 border border-[#d0dbe7] hover:shadow-md transition-shadow text-center"
            >
              <div className="mx-auto text-[#197fe5] mb-2">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8,8,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8,8,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z" />
                </svg>
              </div>
              <p className="text-[#0e141b] font-medium text-sm">Settings</p>
            </Link>
          </div>
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
          <Link href="/review" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="m21 21-4.34-4.34"></path>
                <circle cx="11" cy="11" r="8"></circle>
              </svg>
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Review</p>
          </Link>
          <Link href="/profile" className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full text-[#0e141b]">
            <div className="text-[#0e141b] flex h-8 items-center justify-center">
              <User size={24} fill="currentColor" />
            </div>
            <p className="text-[#0e141b] text-xs font-medium leading-normal tracking-[0.015em]">Profile</p>
          </Link>
        </div>
        <div className="h-5 bg-slate-50"></div>
      </div>
    </div>
  );
}