// GrammarRuleDisplay Component - 2024-12-19 16:00:00
// Used to display detailed content of grammar rules

import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface Example {
  sentence: string;
  isCorrect: boolean;
  note: string;
}

interface GrammarRule {
  id: string;
  title: string;
  explanation: string;
  examples: Example[];
}

interface GrammarRuleDisplayProps {
  rule: GrammarRule;
}

const GrammarRuleDisplay: React.FC<GrammarRuleDisplayProps> = ({ rule }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
        {rule.title}
      </h2>
      
      {/* Explanation */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Rule Explanation</h3>
        <div className="bg-gray-50 rounded-lg p-4 text-gray-700 leading-relaxed whitespace-pre-line">
          {rule.explanation}
        </div>
      </div>
      
      {/* Examples */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Examples</h3>
        <div className="space-y-4">
          {rule.examples.map((example, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border-l-4 ${
                example.isCorrect 
                  ? 'bg-green-50 border-green-400' 
                  : 'bg-red-50 border-red-400'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {example.isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium mb-2 ${
                    example.isCorrect ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {example.sentence}
                  </p>
                  <p className="text-sm text-gray-600 italic">
                    {example.note}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GrammarRuleDisplay; 