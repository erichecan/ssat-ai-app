'use client';

import Link from 'next/link';
import { ArrowLeft, Users, UserPlus } from 'lucide-react';

export default function FriendsPage() {
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
            Friends
          </h2>
        </div>

        <div className="px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="mx-auto text-[#4e7397] mb-4" size={48} />
              <p className="text-[#0e141b] font-medium mb-2">Connect with Study Partners</p>
              <p className="text-[#4e7397] text-sm mb-4">Add friends to compare progress and study together</p>
              <button className="flex items-center gap-2 bg-[#197fe5] text-white px-4 py-2 rounded-lg">
                <UserPlus size={16} />
                Add Friends
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}