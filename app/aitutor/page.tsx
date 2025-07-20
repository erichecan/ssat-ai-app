'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, House, BookOpen, File, User, Image, Send } from 'lucide-react';
import { MockSessionManager as SessionManager } from '@/lib/mock-auth';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi there! I'm your AI tutor here to help you with SSAT/SAT prep. I can answer questions about specific problems, explain concepts, and provide personalized study strategies based on your uploaded materials. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (inputValue.trim() && !isLoading) {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: inputValue,
        isUser: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsLoading(true);
      
      try {
        // 获取当前用户
        const currentUser = SessionManager.getCurrentUser();
        if (!currentUser) {
          throw new Error('Please sign in to use AI Tutor');
        }

        // 调用简化的 AI API
        const response = await fetch('/api/ai/simple-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
          }),
        });
        
        const result = await response.json();
        
        if (response.ok) {
          const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            content: result.answer,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiResponse]);
        } else {
          throw new Error(result.error || 'AI response failed');
        }
        
      } catch (error) {
        console.error('AI chat error:', error);
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. In the meantime, feel free to ask me about SSAT/SAT strategies, specific question types, or study techniques!",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      {/* Header */}
      <div>
        <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
          <Link href="/" className="text-[#0e141b] flex size-12 shrink-0 items-center">
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            AI Tutor
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-3 p-4 ${message.isUser ? 'justify-end' : ''}`}
            >
              {!message.isUser && (
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0"
                  style={{
                    backgroundImage: `url("https://images.unsplash.com/photo-1677442136019-21780ecad995?w=40&h=40&fit=crop&crop=face")`,
                  }}
                />
              )}
              <div className={`flex flex-1 flex-col gap-1 ${message.isUser ? 'items-end' : 'items-start'}`}>
                <p className={`text-[#4e7397] text-[13px] font-normal leading-normal max-w-[360px] ${message.isUser ? 'text-right' : ''}`}>
                  {message.isUser ? 'You' : 'AI Tutor'}
                </p>
                <p
                  className={`text-base font-normal leading-normal flex max-w-[360px] rounded-lg px-4 py-3 ${
                    message.isUser
                      ? 'bg-[#197fe5] text-slate-50'
                      : 'bg-[#e7edf3] text-[#0e141b]'
                  }`}
                >
                  {message.content}
                </p>
              </div>
              {message.isUser && (
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0"
                  style={{
                    backgroundImage: `url("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face")`,
                  }}
                />
              )}
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start gap-4 p-4">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0"
                style={{
                  backgroundImage: `url("https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=40&h=40&fit=crop&crop=center")`,
                }}
              />
              <div className="bg-[#e7edf3] rounded-lg p-4 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#4e7397] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-[#4e7397] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-[#4e7397] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-[#4e7397] text-sm">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input and Navigation */}
      <div>
        <div className="flex items-center px-4 py-3 gap-3">
          <div className="flex flex-col min-w-40 h-12 flex-1">
            <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
              <input
                placeholder={isLoading ? "AI is thinking..." : "Ask a question..."}
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0e141b] focus:outline-0 focus:ring-0 border-none bg-[#e7edf3] focus:border-none h-full placeholder:text-[#4e7397] px-4 rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <div className="flex border-none bg-[#e7edf3] items-center justify-center pr-4 rounded-r-lg border-l-0">
                <div className="flex items-center gap-4 justify-end">
                  <div className="flex items-center gap-1">
                    <button className="flex items-center justify-center p-1.5">
                      <Image className="text-[#4e7397]" size={20} />
                    </button>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    className={`min-w-[84px] max-w-[480px] items-center justify-center overflow-hidden rounded-lg h-8 px-4 text-sm font-medium leading-normal hidden sm:flex ${
                      isLoading || !inputValue.trim() 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-[#197fe5] text-slate-50 cursor-pointer hover:bg-[#1668c7]'
                    }`}
                  >
                    <span className="truncate">
                      {isLoading ? 'Sending...' : 'Send'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
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
          <Link href="/review" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <File size={24} />
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Review</p>
          </Link>
          <Link href="/aitutor" className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full text-[#0e141b]">
            <div className="text-[#0e141b] flex h-8 items-center justify-center">
              <Bot size={24} fill="currentColor" />
            </div>
            <p className="text-[#0e141b] text-xs font-medium leading-normal tracking-[0.015em]">AI Tutor</p>
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
}