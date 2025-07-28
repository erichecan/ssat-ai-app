'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Brain,
  CheckCircle,
  XCircle,
  RotateCcw,
  Lightbulb,
  GripVertical,
  Target
} from 'lucide-react';

interface LogicElement {
  id: string;
  text: string;
  order: number;
}

interface LogicPuzzle {
  id: string;
  main_thesis: string;
  elements: {
    shuffled: LogicElement[];
    correct_order: number[];
  };
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function LogicBuilderPage() {
  const [currentPuzzle, setCurrentPuzzle] = useState<LogicPuzzle | null>(null);
  const [userOrder, setUserOrder] = useState<LogicElement[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [draggedItem, setDraggedItem] = useState<LogicElement | null>(null);

  useEffect(() => {
    loadNewPuzzle();
  }, []);

  const loadNewPuzzle = async () => {
    try {
      // First try to get an existing puzzle from database
      const existingResponse = await fetch('/api/writing/logic-puzzles?limit=10');
      if (existingResponse.ok) {
        const { puzzles } = await existingResponse.json();
        if (puzzles && puzzles.length > 0) {
          const randomIndex = Math.floor(Math.random() * puzzles.length);
          const puzzle = puzzles[randomIndex];
          
          // Shuffle the elements for display
          const shuffled = [...puzzle.elements.shuffled].sort(() => Math.random() - 0.5);
          
          setCurrentPuzzle({ ...puzzle, elements: { ...puzzle.elements, shuffled } });
          setUserOrder([]);
          setIsComplete(false);
          setIsCorrect(null);
          return;
        }
      }

      // If no existing puzzles, generate a new one
      const response = await fetch('/api/writing/generate-logic-puzzle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate logic puzzle');
      }

      const { puzzle } = await response.json();
      
      // Shuffle the elements for display
      const shuffled = [...puzzle.elements.shuffled].sort(() => Math.random() - 0.5);
      
      setCurrentPuzzle({ ...puzzle, elements: { ...puzzle.elements, shuffled } });
      setUserOrder([]);
      setIsComplete(false);
      setIsCorrect(null);
    } catch (error) {
      console.error('Error loading puzzle:', error);
      // Fallback to a simple puzzle if generation fails
      const fallbackPuzzle = {
        id: 'fallback-1',
        main_thesis: 'Students should participate in extracurricular activities',
        elements: {
          shuffled: [
            { id: '1', text: 'Extracurricular activities help students develop leadership skills', order: 2 },
            { id: '2', text: 'These skills are valuable for college applications and future careers', order: 3 },
            { id: '3', text: 'Student participation in activities beyond academics is beneficial', order: 1 },
            { id: '4', text: 'Therefore, schools should encourage all students to join clubs or sports', order: 4 }
          ],
          correct_order: [3, 1, 2, 4]
        },
        difficulty: 'medium' as 'easy' | 'medium' | 'hard'
      };
      
      const shuffled = [...fallbackPuzzle.elements.shuffled].sort(() => Math.random() - 0.5);
      setCurrentPuzzle({ ...fallbackPuzzle, elements: { ...fallbackPuzzle.elements, shuffled } });
      setUserOrder([]);
      setIsComplete(false);
      setIsCorrect(null);
    }
  };

  const handleDragStart = (element: LogicElement) => {
    setDraggedItem(element);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex?: number) => {
    e.preventDefault();
    if (!draggedItem || !currentPuzzle) return;

    const newOrder = [...userOrder];
    
    // Remove the item from its current position if it exists
    const existingIndex = newOrder.findIndex(item => item.id === draggedItem.id);
    if (existingIndex !== -1) {
      newOrder.splice(existingIndex, 1);
    }

    // Add to new position
    if (dropIndex !== undefined) {
      newOrder.splice(dropIndex, 0, draggedItem);
    } else {
      newOrder.push(draggedItem);
    }

    setUserOrder(newOrder);
    setDraggedItem(null);
  };

  const addToOrder = (element: LogicElement) => {
    if (userOrder.find(item => item.id === element.id)) return;
    setUserOrder([...userOrder, element]);
  };

  const removeFromOrder = (elementId: string) => {
    setUserOrder(userOrder.filter(item => item.id !== elementId));
  };

  const checkAnswer = () => {
    if (!currentPuzzle || userOrder.length !== currentPuzzle.elements.shuffled.length) return;

    const userOrderIds = userOrder.map(item => parseInt(item.id));
    const correctOrder = currentPuzzle.elements.correct_order;
    
    const correct = JSON.stringify(userOrderIds) === JSON.stringify(correctOrder);
    setIsCorrect(correct);
    setIsComplete(true);
    
    if (correct) {
      setCompletedCount(prev => prev + 1);
    }
  };

  const getAvailableElements = () => {
    if (!currentPuzzle) return [];
    return currentPuzzle.elements.shuffled.filter(
      element => !userOrder.find(item => item.id === element.id)
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
          Logic Builder
        </h2>
        <div className="flex items-center gap-2 text-[#4e7397] text-sm">
          <Target size={16} />
          <span>{completedCount}</span>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6">
        {currentPuzzle && (
          <>
            {/* Thesis Statement */}
            <div className="bg-white rounded-xl p-6 border border-[#d0dbe7]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#0e141b] text-lg font-bold flex items-center gap-2">
                  <Brain className="text-blue-600" size={20} />
                  Main Thesis
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentPuzzle.difficulty)}`}>
                  {currentPuzzle.difficulty.toUpperCase()}
                </span>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-[#0e141b] text-base font-medium">
                  "{currentPuzzle.main_thesis}"
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-xl p-4 border border-[#d0dbe7]">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="text-yellow-500" size={16} />
                <span className="text-[#0e141b] text-sm font-semibold">Instructions</span>
              </div>
              <p className="text-[#4e7397] text-sm">
                Arrange the argument pieces below in logical order to build a strong supporting argument for the thesis.
              </p>
            </div>

            {/* Drop Zone - User's Ordered Arguments */}
            <div className="bg-white rounded-xl p-6 border border-[#d0dbe7]">
              <h4 className="text-[#0e141b] text-base font-semibold mb-4">
                📝 Your Argument Chain
              </h4>
              
              <div 
                className="min-h-[200px] border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e)}
              >
                {userOrder.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-[#4e7397] text-sm">
                    Drag argument pieces here or tap to add them
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userOrder.map((element, index) => (
                      <div
                        key={element.id}
                        className="bg-white border border-blue-200 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={() => handleDragStart(element)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-[#4e7397] font-bold text-sm mt-1">
                            {index + 1}.
                          </div>
                          <div className="flex-1 text-[#0e141b] text-sm">
                            {element.text}
                          </div>
                          <div className="flex items-center gap-2">
                            <GripVertical className="text-[#4e7397]" size={16} />
                            <button
                              onClick={() => removeFromOrder(element.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {userOrder.length > 0 && userOrder.length === currentPuzzle.elements.shuffled.length && !isComplete && (
                <div className="mt-4 text-center">
                  <button
                    onClick={checkAnswer}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium text-sm hover:bg-blue-700"
                  >
                    Check My Logic
                  </button>
                </div>
              )}
            </div>

            {/* Available Arguments */}
            {getAvailableElements().length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-[#d0dbe7]">
                <h4 className="text-[#0e141b] text-base font-semibold mb-4">
                  🧩 Available Argument Pieces
                </h4>
                
                <div className="space-y-3">
                  {getAvailableElements().map((element) => (
                    <div
                      key={element.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow hover:bg-gray-100"
                      draggable
                      onDragStart={() => handleDragStart(element)}
                      onClick={() => addToOrder(element)}
                    >
                      <div className="flex items-start gap-3">
                        <GripVertical className="text-[#4e7397] mt-1" size={16} />
                        <div className="flex-1 text-[#0e141b] text-sm">
                          {element.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {isComplete && (
              <div className="bg-white rounded-xl p-6 border border-[#d0dbe7]">
                <div className="text-center mb-4">
                  {isCorrect ? (
                    <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                      <CheckCircle size={24} />
                      <span className="text-lg font-bold">Excellent Logic!</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-red-600 mb-4">
                      <XCircle size={24} />
                      <span className="text-lg font-bold">Try Again</span>
                    </div>
                  )}
                </div>

                {!isCorrect && (
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <h5 className="text-[#0e141b] text-sm font-medium mb-3">✅ Correct Order:</h5>
                    <div className="space-y-2">
                      {currentPuzzle.elements.correct_order.map((correctId, index) => {
                        const element = currentPuzzle.elements.shuffled.find(el => parseInt(el.id) === correctId);
                        return element ? (
                          <div key={element.id} className="flex items-start gap-3 text-sm">
                            <span className="text-[#4e7397] font-bold">{index + 1}.</span>
                            <span className="text-[#0e141b]">{element.text}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={loadNewPuzzle}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:bg-blue-700"
                >
                  <RotateCcw size={16} />
                  Next Logic Puzzle
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}