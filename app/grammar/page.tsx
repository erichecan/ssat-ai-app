// Grammar Learning Main Page - 2024-12-19 16:00:00
// SSAT Grammar Learning Function Complete Page (AI Dynamic Question Generation)

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import GrammarRuleDisplay from '../../components/grammar/GrammarRuleDisplay';
import PracticeQuestion from '../../components/grammar/PracticeQuestion';
import { grammarRules } from '../data/grammarRules';
import { BookOpen, Target, Trophy, House, Brain, User, Loader2, RefreshCw } from 'lucide-react';

const GrammarPracticePage: React.FC = () => {
  // State management
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Function to generate AI questions
  const generateAIQuestions = async (ruleId: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const selectedRule = grammarRules.find(rule => rule.id === ruleId);
      if (!selectedRule) {
        throw new Error('Grammar rule not found');
      }

      const response = await fetch('/api/ai/grammar-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ruleId: selectedRule.id,
          ruleTitle: selectedRule.title,
          ruleDescription: selectedRule.explanation,
          examples: selectedRule.examples,
          count: 4 // Generate 4 questions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate questions');
      }

      const data = await response.json();
      setCurrentQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setTotalAnswered(0);
    } catch (err) {
      console.error('Error generating questions:', err);
      setError(err instanceof Error ? err.message : 'Error occurred while generating questions');
      setCurrentQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate AI practice questions when grammar rule is selected
  useEffect(() => {
    if (selectedRuleId) {
      generateAIQuestions(selectedRuleId);
    }
  }, [selectedRuleId]);

  // Get currently selected grammar rule
  const selectedRule = grammarRules.find(rule => rule.id === selectedRuleId);

  // Handle answer submission
  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setTotalAnswered(prev => prev + 1);
  };

  // Handle next question
  const handleNext = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions completed, reset state
      setCurrentQuestionIndex(0);
    }
  };

  // Reset practice
  const handleResetPractice = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setTotalAnswered(0);
  };

  // Regenerate questions
  const handleRegenerateQuestions = () => {
    if (selectedRuleId) {
      generateAIQuestions(selectedRuleId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Title */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Grammar Learning</h1>
          </div>
          <p className="mt-2 text-gray-600">Master core grammar rules for SSAT exam (AI Dynamic Question Generation)</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Learning Area */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Grammar Rules
              </h2>
              
              {/* Grammar Rules List */}
              <div className="space-y-3">
                {grammarRules.map((rule) => (
                  <button
                    key={rule.id}
                    onClick={() => setSelectedRuleId(rule.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedRuleId === rule.id
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <h3 className="font-semibold text-lg">{rule.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {rule.examples.length} examples
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Grammar Rule Details */}
            {selectedRule && (
              <GrammarRuleDisplay rule={selectedRule} />
            )}
          </div>

          {/* Right Column - Practice Area */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Practice Area
              </h2>

              {/* Regenerate Button */}
              {selectedRuleId && !isLoading && (
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={handleRegenerateQuestions}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    disabled={isLoading}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate Questions
                  </button>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">AI is generating questions, please wait...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                  <button
                    onClick={handleRegenerateQuestions}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Practice Progress and Score */}
              {selectedRuleId && !isLoading && !error && currentQuestions.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">Progress:</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {currentQuestionIndex + 1} / {currentQuestions.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-600">Score:</span>
                        <span className="text-sm font-semibold text-green-600">
                          {score} / {totalAnswered}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleResetPractice}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Restart
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${currentQuestions.length > 0 ? ((currentQuestionIndex + 1) / currentQuestions.length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Practice Questions */}
              {selectedRuleId && !isLoading && !error && currentQuestions.length > 0 ? (
                <PracticeQuestion
                  question={currentQuestions[currentQuestionIndex]}
                  onAnswerSubmit={handleAnswerSubmit}
                  onNext={handleNext}
                />
              ) : selectedRuleId && !isLoading && !error ? (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No practice questions available for this grammar rule</p>
                </div>
              ) : !selectedRuleId ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Please select a grammar rule to start learning</p>
                </div>
              ) : null}
            </div>

            {/* Practice Completion Notice */}
            {selectedRuleId && currentQuestions.length > 0 && 
             totalAnswered === currentQuestions.length && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Trophy className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">Practice Complete!</h3>
                </div>
                <p className="text-green-700 mb-4">
                  Congratulations on completing the practice for {selectedRule?.title}!
                </p>
                <div className="text-sm text-green-600">
                  <p>Accuracy: {Math.round((score / totalAnswered) * 100)}%</p>
                  <p>Correct: {score} questions, Incorrect: {totalAnswered - score} questions</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleResetPractice}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Practice Again
                  </button>
                  <button
                    onClick={handleRegenerateQuestions}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Generate New Questions
                  </button>
                </div>
              </div>
            )}
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
          <Link href="/grammar" className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full text-[#0e141b]">
            <div className="text-[#0e141b] flex h-8 items-center justify-center">
              <BookOpen size={24} fill="currentColor" />
            </div>
            <p className="text-[#0e141b] text-xs font-medium leading-normal tracking-[0.015em]">Grammar</p>
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
};

export default GrammarPracticePage; 