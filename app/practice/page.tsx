'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, House, Brain, User } from 'lucide-react';
import { MockSessionManager as SessionManager } from '@/lib/mock-auth';

export default function PracticePage() {
  const [practiceType, setPracticeType] = useState<'adaptive' | 'custom'>('adaptive');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Reading Comprehension']);
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(20);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // 确保有demo用户
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser) {
        console.log('No user found on page load, setting demo user...');
        SessionManager.setDemoUser();
      }
    }
  }, []);

  const handleSubjectChange = (subject: string, checked: boolean) => {
    if (checked) {
      setSelectedSubjects([...selectedSubjects, subject]);
    } else {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
    }
  };

  // 当切换到Custom模式时，确保至少有一个科目被选中 - 更新于 2024-01-21 02:30:00
  const handlePracticeTypeChange = (type: 'adaptive' | 'custom') => {
    setPracticeType(type);
    if (type === 'custom' && selectedSubjects.length === 0) {
      setSelectedSubjects(['Reading Comprehension']);
    }
  };

  const handleStartPractice = async () => {
    setIsCreating(true);
    setError('');

    try {
      const currentUser = SessionManager.getCurrentUser();
      console.log('Current user:', currentUser);
      
      if (!currentUser) {
        console.log('No user found, setting demo user...');
        SessionManager.setDemoUser();
        const demoUser = SessionManager.getCurrentUser();
        console.log('Demo user set:', demoUser);
        
        if (!demoUser) {
          setError('Failed to initialize user session');
          setIsCreating(false);
          return;
        }
      }

      const user = SessionManager.getCurrentUser()!;
      const sessionData = {
        userId: user.id,
        sessionType: practiceType,
        subjects: practiceType === 'custom' ? selectedSubjects : ['all'],
        difficulty: practiceType === 'custom' ? difficulty : 'adaptive',
        questionCount: practiceType === 'custom' ? questionCount : 10,
        timeLimit: practiceType === 'custom' ? questionCount * 90 : undefined // 90 seconds per question
      };

      console.log('Creating session with data:', sessionData);

      const response = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok && result.success && result.session) {
        console.log('Redirecting to session:', result.session.id);
        // Use replace instead of push to prevent back button issues
        router.replace(`/practice/${result.session.id}`);
      } else {
        const errorMessage = result.error || 'Failed to create practice session'
        setError(errorMessage);
        console.error('Session creation failed:', result);
        console.error('Error details:', errorMessage);
        
        // 显示更详细的错误信息
        alert(`Practice session creation failed: ${errorMessage}. Please check the console for more details.`);
      }
    } catch (error) {
      console.error('Error creating practice session:', error);
      setError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

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
            Practice
          </h2>
        </div>

        {/* Practice Type Selection */}
        <h3 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
          Choose your practice
        </h3>
        <div className="flex px-4 py-3">
          <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#e7edf3] p-1">
            <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-slate-50 has-[:checked]:shadow-[0_0_4px_rgba(0,0,0,0.1)] has-[:checked]:text-[#0e141b] text-[#4e7397] text-sm font-medium leading-normal">
              <span className="truncate">Adaptive</span>
              <input
                type="radio"
                name="practiceType"
                className="invisible w-0"
                value="adaptive"
                checked={practiceType === 'adaptive'}
                onChange={(e) => handlePracticeTypeChange(e.target.value as 'adaptive' | 'custom')}
              />
            </label>
            <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-slate-50 has-[:checked]:shadow-[0_0_4px_rgba(0,0,0,0.1)] has-[:checked]:text-[#0e141b] text-[#4e7397] text-sm font-medium leading-normal">
              <span className="truncate">Custom</span>
              <input
                type="radio"
                name="practiceType"
                className="invisible w-0"
                value="custom"
                checked={practiceType === 'custom'}
                onChange={(e) => handlePracticeTypeChange(e.target.value as 'adaptive' | 'custom')}
              />
            </label>
          </div>
        </div>

        {/* Practice Content */}
        {/* Error Message */}
        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {practiceType === 'adaptive' ? (
          <>
            <h3 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
              Adaptive Practice
            </h3>
            <p className="text-[#0e141b] text-base font-normal leading-normal pb-3 pt-1 px-4">
              Based on your current level, we'll generate questions to help you improve your reading speed and question familiarity.
            </p>
            <div className="flex px-4 py-3 justify-end">
              <button
                onClick={handleStartPractice}
                disabled={isCreating}
                className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 text-sm font-bold leading-normal tracking-[0.015em] ${
                  isCreating 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-[#197fe5] text-slate-50 hover:bg-[#1668c7]'
                }`}
              >
                <span className="truncate">
                  {isCreating ? 'Creating...' : 'Start Practice'}
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
              Custom Practice
            </h3>
            <p className="text-[#0e141b] text-base font-normal leading-normal pb-3 pt-1 px-4">
              Choose specific topics and difficulty levels for your practice session. Customize your learning experience.
            </p>

            {/* Subject Selection */}
            <div className="px-4 py-3">
              <h4 className="text-[#0e141b] text-base font-medium leading-normal pb-2">Subject Areas</h4>
              <div className="grid grid-cols-2 gap-3">
                {['Reading Comprehension', 'Math', 'Vocabulary', 'Essay Writing'].map((subject) => (
                  <label key={subject} className="flex items-center p-3 rounded-lg border border-[#d0dbe7] cursor-pointer hover:bg-[#e7edf3]">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={selectedSubjects.includes(subject)}
                      onChange={(e) => handleSubjectChange(subject, e.target.checked)}
                    />
                    <span className="text-[#0e141b] text-sm">{subject}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="px-4 py-3">
              <h4 className="text-[#0e141b] text-base font-medium leading-normal pb-2">Difficulty Level</h4>
              <div className="flex h-10 items-center justify-center rounded-lg bg-[#e7edf3] p-1">
                {['easy', 'medium', 'hard'].map((level) => (
                  <label key={level} className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-slate-50 has-[:checked]:shadow-[0_0_4px_rgba(0,0,0,0.1)] has-[:checked]:text-[#0e141b] text-[#4e7397] text-sm font-medium leading-normal">
                    <span className="truncate">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                    <input 
                      type="radio" 
                      name="difficulty" 
                      className="invisible w-0" 
                      value={level}
                      checked={difficulty === level}
                      onChange={(e) => setDifficulty(e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Number of Questions */}
            <div className="px-4 py-3">
              <h4 className="text-[#0e141b] text-base font-medium leading-normal pb-2">Number of Questions</h4>
              <select 
                className="w-full p-3 rounded-lg border border-[#d0dbe7] bg-white text-[#0e141b]"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              >
                <option value="10">10 Questions</option>
                <option value="20">20 Questions</option>
                <option value="30">30 Questions</option>
                <option value="50">50 Questions</option>
              </select>
            </div>

            <div className="flex px-4 py-3 justify-end">
              <button
                onClick={handleStartPractice}
                disabled={isCreating || selectedSubjects.length === 0}
                className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 text-sm font-bold leading-normal tracking-[0.015em] ${
                  isCreating || selectedSubjects.length === 0
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-[#197fe5] text-slate-50 hover:bg-[#1668c7]'
                }`}
              >
                <span className="truncate">
                  {isCreating ? 'Creating...' : 'Start Custom Practice'}
                </span>
              </button>
            </div>
          </>
        )}
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
          <Link href="/practice" className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full text-[#0e141b]">
            <div className="text-[#0e141b] flex h-8 items-center justify-center">
              <BookOpen size={24} fill="currentColor" />
            </div>
            <p className="text-[#0e141b] text-xs font-medium leading-normal tracking-[0.015em]">Practice</p>
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
  );
}