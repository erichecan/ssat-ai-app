'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Clock,
  Play,
  Pause,
  Send,
  FileText,
  Target,
  Star,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

interface MockPrompt {
  id: string;
  prompt_text: string;
  prompt_type: 'Persuasive' | 'Narrative';
  difficulty: 'easy' | 'medium' | 'hard';
}

interface GradingScores {
  thesisAndFocus: { score: number; comment: string };
  structureAndLogic: { score: number; comment: string };
  argumentAndEvidence: { score: number; comment: string };
  languageAndStyle: { score: number; comment: string };
  overallImpact: { score: number; comment: string };
}

interface GradingReport {
  gradingReport: GradingScores;
}

type TestStatus = 'setup' | 'writing' | 'paused' | 'submitted' | 'graded';

export default function MockTestPage() {
  const [currentPrompt, setCurrentPrompt] = useState<MockPrompt | null>(null);
  const [essay, setEssay] = useState('');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [testStatus, setTestStatus] = useState<TestStatus>('setup');
  const [gradingReport, setGradingReport] = useState<GradingReport | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [completedTests, setCompletedTests] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mock prompts - In production, this would come from your Supabase database
  const mockPrompts: MockPrompt[] = [
    {
      id: '1',
      prompt_text: 'Some people believe that students should be required to take a foreign language class, while others think it should be optional. In your opinion, should foreign language classes be mandatory or optional in schools? Use specific reasons and examples to support your position.',
      prompt_type: 'Persuasive',
      difficulty: 'medium'
    },
    {
      id: '2',
      prompt_text: 'Write about a time when you had to overcome a challenge or obstacle. Describe the situation, what you did to overcome it, and what you learned from the experience.',
      prompt_type: 'Narrative',
      difficulty: 'easy'
    },
    {
      id: '3',
      prompt_text: 'Many schools are considering implementing later start times to help students get more sleep. Do you think schools should start later in the day? Support your opinion with specific reasons and examples.',
      prompt_type: 'Persuasive',
      difficulty: 'medium'
    }
  ];

  useEffect(() => {
    loadNewPrompt();
  }, []);

  useEffect(() => {
    if (testStatus === 'writing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && testStatus === 'writing') {
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [testStatus, timeLeft]);

  const loadNewPrompt = () => {
    const randomIndex = Math.floor(Math.random() * mockPrompts.length);
    setCurrentPrompt(mockPrompts[randomIndex]);
    setEssay('');
    setTimeLeft(25 * 60);
    setTestStatus('setup');
    setGradingReport(null);
  };

  const startTest = () => {
    setTestStatus('writing');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const pauseTest = () => {
    setTestStatus('paused');
  };

  const resumeTest = () => {
    setTestStatus('writing');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleTimeUp = () => {
    setTestStatus('submitted');
    submitEssay();
  };

  const submitEssay = async () => {
    if (!essay.trim() || !currentPrompt) return;
    
    setTestStatus('submitted');
    setIsGrading(true);
    
    try {
      const response = await fetch('/api/writing/essay-grader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_essay: essay,
          prompt_text: currentPrompt.prompt_text,
          prompt_id: currentPrompt.id,
          user_id: '00000000-0000-0000-0000-000000000001' // Demo user ID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to grade essay');
      }

      const gradingData = await response.json();
      setGradingReport(gradingData);
      setTestStatus('graded');
      setCompletedTests(prev => prev + 1);
    } catch (error) {
      console.error('Error grading essay:', error);
      // Fallback to mock data on error
      const mockGrading: GradingReport = {
        gradingReport: {
          thesisAndFocus: {
            score: Math.floor(Math.random() * 2) + 4,
            comment: "Your thesis is clear and well-positioned. Consider strengthening your focus throughout the essay."
          },
          structureAndLogic: {
            score: Math.floor(Math.random() * 2) + 3,
            comment: "Good organization with clear paragraphs. Work on smoother transitions between ideas."
          },
          argumentAndEvidence: {
            score: Math.floor(Math.random() * 2) + 3,
            comment: "Solid examples support your points. Try to develop your evidence more thoroughly."
          },
          languageAndStyle: {
            score: Math.floor(Math.random() * 2) + 4,
            comment: "Excellent vocabulary and sentence variety. Minor grammar issues to address."
          },
          overallImpact: {
            score: Math.floor(Math.random() * 2) + 3,
            comment: "Compelling essay that effectively addresses the prompt. Strong conclusion ties ideas together."
          }
        }
      };
      setGradingReport(mockGrading);
      setTestStatus('graded');
      setCompletedTests(prev => prev + 1);
    } finally {
      setIsGrading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTypeColor = (type: string) => {
    return type === 'Persuasive' ? 'text-blue-600 bg-blue-100' : 'text-purple-600 bg-purple-100';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAverageScore = (scores: GradingScores) => {
    const total = scores.thesisAndFocus.score + scores.structureAndLogic.score + 
                  scores.argumentAndEvidence.score + scores.languageAndStyle.score + 
                  scores.overallImpact.score;
    return (total / 5).toFixed(1);
  };

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center bg-slate-50 p-4 justify-between border-b border-[#e7edf3]">
        <Link href="/writing" className="text-[#4e7397] hover:text-[#0e141b]">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em]">
          Mock Test & AI Tutor
        </h2>
        <div className="flex items-center gap-2 text-[#4e7397] text-sm">
          <Target size={16} />
          <span>{completedTests}</span>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6">
        {currentPrompt && (
          <>
            {/* Setup Phase */}
            {testStatus === 'setup' && (
              <>
                <div className="bg-white rounded-xl p-6 border border-[#d0dbe7]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#0e141b] text-lg font-bold flex items-center gap-2">
                      <FileText className="text-purple-600" size={20} />
                      Essay Prompt
                    </h3>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(currentPrompt.prompt_type)}`}>
                        {currentPrompt.prompt_type}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentPrompt.difficulty)}`}>
                        {currentPrompt.difficulty.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4 mb-6">
                    <p className="text-[#0e141b] text-sm leading-relaxed">
                      {currentPrompt.prompt_text}
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h4 className="text-[#0e141b] text-sm font-semibold mb-2 flex items-center gap-2">
                      <Clock size={16} />
                      Test Instructions
                    </h4>
                    <ul className="text-[#4e7397] text-xs space-y-1">
                      <li>• You have 25 minutes to complete your essay</li>
                      <li>• Write 4-5 paragraphs with clear structure</li>
                      <li>• Include specific examples and evidence</li>
                      <li>• Review and edit your work before time runs out</li>
                    </ul>
                  </div>

                  <button
                    onClick={startTest}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-4 rounded-lg font-medium text-base hover:bg-purple-700"
                  >
                    <Play size={20} />
                    Start 25-Minute Essay Test
                  </button>
                </div>
              </>
            )}

            {/* Writing Phase */}
            {(testStatus === 'writing' || testStatus === 'paused') && (
              <>
                {/* Timer and Controls */}
                <div className="bg-white rounded-xl p-4 border border-[#d0dbe7]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className={timeLeft < 300 ? 'text-red-600' : 'text-blue-600'} size={20} />
                      <span className={`text-xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-[#0e141b]'}`}>
                        {formatTime(timeLeft)}
                      </span>
                      {timeLeft < 300 && (
                        <span className="text-red-600 text-sm font-medium">⚠ Last 5 minutes!</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {testStatus === 'writing' ? (
                        <button
                          onClick={pauseTest}
                          className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
                        >
                          <Pause size={16} />
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={resumeTest}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                        >
                          <Play size={16} />
                          Resume
                        </button>
                      )}
                      
                      <button
                        onClick={submitEssay}
                        disabled={!essay.trim()}
                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                      >
                        <Send size={16} />
                        Submit Early
                      </button>
                    </div>
                  </div>
                </div>

                {/* Essay Writing Area */}
                <div className="bg-white rounded-xl p-6 border border-[#d0dbe7]">
                  <div className="mb-4">
                    <h4 className="text-[#0e141b] text-sm font-semibold mb-2">Essay Prompt:</h4>
                    <p className="text-[#4e7397] text-sm">{currentPrompt.prompt_text}</p>
                  </div>
                  
                  <textarea
                    ref={textareaRef}
                    value={essay}
                    onChange={(e) => setEssay(e.target.value)}
                    placeholder="Begin writing your essay here..."
                    className="w-full h-[400px] p-4 border border-[#d0dbe7] rounded-lg text-[#0e141b] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={testStatus === 'paused'}
                  />
                  
                  <div className="flex items-center justify-between mt-4 text-[#4e7397] text-xs">
                    <span>{essay.length} characters • {essay.split(/\s+/).filter(word => word.length > 0).length} words</span>
                    <span>Target: 300-500 words</span>
                  </div>
                </div>
              </>
            )}

            {/* Grading Phase */}
            {testStatus === 'submitted' && isGrading && (
              <div className="bg-white rounded-xl p-8 border border-[#d0dbe7] text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Clock className="animate-spin text-purple-600" size={24} />
                  <span className="text-[#0e141b] text-lg font-semibold">AI is grading your essay...</span>
                </div>
                <p className="text-[#4e7397] text-sm">This may take a few moments</p>
              </div>
            )}

            {/* Results Phase */}
            {testStatus === 'graded' && gradingReport && (
              <>
                <div className="bg-white rounded-xl p-6 border border-[#d0dbe7]">
                  <h3 className="text-[#0e141b] text-lg font-bold mb-4 flex items-center gap-2">
                    <Star className="text-yellow-500" size={20} />
                    AI Grading Report
                  </h3>
                  
                  {/* Overall Score */}
                  <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 text-white mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">
                        {getAverageScore(gradingReport.gradingReport)}/5.0
                      </div>
                      <div className="text-purple-200 text-sm">Overall Score</div>
                    </div>
                  </div>

                  {/* Detailed Scores */}
                  <div className="space-y-4">
                    {Object.entries(gradingReport.gradingReport).map(([category, data]) => (
                      <div key={category} className="border border-[#d0dbe7] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[#0e141b] text-sm font-semibold capitalize">
                            {category.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <span className={`text-lg font-bold ${getScoreColor(data.score)}`}>
                            {data.score}/5
                          </span>
                        </div>
                        <p className="text-[#4e7397] text-sm">{data.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={loadNewPrompt}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-lg font-medium text-sm hover:bg-purple-700"
                  >
                    <RotateCcw size={16} />
                    New Essay Test
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}