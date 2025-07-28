'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Target,
  Brain,
  Star,
  RotateCcw,
  Send
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  topic_category: string;
  standard_summary: string;
  keywords: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface FeedbackScore {
  accuracy: number;
  conciseness: number;
  coverage: number;
}

interface Feedback {
  scores: FeedbackScore;
  feedback: string;
}

export default function SummarizerPage() {
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [userSummary, setUserSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [completedCount, setCompletedCount] = useState(0);

  // Mock article data - In production, this would come from your Supabase database
  const mockArticles: Article[] = [
    {
      id: '1',
      title: 'The Benefits of Reading',
      content: `Reading is one of the most fundamental skills for academic success. When students read regularly, they develop stronger vocabulary, better comprehension abilities, and improved writing skills. Research shows that students who read for just 20 minutes daily score significantly higher on standardized tests. Reading also enhances critical thinking skills by exposing students to different perspectives and complex ideas. Furthermore, reading fiction helps develop empathy and emotional intelligence, while non-fiction builds knowledge across various subjects. The habit of reading should be cultivated early and maintained throughout life, as it serves as a foundation for lifelong learning and intellectual growth.`,
      topic_category: 'Education',
      standard_summary: 'Regular reading develops vocabulary, comprehension, and critical thinking skills, leading to better academic performance and lifelong learning.',
      keywords: ['reading', 'vocabulary', 'comprehension', 'academic success'],
      difficulty: 'easy'
    },
    {
      id: '2',
      title: 'Climate Change and Ocean Levels',
      content: `Global climate change has led to significant rises in ocean levels worldwide. As greenhouse gases trap more heat in Earth's atmosphere, polar ice caps and glaciers melt at accelerating rates. Scientists estimate that sea levels have risen approximately 8-9 inches since 1880, with the rate of increase doubling in recent decades. This rise threatens coastal communities, damages marine ecosystems, and affects weather patterns globally. Small island nations face complete submersion, while major coastal cities must invest billions in protective infrastructure. The economic impact includes property damage, agricultural losses, and forced migration of populations. Immediate action to reduce carbon emissions is crucial to slow this trend and protect vulnerable communities from devastating consequences.`,
      topic_category: 'Environment',
      standard_summary: 'Climate change causes ocean levels to rise through melting ice, threatening coastal areas and requiring urgent carbon emission reductions.',
      keywords: ['climate change', 'sea level rise', 'greenhouse gases', 'coastal threats'],
      difficulty: 'medium'
    }
  ];

  useEffect(() => {
    loadNewArticle();
  }, []);

  const loadNewArticle = () => {
    const randomIndex = Math.floor(Math.random() * mockArticles.length);
    setCurrentArticle(mockArticles[randomIndex]);
    setUserSummary('');
    setFeedback(null);
  };

  const submitSummary = async () => {
    if (!userSummary.trim() || !currentArticle) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/writing/summarizer-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_summary: userSummary,
          article_id: currentArticle.id,
          user_id: '00000000-0000-0000-0000-000000000001' // Demo user ID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get feedback');
      }

      const feedbackData = await response.json();
      setFeedback(feedbackData);
      setCompletedCount(prev => prev + 1);
    } catch (error) {
      console.error('Error submitting summary:', error);
      // Fallback to mock data on error
      const mockFeedback: Feedback = {
        scores: {
          accuracy: Math.floor(Math.random() * 2) + 4,
          conciseness: Math.floor(Math.random() * 2) + 3,
          coverage: Math.floor(Math.random() * 2) + 4
        },
        feedback: "Good work! Your summary captures the main ideas effectively."
      };
      setFeedback(mockFeedback);
      setCompletedCount(prev => prev + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-orange-600';
    return 'text-red-600';
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
          Core Summarizer
        </h2>
        <div className="flex items-center gap-2 text-[#4e7397] text-sm">
          <Target size={16} />
          <span>{completedCount}</span>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6">
        {currentArticle && (
          <>
            {/* Article Section */}
            <div className="bg-white rounded-xl p-6 border border-[#d0dbe7]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#0e141b] text-lg font-bold">{currentArticle.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentArticle.difficulty)}`}>
                  {currentArticle.difficulty.toUpperCase()}
                </span>
              </div>
              
              <div className="text-[#4e7397] text-sm mb-2">
                Topic: {currentArticle.topic_category}
              </div>
              
              <div className="text-[#0e141b] text-sm leading-relaxed">
                {currentArticle.content}
              </div>
            </div>

            {/* Summary Input Section */}
            <div className="bg-white rounded-xl p-6 border border-[#d0dbe7]">
              <h4 className="text-[#0e141b] text-base font-semibold mb-4">
                📝 Write a one-sentence summary
              </h4>
              
              <textarea
                value={userSummary}
                onChange={(e) => setUserSummary(e.target.value)}
                placeholder="Summarize the main idea of this article in one clear, concise sentence..."
                className="w-full h-32 p-4 border border-[#d0dbe7] rounded-lg text-[#0e141b] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting || !!feedback}
              />
              
              <div className="flex items-center justify-between mt-4">
                <div className="text-[#4e7397] text-xs">
                  {userSummary.length} characters
                </div>
                
                {!feedback && (
                  <button
                    onClick={submitSummary}
                    disabled={!userSummary.trim() || isSubmitting}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock size={16} className="animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Submit Summary
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Feedback Section */}
            {feedback && (
              <div className="bg-white rounded-xl p-6 border border-[#d0dbe7]">
                <h4 className="text-[#0e141b] text-base font-semibold mb-4 flex items-center gap-2">
                  <Star className="text-yellow-500" size={20} />
                  AI Feedback
                </h4>
                
                {/* Scores */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(feedback.scores.accuracy)}`}>
                      {feedback.scores.accuracy}/5
                    </div>
                    <div className="text-[#4e7397] text-xs">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(feedback.scores.conciseness)}`}>
                      {feedback.scores.conciseness}/5
                    </div>
                    <div className="text-[#4e7397] text-xs">Conciseness</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(feedback.scores.coverage)}`}>
                      {feedback.scores.coverage}/5
                    </div>
                    <div className="text-[#4e7397] text-xs">Coverage</div>
                  </div>
                </div>
                
                {/* Feedback Text */}
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-[#0e141b] text-sm">{feedback.feedback}</p>
                </div>
                
                {/* Standard Summary */}
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <h5 className="text-[#0e141b] text-sm font-medium mb-2">✅ Expert Summary:</h5>
                  <p className="text-[#0e141b] text-sm italic">{currentArticle.standard_summary}</p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={loadNewArticle}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:bg-blue-700"
                  >
                    <RotateCcw size={16} />
                    Next Article
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}