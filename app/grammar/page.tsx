// 语法学习主页面 - 2024-12-19 15:30:25
// SSAT语法学习功能的完整页面（AI动态生成题目）

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import GrammarRuleDisplay from '../../components/grammar/GrammarRuleDisplay';
import PracticeQuestion from '../../components/grammar/PracticeQuestion';
import { grammarRules } from '../data/grammarRules';
import { BookOpen, Target, Trophy, House, Brain, User, Loader2, RefreshCw } from 'lucide-react';

const GrammarPracticePage: React.FC = () => {
  // 状态管理
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [currentQuestions, setCurrentQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 生成AI题目的函数
  const generateAIQuestions = async (ruleId: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const selectedRule = grammarRules.find(rule => rule.id === ruleId);
      if (!selectedRule) {
        throw new Error('语法规则未找到');
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
          count: 4 // 生成4道题目
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '生成题目失败');
      }

      const data = await response.json();
      setCurrentQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setTotalAnswered(0);
    } catch (err) {
      console.error('Error generating questions:', err);
      setError(err instanceof Error ? err.message : '生成题目时发生错误');
      setCurrentQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 当选择语法规则时，生成AI练习题
  useEffect(() => {
    if (selectedRuleId) {
      generateAIQuestions(selectedRuleId);
    }
  }, [selectedRuleId]);

  // 获取当前选中的语法规则
  const selectedRule = grammarRules.find(rule => rule.id === selectedRuleId);

  // 处理答案提交
  const handleAnswerSubmit = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setTotalAnswered(prev => prev + 1);
  };

  // 处理下一题
  const handleNext = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // 所有题目完成，重置状态
      setCurrentQuestionIndex(0);
    }
  };

  // 重置练习
  const handleResetPractice = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setTotalAnswered(0);
  };

  // 重新生成题目
  const handleRegenerateQuestions = () => {
    if (selectedRuleId) {
      generateAIQuestions(selectedRuleId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面标题 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">语法学习</h1>
          </div>
          <p className="mt-2 text-gray-600">掌握SSAT考试中的核心语法规则（AI动态生成题目）</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧栏 - 学习区 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                语法规则
              </h2>
              
              {/* 语法规则列表 */}
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
                      {rule.examples.length} 个示例
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 选中的语法规则详情 */}
            {selectedRule && (
              <GrammarRuleDisplay rule={selectedRule} />
            )}
          </div>

          {/* 右侧栏 - 练习区 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                练习区
              </h2>

              {/* 重新生成按钮 */}
              {selectedRuleId && !isLoading && (
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={handleRegenerateQuestions}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    disabled={isLoading}
                  >
                    <RefreshCw className="w-4 h-4" />
                    重新生成题目
                  </button>
                </div>
              )}

              {/* 加载状态 */}
              {isLoading && (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">AI正在生成题目，请稍候...</p>
                </div>
              )}

              {/* 错误状态 */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                  <button
                    onClick={handleRegenerateQuestions}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    重试
                  </button>
                </div>
              )}

              {/* 练习进度和得分 */}
              {selectedRuleId && !isLoading && !error && currentQuestions.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">进度：</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {currentQuestionIndex + 1} / {currentQuestions.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-600">得分：</span>
                        <span className="text-sm font-semibold text-green-600">
                          {score} / {totalAnswered}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleResetPractice}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      重新开始
                    </button>
                  </div>

                  {/* 进度条 */}
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

              {/* 练习题目 */}
              {selectedRuleId && !isLoading && !error && currentQuestions.length > 0 ? (
                <PracticeQuestion
                  question={currentQuestions[currentQuestionIndex]}
                  onAnswerSubmit={handleAnswerSubmit}
                  onNext={handleNext}
                />
              ) : selectedRuleId && !isLoading && !error ? (
                <div className="text-center py-12">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">该语法规则暂无练习题</p>
                </div>
              ) : !selectedRuleId ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">请先选择一个语法规则开始学习</p>
                </div>
              ) : null}
            </div>

            {/* 练习完成提示 */}
            {selectedRuleId && currentQuestions.length > 0 && 
             totalAnswered === currentQuestions.length && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Trophy className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">练习完成！</h3>
                </div>
                <p className="text-green-700 mb-4">
                  恭喜你完成了 {selectedRule?.title} 的练习！
                </p>
                <div className="text-sm text-green-600">
                  <p>正确率：{Math.round((score / totalAnswered) * 100)}%</p>
                  <p>答对：{score} 题，答错：{totalAnswered - score} 题</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleResetPractice}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    重新练习
                  </button>
                  <button
                    onClick={handleRegenerateQuestions}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    生成新题目
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