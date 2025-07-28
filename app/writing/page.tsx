'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  House, 
  BookOpen, 
  User,
  PenTool,
  FileText,
  Brain,
  Target,
  Clock,
  TrendingUp
} from 'lucide-react';

export default function WritingPage() {
  const [userStats] = useState({
    completedSummaries: 12,
    logicPuzzlesSolved: 8,
    essaysWritten: 5,
    averageScore: 3.8
  });

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
          <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            SSAT Writing Practice
          </h2>
        </div>

        {/* Writing Overview */}
        <div className="px-4 py-6">
          <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-pink-800 rounded-xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">Master SSAT Writing</h3>
            <p className="text-purple-100 text-sm mb-4">
              Train like a champion writer through structured practice modules designed to boost your SSAT writing score.
            </p>
            <div className="flex items-center gap-2 text-purple-100 text-xs">
              <PenTool size={16} />
              <span>AI-powered feedback and personalized improvement plans</span>
            </div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="px-4 py-2">
          <h3 className="text-[#0e141b] text-lg font-bold mb-4">Your Progress</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 border border-[#d0dbe7]">
              <div className="flex items-center gap-2 mb-2">
                <Target className="text-green-600" size={20} />
                <span className="text-[#0e141b] text-sm font-semibold">Summaries</span>
              </div>
              <div className="text-[#0e141b] text-xl font-bold">{userStats.completedSummaries}</div>
              <div className="text-[#4e7397] text-xs">Completed</div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-[#d0dbe7]">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="text-blue-600" size={20} />
                <span className="text-[#0e141b] text-sm font-semibold">Logic</span>
              </div>
              <div className="text-[#0e141b] text-xl font-bold">{userStats.logicPuzzlesSolved}</div>
              <div className="text-[#4e7397] text-xs">Puzzles Solved</div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-[#d0dbe7]">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="text-purple-600" size={20} />
                <span className="text-[#0e141b] text-sm font-semibold">Essays</span>
              </div>
              <div className="text-[#0e141b] text-xl font-bold">{userStats.essaysWritten}</div>
              <div className="text-[#4e7397] text-xs">Written</div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-[#d0dbe7]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-orange-600" size={20} />
                <span className="text-[#0e141b] text-sm font-semibold">Avg Score</span>
              </div>
              <div className="text-[#0e141b] text-xl font-bold">{userStats.averageScore}/5</div>
              <div className="text-[#4e7397] text-xs">Overall</div>
            </div>
          </div>
        </div>

        {/* Writing Modules */}
        <div className="px-4 py-2">
          <h3 className="text-[#0e141b] text-lg font-bold mb-4">Practice Modules</h3>
          <div className="space-y-4">
            <Link 
              href="/writing/summarizer"
              className="block bg-white rounded-xl p-4 border border-[#d0dbe7] hover:shadow-lg transition-all duration-200 hover:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Target size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[#0e141b] font-semibold text-base">Core Summarizer</h4>
                  <p className="text-[#4e7397] text-sm">Practice distilling key ideas into clear, concise summaries</p>
                </div>
                <div className="text-[#4e7397] text-xs">
                  <div>Level 1-3</div>
                </div>
              </div>
            </Link>

            <Link 
              href="/writing/logic-builder"
              className="block bg-white rounded-xl p-4 border border-[#d0dbe7] hover:shadow-lg transition-all duration-200 hover:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Brain size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[#0e141b] font-semibold text-base">Logic Builder</h4>
                  <p className="text-[#4e7397] text-sm">Build strong argument chains through drag-and-drop exercises</p>
                </div>
                <div className="text-[#4e7397] text-xs">
                  <div>Interactive</div>
                </div>
              </div>
            </Link>

            <Link 
              href="/writing/mock-test"
              className="block bg-white rounded-xl p-4 border border-[#d0dbe7] hover:shadow-lg transition-all duration-200 hover:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <FileText size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[#0e141b] font-semibold text-base">Mock Test & AI Tutor</h4>
                  <p className="text-[#4e7397] text-sm">Full timed essays with comprehensive AI feedback</p>
                </div>
                <div className="text-[#4e7397] text-xs flex items-center gap-1">
                  <Clock size={12} />
                  <span>25 min</span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="px-4 py-6">
          <div className="bg-white rounded-xl p-4 border border-[#d0dbe7]">
            <h4 className="text-[#0e141b] font-semibold text-base mb-3">💡 Writing Tips</h4>
            <div className="space-y-2 text-sm text-[#4e7397]">
              <p>• Start with the Summarizer to build core comprehension skills</p>
              <p>• Practice Logic Builder daily to strengthen argument structure</p>
              <p>• Use Mock Tests weekly to track improvement and build stamina</p>
            </div>
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
          <Link href="/writing" className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full text-[#0e141b]">
            <div className="text-[#0e141b] flex h-8 items-center justify-center">
              <PenTool size={24} fill="currentColor" />
            </div>
            <p className="text-[#0e141b] text-xs font-medium leading-normal tracking-[0.015em]">Writing</p>
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