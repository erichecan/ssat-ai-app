// PracticeQuestion Component - 2024-12-19 16:00:00
// Used to display and interact with grammar practice questions

import React, { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface PracticeQuestionProps {
  question: {
    id: string;
    ruleId: string;
    type: 'multiple-choice' | 'fill-in-the-blank';
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  };
  onAnswerSubmit: (isCorrect: boolean) => void;
  onNext: () => void;
}

const PracticeQuestion: React.FC<PracticeQuestionProps> = ({ 
  question, 
  onAnswerSubmit, 
  onNext 
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    
    const isCorrect = selectedAnswer === question.answer;
    setIsSubmitted(true);
    setShowExplanation(true);
    onAnswerSubmit(isCorrect);
  };

  const handleNext = () => {
    setSelectedAnswer('');
    setIsSubmitted(false);
    setShowExplanation(false);
    onNext();
  };

  const isCorrect = selectedAnswer === question.answer;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {/* Question Type Indicator */}
      <div className="mb-4">
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
          question.type === 'multiple-choice' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-purple-100 text-purple-800'
        }`}>
          {question.type === 'multiple-choice' ? 'Multiple Choice' : 'Fill in the Blank'}
        </span>
      </div>

      {/* Question Stem */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Question</h3>
        <p className="text-gray-700 leading-relaxed">
          {question.question}
        </p>
      </div>

      {/* Options */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-700 mb-3">Options</h4>
        {question.type === 'multiple-choice' ? (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !isSubmitted && setSelectedAnswer(option)}
                disabled={isSubmitted}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === option
                    ? isSubmitted
                      ? isCorrect
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedAnswer === option
                      ? isSubmitted
                        ? isCorrect
                          ? 'border-green-500 bg-green-500'
                          : 'border-red-500 bg-red-500'
                        : 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedAnswer === option && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="text-gray-700">{option}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !isSubmitted && setSelectedAnswer(option)}
                disabled={isSubmitted}
                className={`inline-block px-4 py-2 rounded-lg border-2 transition-all mr-3 mb-2 ${
                  selectedAnswer === option
                    ? isSubmitted
                      ? isCorrect
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-red-500 bg-red-50 text-red-800'
                      : 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                } ${isSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      {!isSubmitted && (
        <button
          onClick={handleSubmit}
          disabled={!selectedAnswer}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Submit Answer
        </button>
      )}

      {/* Result Feedback */}
      {isSubmitted && (
        <div className="mb-6">
          <div className={`p-4 rounded-lg border-l-4 ${
            isCorrect ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {isCorrect ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <span className={`font-semibold ${
                isCorrect ? 'text-green-800' : 'text-red-800'
              }`}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            {!isCorrect && (
              <p className="text-gray-700 mb-2">
                Correct Answer: <span className="font-semibold text-green-700">{question.answer}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Explanation */}
      {showExplanation && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-700 mb-3">Explanation</h4>
          <div className="bg-gray-50 rounded-lg p-4 text-gray-700 leading-relaxed">
            {question.explanation}
          </div>
        </div>
      )}

      {/* Next Question Button */}
      {isSubmitted && (
        <button
          onClick={handleNext}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          Next Question
          <ArrowRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default PracticeQuestion; 