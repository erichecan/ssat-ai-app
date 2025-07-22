'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, RefreshCw, Clock } from 'lucide-react';

interface ReadingMaterial {
  title: string
  content: string
  difficulty: string
  wordCount: number
  estimatedReadingTime: number
  source: string
  topic?: string
}

export default function ReadingPracticePage() {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isReading, setIsReading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [readingMaterial, setReadingMaterial] = useState<ReadingMaterial | null>(null);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentWPM, setCurrentWPM] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalReadingTime, setTotalReadingTime] = useState(0);
  const [userId] = useState('demo-user-' + Date.now()); // 演示用户ID
  const router = useRouter();

  // 生成新的阅读材料
  const generateNewMaterial = async () => {
    setLoading(true)
    try {
      console.log('Generating new reading material for difficulty:', difficulty)
      const response = await fetch('/api/reading-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          difficulty, 
          userId,
          useUserContent: true
        })
      })
      
      const data = await response.json()
      if (data.success && data.material) {
        setReadingMaterial(data.material)
        console.log('New reading material generated:', data.material.title)
      } else {
        console.error('Failed to generate material:', data.error)
        // 使用备用材料
        setReadingMaterial(getFallbackMaterial(difficulty))
      }
    } catch (error) {
      console.error('Error generating material:', error)
      setReadingMaterial(getFallbackMaterial(difficulty))
    } finally {
      setLoading(false)
    }
  }
  
  // 备用材料（如果AI生成失败）
  const getFallbackMaterial = (diff: string): ReadingMaterial => {
    const fallbacks = {
      easy: {
        title: "The Power of Daily Habits",
        content: "Small daily habits can create remarkable changes over time. Scientists have discovered that our brains form neural pathways through repetition, making habits automatic. Whether it's reading for ten minutes, exercising, or practicing a skill, consistency matters more than intensity. The key to building good habits is starting small and gradually increasing the challenge. Many successful people attribute their achievements to simple daily practices rather than dramatic efforts.",
        difficulty: 'easy',
        wordCount: 67,
        estimatedReadingTime: 1,
        source: 'fallback',
        topic: 'Personal Development'
      },
      medium: {
        title: "The Science Behind Memory Formation",
        content: "Memory formation involves complex neurological processes that scientists are still working to understand fully. When we experience something new, neurons in our brain create connections called synapses. These connections strengthen through repetition and emotional significance. The hippocampus, a seahorse-shaped region in our brain, plays a crucial role in converting short-term memories into long-term storage. Sleep also contributes significantly to memory consolidation, as the brain processes and organizes information during rest periods. This understanding has revolutionized educational approaches and therapeutic interventions for memory-related disorders.",
        difficulty: 'medium',
        wordCount: 98,
        estimatedReadingTime: 2,
        source: 'fallback',
        topic: 'Neuroscience'
      },
      hard: {
        title: "Quantum Entanglement and Its Implications for Technology",
        content: "Quantum entanglement represents one of the most counterintuitive phenomena in modern physics, where particles become intrinsically connected regardless of the spatial distance separating them. Einstein famously referred to this as 'spooky action at a distance,' expressing his discomfort with the non-local correlations that entanglement implies. Contemporary research has demonstrated that entangled particles instantaneously influence each other's quantum states, a property that defies classical understanding of causality and locality. This phenomenon has profound implications for quantum computing, cryptography, and telecommunications. Researchers are developing quantum networks that leverage entanglement for ultra-secure communication protocols and computational algorithms that could solve problems exponentially faster than classical computers. The theoretical foundations established by pioneers like Bell, Aspect, and Zeilinger have paved the way for practical applications that may fundamentally transform information technology within the next decade.",
        difficulty: 'hard',
        wordCount: 142,
        estimatedReadingTime: 3,
        source: 'fallback',
        topic: 'Quantum Physics'
      }
    }
    return fallbacks[diff as keyof typeof fallbacks] || fallbacks.medium
  }

  const handleStartReading = () => {
    if (!readingMaterial) return
    
    setIsReading(true)
    setStartTime(Date.now())
    setProgress(0)
    
    // 设置总阅读时间（用户可以自己决定何时完成）
    const totalTime = readingMaterial.estimatedReadingTime * 60 // 转换为秒
    setTotalReadingTime(totalTime)
    setTimeRemaining(totalTime)
    
    // 倒计时逻辑
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - (startTime || now)) / 1000)
      const remaining = Math.max(0, totalTime - elapsed)
      setTimeRemaining(remaining)
      
      // 计算阅读进度（基于时间）
      const timeProgress = (elapsed / totalTime) * 100
      setProgress(Math.min(timeProgress, 100))
      
      // 计算当前WPM（假设用户按正常速度阅读）
      if (elapsed > 0) {
        const estimatedWPM = Math.round((readingMaterial.wordCount / totalTime) * 60)
        setCurrentWPM(estimatedWPM)
      }
      
      // 时间到了自动结束（可选）
      if (remaining <= 0) {
        clearInterval(interval)
        // 不自动跳转，让用户决定
      }
    }, 1000)
  }
  
  const handleFinishReading = () => {
    setIsReading(false)
    // 跳转到问题生成页面，传递阅读材料信息
    const readingData = {
      material: readingMaterial,
      timeSpent: totalReadingTime - timeRemaining,
      actualWPM: readingMaterial ? Math.round((readingMaterial.wordCount / ((totalReadingTime - timeRemaining) / 60))) : 0
    }
    
    console.log('Reading completed! Data:', readingData)
    console.log('Redirecting to /reading/questions...')
    
    // 将数据存储到sessionStorage
    sessionStorage.setItem('readingData', JSON.stringify(readingData))
    
    // 确保页面跳转
    setTimeout(() => {
      router.push('/reading/questions')
    }, 500)
  }

  const handleBack = () => {
    router.back();
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  
  // 页面加载时生成第一个阅读材料
  useEffect(() => {
    generateNewMaterial()
  }, [])
  
  // 难度改变时重新生成材料
  useEffect(() => {
    if (readingMaterial) {
      generateNewMaterial()
    }
  }, [difficulty])

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

        {/* Difficulty Selection and Refresh */}
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <h3 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em]">
            Select Difficulty
          </h3>
          <button
            onClick={generateNewMaterial}
            disabled={loading || isReading}
            className="flex items-center gap-2 px-3 py-1 text-sm text-[#197fe5] hover:text-[#1570d4] disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            New Material
          </button>
        </div>
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

        {/* Reading Material Info */}
        {readingMaterial && (
          <div className="px-4 py-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 border border-[#d0dbe7] text-center">
                <p className="text-[#4e7397] text-xs font-medium">Words</p>
                <p className="text-[#0e141b] text-lg font-bold">{readingMaterial.wordCount}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-[#d0dbe7] text-center">
                <p className="text-[#4e7397] text-xs font-medium">Est. Time</p>
                <p className="text-[#0e141b] text-lg font-bold">{readingMaterial.estimatedReadingTime}m</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-[#d0dbe7] text-center">
                <p className="text-[#4e7397] text-xs font-medium">Topic</p>
                <p className="text-[#0e141b] text-sm font-bold truncate">{readingMaterial.topic || readingMaterial.source}</p>
              </div>
            </div>
          </div>
        )}

        {/* Reading Instructions */}
        <p className="text-[#0e141b] text-base font-normal leading-normal pb-3 pt-1 px-4">
          Read the following passage as quickly as possible while maintaining comprehension. Your reading speed will be measured.
        </p>

        {/* Reading Passage */}
        <div className="px-4 py-3">
          {loading ? (
            <div className="bg-white rounded-lg p-6 border border-[#d0dbe7] text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#197fe5] mx-auto mb-2"></div>
              <p className="text-[#4e7397] text-sm">Generating new reading material...</p>
            </div>
          ) : readingMaterial ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[#0e141b] text-lg font-semibold leading-tight">
                  {readingMaterial.title}
                </h4>
                <div className="flex items-center gap-1 text-xs text-[#4e7397] bg-[#e7edf3] px-2 py-1 rounded">
                  <span className="capitalize">{readingMaterial.difficulty}</span>
                </div>
              </div>
              <div className={`bg-white rounded-lg p-4 border border-[#d0dbe7] transition-all duration-300 ${isReading ? 'border-[#197fe5] shadow-lg' : ''}`}>
                <p className="text-[#0e141b] text-base font-normal leading-relaxed whitespace-pre-wrap">
                  {readingMaterial.content}
                </p>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg p-6 border border-[#d0dbe7] text-center">
              <p className="text-[#4e7397]">No reading material available</p>
            </div>
          )}
        </div>

        {/* Reading Metrics */}
        {isReading && readingMaterial && (
          <div className="px-4 py-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 border border-[#d0dbe7] text-center">
                <p className="text-[#4e7397] text-xs font-medium">Current WPM</p>
                <p className="text-[#0e141b] text-lg font-bold">{currentWPM}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-[#d0dbe7] text-center">
                <p className="text-[#4e7397] text-xs font-medium">Progress</p>
                <p className="text-[#0e141b] text-lg font-bold">{Math.round(progress)}%</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-[#d0dbe7] text-center">
                <p className="text-[#4e7397] text-xs font-medium">Time Remaining</p>
                <p className={`text-lg font-bold ${timeRemaining <= 30 ? 'text-red-500' : 'text-[#0e141b]'}`}>{formatTime(timeRemaining)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Start Button */}
      <div>
        <div className="flex px-4 py-3 gap-3">
          <button
            onClick={handleStartReading}
            disabled={isReading || loading || !readingMaterial}
            className={`flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 flex-1 text-sm font-bold leading-normal tracking-[0.015em] ${
              isReading || loading || !readingMaterial
                ? 'bg-[#4e7397] text-slate-50 cursor-not-allowed' 
                : 'bg-[#197fe5] text-slate-50 hover:bg-[#1570d4]'
            }`}
          >
            <span className="truncate">
              {loading ? 'Loading...' : isReading ? 'Reading in Progress...' : 'Start Reading'}
            </span>
          </button>
          {isReading && (
            <button
              onClick={handleFinishReading}
              className="flex items-center justify-center rounded-lg h-10 px-4 text-sm font-bold text-[#197fe5] border border-[#197fe5] hover:bg-[#197fe5] hover:text-white transition-colors"
            >
              Finish
            </button>
          )}
        </div>
        <div className="h-5 bg-slate-50"></div>
      </div>
    </div>
  );
}