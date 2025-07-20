'use client'

import { useState } from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'

// 临时AI助手按钮组件 - 2024-01-20 14:30:45
// 用于避免Pinecone SDK在前端的兼容性问题
export default function AIAssistantButtonTemp() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* AI助手按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary-500 hover:bg-primary-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
      >
        <SparklesIcon className="w-6 h-6" />
      </button>

      {/* 简单提示框 */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-4 w-80 border">
          <div className="text-sm text-gray-600">
            AI助手功能正在维护中...
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600"
          >
            关闭
          </button>
        </div>
      )}
    </div>
  )
} 