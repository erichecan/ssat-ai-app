'use client';

import Link from 'next/link';
import { ArrowLeft, User, Mail, Phone, MapPin } from 'lucide-react';

export default function PersonalPage() {
  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      <div>
        <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
          <Link href="/profile" className="text-[#0e141b] flex size-12 shrink-0 items-center">
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Personal Info
          </h2>
        </div>

        <div className="px-4 py-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-[#e7edf3] rounded-full flex items-center justify-center mb-4">
              <User className="text-[#4e7397]" size={40} />
            </div>
            <h3 className="text-[#0e141b] text-xl font-bold">Sophia Chen</h3>
            <p className="text-[#4e7397] text-sm">Student ID: 123456</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-[#d0dbe7]">
              <Mail className="text-[#4e7397]" size={20} />
              <div>
                <p className="text-[#0e141b] font-medium">Email</p>
                <p className="text-[#4e7397] text-sm">sophia.chen@example.com</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-[#d0dbe7]">
              <Phone className="text-[#4e7397]" size={20} />
              <div>
                <p className="text-[#0e141b] font-medium">Phone</p>
                <p className="text-[#4e7397] text-sm">+1 (555) 123-4567</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-[#d0dbe7]">
              <MapPin className="text-[#4e7397]" size={20} />
              <div>
                <p className="text-[#0e141b] font-medium">Location</p>
                <p className="text-[#4e7397] text-sm">New York, NY</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}