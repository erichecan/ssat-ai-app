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
  topic: string;
  description: string;
  tags: string[];
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

  useEffect(() => {
    loadNewArticle();
  }, []);

  const loadNewArticle = async () => {
    try {
      // First try to get an existing article from database
      const existingResponse = await fetch('/api/writing/articles?limit=10');
      if (existingResponse.ok) {
        const { articles } = await existingResponse.json();
        if (articles && articles.length > 0) {
          const randomIndex = Math.floor(Math.random() * articles.length);
          setCurrentArticle(articles[randomIndex]);
          setUserSummary('');
          setFeedback(null);
          return;
        }
      }

      // If no existing articles, generate a new one
      const response = await fetch('/api/writing/generate-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate article');
      }

      const { article } = await response.json();
      setCurrentArticle(article);
      setUserSummary('');
      setFeedback(null);
    } catch (error) {
      console.error('Error loading article:', error);
      // Fallback to a simple article if generation fails
      setCurrentArticle({
        id: 'fallback-1',
        title: 'The Importance of Education',
        content: 'Education plays a crucial role in personal development and societal progress. Through learning, individuals acquire knowledge, develop critical thinking skills, and prepare for future challenges. Quality education provides opportunities for growth, creativity, and innovation. It helps people understand the world around them and make informed decisions. Education also promotes equality by giving everyone the chance to improve their circumstances through knowledge and skills.',
        topic: 'Education',
        description: 'Education is essential for personal growth and societal advancement through knowledge and skill development.',
        tags: ['education', 'learning', 'development', 'knowledge', 'skills'],
        difficulty: 'medium' as 'easy' | 'medium' | 'hard'
      });
      setUserSummary('');
      setFeedback(null);
    }
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
                Topic: {currentArticle.topic}
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
                  <p className="text-[#0e141b] text-sm italic">{currentArticle.description}</p>
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