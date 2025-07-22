'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Settings, 
  House, 
  BookOpen, 
  User,
  Clock,
  Brain
} from 'lucide-react';

export default function HomePage() {
  const [overallProgress] = useState(65);

  const recommendedCards = [
    {
      title: 'Reading Speed Boost',
      description: 'Improve reading speed',
      link: '/reading',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=300&fit=crop&crop=center'
    },
    {
      title: 'Vocabulary Builder',
      description: 'Expand your vocabulary',
      link: '/flashcard',
      image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=300&h=300&fit=crop&crop=center'
    },
    {
      title: 'Practice Test 1',
      description: 'Full-length practice test',
      link: '/test',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=300&fit=crop&crop=center'
    }
  ];


  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
          <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pl-12">
            Home
          </h2>
          <div className="flex w-12 items-center justify-end">
            <Link 
              href="/settings"
              className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-transparent text-[#0e141b] gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0"
            >
              <Settings size={24} />
            </Link>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="flex flex-col gap-3 p-4">
          <div className="flex gap-6 justify-between">
            <p className="text-[#0e141b] text-base font-medium leading-normal">Overall Progress</p>
          </div>
          <div className="rounded bg-[#d0dbe7]">
            <div 
              className="h-2 rounded bg-[#197fe5] transition-all duration-300" 
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-[#4e7397] text-sm font-normal leading-normal">{overallProgress}% Complete</p>
        </div>

        {/* Recommended for You */}
        <h2 className="text-[#0e141b] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
          Recommended for You
        </h2>
        <div className="flex overflow-x-auto overflow-y-hidden [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-stretch p-4 gap-3">
            {recommendedCards.map((card, index) => (
              <Link 
                key={index}
                href={card.link}
                className="flex h-full flex-1 flex-col gap-4 rounded-lg min-w-40 hover:scale-105 transition-transform duration-200"
              >
                <div
                  className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg flex flex-col"
                  style={{ backgroundImage: `url("${card.image}")` }}
                />
                <div>
                  <p className="text-[#0e141b] text-base font-medium leading-normal">{card.title}</p>
                  <p className="text-[#4e7397] text-sm font-normal leading-normal">{card.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>


        {/* Quick Actions */}
        <div className="px-4 py-6">
          <div className="grid grid-cols-2 gap-3">
            <Link 
              href="/practice"
              className="bg-white rounded-lg p-3 border border-[#d0dbe7] hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-[#197fe5]" size={18} />
                <span className="text-[#0e141b] font-medium text-sm">Practice</span>
              </div>
              <p className="text-[#4e7397] text-xs">15-min session</p>
            </Link>

            <Link 
              href="/profile"
              className="bg-white rounded-lg p-3 border border-[#d0dbe7] hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <User className="text-[#197fe5]" size={18} />
                <span className="text-[#0e141b] font-medium text-sm">Profile</span>
              </div>
              <p className="text-[#4e7397] text-xs">Settings & Files</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div>
        <div className="flex gap-2 border-t border-[#e7edf3] bg-slate-50 px-4 pb-3 pt-2">
          <Link href="/" className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full text-[#0e141b]">
            <div className="text-[#0e141b] flex h-8 items-center justify-center">
              <House size={24} fill="currentColor" />
            </div>
            <p className="text-[#0e141b] text-xs font-medium leading-normal tracking-[0.015em]">Home</p>
          </Link>
          <Link href="/practice" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <BookOpen size={24} />
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Practice</p>
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