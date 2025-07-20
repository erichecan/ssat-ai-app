'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, Target, TrendingUp } from 'lucide-react';

export default function StudyPage() {
  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      <div>
        <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
          <Link href="/" className="text-[#0e141b] flex size-12 shrink-0 items-center">
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Study Plan
          </h2>
        </div>

        <div className="px-4 py-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-[#d0dbe7]">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-[#197fe5]" size={20} />
                <span className="text-[#4e7397] text-sm font-medium">Today's Goal</span>
              </div>
              <p className="text-[#0e141b] text-xl font-bold">30 min</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-[#d0dbe7]">
              <div className="flex items-center gap-2 mb-2">
                <Target className="text-[#197fe5]" size={20} />
                <span className="text-[#4e7397] text-sm font-medium">Progress</span>
              </div>
              <p className="text-[#0e141b] text-xl font-bold">65%</p>
            </div>
          </div>

          <h3 className="text-[#0e141b] text-lg font-bold mb-4">Recommended Study Path</h3>
          
          <div className="space-y-3">
            <Link href="/reading" className="block bg-white rounded-lg p-4 border border-[#d0dbe7]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-[#197fe5]" size={24} />
                  <div>
                    <p className="text-[#0e141b] font-medium">Reading Practice</p>
                    <p className="text-[#4e7397] text-sm">Improve comprehension speed</p>
                  </div>
                </div>
                <span className="text-[#197fe5] text-sm">15 min</span>
              </div>
            </Link>

            <Link href="/practice" className="block bg-white rounded-lg p-4 border border-[#d0dbe7]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-[#197fe5]" size={24} />
                  <div>
                    <p className="text-[#0e141b] font-medium">Math Problems</p>
                    <p className="text-[#4e7397] text-sm">Practice algebra concepts</p>
                  </div>
                </div>
                <span className="text-[#197fe5] text-sm">20 min</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}