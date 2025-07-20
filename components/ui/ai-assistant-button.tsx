'use client'

import { useState } from 'react'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import AIChat from './ai-chat'
import { askQuestionClient } from '@/lib/rag-client'

interface AIAssistantButtonProps {
  userId: string
  questionId?: string
  className?: string
}

export default function AIAssistantButton({ 
  userId, 
  questionId, 
  className 
}: AIAssistantButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleSendMessage = async (message: string) => {
    try {
      const response = await askQuestionClient(userId, message, questionId)
      return response
    } catch (error) {
      console.error('Error in AI assistant:', error)
      throw error
    }
  }
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 z-40 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105",
          className
        )}
        aria-label="Open AI Assistant"
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
      </button>
      
      <AIChat
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        questionId={questionId}
        userId={userId}
        onSendMessage={handleSendMessage}
      />
    </>
  )
}