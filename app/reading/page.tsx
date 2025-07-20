'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export default function ReadingPracticePage() {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timeMinutes, setTimeMinutes] = useState(15);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [progress, setProgress] = useState(25);
  const router = useRouter();

  const passages = {
    easy: {
      title: "The Benefits of Reading",
      content: "Reading is one of the most beneficial activities for the human mind. It improves vocabulary, enhances critical thinking skills, and provides knowledge about different topics. Regular reading can also reduce stress and improve concentration. Many successful people credit their achievements to the habit of reading regularly."
    },
    medium: {
      title: "Climate Change and Agriculture",
      content: "The impact of climate change on global agriculture is a growing concern. Rising temperatures, altered precipitation patterns, and increased frequency of extreme weather events pose significant challenges to crop yields and food security. Scientists are exploring various adaptation strategies, including the development of drought-resistant crops and improved irrigation techniques, to mitigate these effects."
    },
    hard: {
      title: "Quantum Computing Fundamentals",
      content: "Quantum computing represents a paradigmatic shift from classical computational models, leveraging quantum mechanical phenomena such as superposition and entanglement to process information. Unlike classical bits that exist in definitive states of 0 or 1, quantum bits (qubits) can exist in multiple states simultaneously, enabling exponentially greater computational possibilities for specific algorithmic problems."
    }
  };

  const currentPassage = passages[difficulty];

  const handleStartReading = () => {
    setIsReading(true);
    // Simulate reading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          router.push('/test');
          return 100;
        }
        return prev + 5;
      });
    }, 1000);
  };

  const handleBack = () => {
    router.back();
  };

  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
          <button onClick={handleBack} className="text-[#0e141b] flex size-12 shrink-0 items-center">
            <X size={24} />
          </button>
          <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Reading Practice
          </h2>
        </div>

        {/* Progress */}
        <div className="flex flex-col gap-3 p-4">
          <div className="flex gap-6 justify-between">
            <p className="text-[#0e141b] text-base font-medium leading-normal">Progress</p>
          </div>
          <div className="rounded bg-[#d0dbe7]">
            <div 
              className="h-2 rounded bg-[#197fe5] transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[#4e7397] text-sm font-normal leading-normal">{progress}% Complete</p>
        </div>

        {/* Difficulty Selection */}
        <h3 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
          Select Difficulty
        </h3>
        <div className="flex px-4 py-3">
          <div className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#e7edf3] p-1">
            <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-slate-50 has-[:checked]:shadow-[0_0_4px_rgba(0,0,0,0.1)] has-[:checked]:text-[#0e141b] text-[#4e7397] text-sm font-medium leading-normal">
              <span className="truncate">Easy</span>
              <input
                type="radio"
                name="difficulty"
                className="invisible w-0"
                value="easy"
                checked={difficulty === 'easy'}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              />
            </label>
            <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-slate-50 has-[:checked]:shadow-[0_0_4px_rgba(0,0,0,0.1)] has-[:checked]:text-[#0e141b] text-[#4e7397] text-sm font-medium leading-normal">
              <span className="truncate">Medium</span>
              <input
                type="radio"
                name="difficulty"
                className="invisible w-0"
                value="medium"
                checked={difficulty === 'medium'}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              />
            </label>
            <label className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 has-[:checked]:bg-slate-50 has-[:checked]:shadow-[0_0_4px_rgba(0,0,0,0.1)] has-[:checked]:text-[#0e141b] text-[#4e7397] text-sm font-medium leading-normal">
              <span className="truncate">Hard</span>
              <input
                type="radio"
                name="difficulty"
                className="invisible w-0"
                value="hard"
                checked={difficulty === 'hard'}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              />
            </label>
          </div>
        </div>

        {/* Timer Display */}
        <div className="flex gap-4 py-6 px-4">
          <div className="flex grow basis-0 flex-col items-stretch gap-4">
            <div className="flex h-14 grow items-center justify-center rounded-lg px-3 bg-[#e7edf3]">
              <p className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em]">
                {timeMinutes.toString().padStart(2, '0')}
              </p>
            </div>
            <div className="flex items-center justify-center">
              <p className="text-[#0e141b] text-sm font-normal leading-normal">Minutes</p>
            </div>
          </div>
          <div className="flex grow basis-0 flex-col items-stretch gap-4">
            <div className="flex h-14 grow items-center justify-center rounded-lg px-3 bg-[#e7edf3]">
              <p className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em]">
                {timeSeconds.toString().padStart(2, '0')}
              </p>
            </div>
            <div className="flex items-center justify-center">
              <p className="text-[#0e141b] text-sm font-normal leading-normal">Seconds</p>
            </div>
          </div>
        </div>

        {/* Reading Instructions */}
        <p className="text-[#0e141b] text-base font-normal leading-normal pb-3 pt-1 px-4">
          Read the following passage carefully and answer the questions that follow. Focus on speed and accuracy.
        </p>

        {/* Reading Passage */}
        <div className="px-4 py-3">
          <h4 className="text-[#0e141b] text-lg font-semibold leading-tight pb-3">
            {currentPassage.title}
          </h4>
          <div className="bg-white rounded-lg p-4 border border-[#d0dbe7]">
            <p className="text-[#0e141b] text-base font-normal leading-relaxed">
              {currentPassage.content}
            </p>
          </div>
        </div>

        {/* Reading Metrics */}
        {isReading && (
          <div className="px-4 py-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 border border-[#d0dbe7] text-center">
                <p className="text-[#4e7397] text-xs font-medium">Words/Min</p>
                <p className="text-[#0e141b] text-lg font-bold">250</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-[#d0dbe7] text-center">
                <p className="text-[#4e7397] text-xs font-medium">Accuracy</p>
                <p className="text-[#0e141b] text-lg font-bold">94%</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-[#d0dbe7] text-center">
                <p className="text-[#4e7397] text-xs font-medium">Time Left</p>
                <p className="text-[#0e141b] text-lg font-bold">{formatTime(timeMinutes, timeSeconds)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Start Button */}
      <div>
        <div className="flex px-4 py-3">
          <button
            onClick={handleStartReading}
            disabled={isReading}
            className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 flex-1 text-sm font-bold leading-normal tracking-[0.015em] ${
              isReading 
                ? 'bg-[#4e7397] text-slate-50 cursor-not-allowed' 
                : 'bg-[#197fe5] text-slate-50 hover:bg-[#1570d4]'
            }`}
          >
            <span className="truncate">
              {isReading ? 'Reading in Progress...' : 'Start Reading'}
            </span>
          </button>
        </div>
        <div className="h-5 bg-slate-50"></div>
      </div>
    </div>
  );
}