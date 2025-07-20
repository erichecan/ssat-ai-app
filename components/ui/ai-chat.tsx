'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  StarIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: {
    title: string
    content: string
    topic: string
  }[]
  rating?: number
}

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  questionId?: string
  userId: string
  onSendMessage?: (message: string) => Promise<{
    answer: string
    sources?: any[]
    confidence?: number
  }>
}

export default function AIChat({ 
  isOpen, 
  onClose, 
  questionId, 
  userId,
  onSendMessage 
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSources, setShowSources] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Add welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'assistant',
        content: "Hi! I'm your AI tutor. I can help you understand questions, explain concepts, and provide personalized study advice. What would you like to know?",
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, messages.length])
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    
    try {
      const response = await onSendMessage?.(inputValue)
      
      if (response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.answer,
          timestamp: new Date(),
          sources: response.sources
        }
        
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  const handleRateMessage = (messageId: string, rating: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, rating } : msg
    ))
  }
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Tutor</h3>
              <p className="text-sm text-gray-500">Online</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
                            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex flex-col",
                message.type === 'user' ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3 text-sm",
                  message.type === 'user'
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => setShowSources(showSources === message.id ? null : message.id)}
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                      <ClipboardDocumentListIcon className="w-3 h-3" />
                      {message.sources.length} sources
                    </button>
                    
                    {showSources === message.id && (
                      <div className="mt-2 space-y-1">
                        {message.sources.map((source, index) => (
                          <div key={index} className="text-xs bg-white p-2 rounded border">
                            <p className="font-medium">{source.title}</p>
                            <p className="text-gray-600 line-clamp-2">{source.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Rating */}
                {message.type === 'assistant' && message.id !== 'welcome' && (
                  <div className="mt-2 pt-2 border-t border-gray-200 flex items-center gap-1">
                    <span className="text-xs text-gray-600">Rate:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRateMessage(message.id, star)}
                        className="p-0.5 hover:bg-gray-200 rounded"
                      >
                        {message.rating && star <= message.rating ? (
                          <StarIconSolid className="w-3 h-3 text-yellow-500" />
                        ) : (
                          <StarIcon className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-1">
                {formatTime(message.timestamp)}
              </p>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start">
              <div className="bg-gray-100 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question..."
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className={cn(
                "p-2 rounded-lg transition-colors",
                inputValue.trim() && !isLoading
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <p>Press Enter to send, Shift+Enter for new line</p>
            {questionId && (
              <p className="bg-gray-100 px-2 py-1 rounded">Question context</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}