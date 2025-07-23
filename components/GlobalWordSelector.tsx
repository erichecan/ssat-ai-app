'use client'

import { useEffect, useState } from 'react'
import { Plus, Check, X } from 'lucide-react'

import { DEMO_USER_UUID } from '@/lib/demo-user'

interface GlobalWordSelectorProps {
  userId?: string
}

export default function GlobalWordSelector({ userId = DEMO_USER_UUID }: GlobalWordSelectorProps) {
  const [selectedWord, setSelectedWord] = useState<string>('')
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [showPopup, setShowPopup] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    const handleDoubleClick = (event: MouseEvent) => {
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim()

      // Only proceed if there's a single word selected
      if (selectedText && selectedText.split(/\s+/).length === 1 && /^[a-zA-Z]+$/.test(selectedText)) {
        // Avoid adding words from input fields or edit areas
        const target = event.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
          return
        }

        setSelectedWord(selectedText.toLowerCase())
        setPosition({ x: event.clientX, y: event.clientY })
        setShowPopup(true)
        setStatus('idle')

        // Clear selection to prevent visual artifacts
        selection?.removeAllRanges()
      }
    }

    // Add event listener to document
    document.addEventListener('dblclick', handleDoubleClick)

    return () => {
      document.removeEventListener('dblclick', handleDoubleClick)
    }
  }, [])

  const handleAddToVocabulary = async () => {
    if (!selectedWord) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: selectedWord,
          userId: userId,
          context: 'Global selection',
          source: 'double_click'
        })
      })

      const result = await response.json()

      if (response.ok) {
        setStatus('success')
        setTimeout(() => {
          setShowPopup(false)
          setStatus('idle')
        }, 1500)
      } else {
        setStatus('error')
        console.error('Failed to add word:', result.error)
      }
    } catch (error) {
      setStatus('error')
      console.error('Error adding word to vocabulary:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setShowPopup(false)
    setStatus('idle')
  }

  if (!showPopup) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black bg-opacity-20" 
        onClick={handleClose}
      />
      
      {/* Popup */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[280px]"
        style={{
          left: Math.min(position.x, window.innerWidth - 300),
          top: Math.min(position.y + 10, window.innerHeight - 150),
        }}
      >
        {status === 'idle' && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Add to Vocabulary</span>
            </div>
            
            <div className="mb-3">
              <p className="text-gray-600 text-sm mb-1">Selected word:</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{selectedWord}</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleAddToVocabulary}
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add
                  </>
                )}
              </button>
              
              <button
                onClick={handleClose}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {status === 'success' && (
          <div className="text-center">
            <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900 mb-1">Added to Vocabulary!</p>
            <p className="text-xs text-gray-600">
              <span className="capitalize">{selectedWord}</span> has been added with AI-generated content
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <X className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900 mb-1">Failed to Add</p>
            <p className="text-xs text-gray-600 mb-3">Please try again later</p>
            <button
              onClick={handleClose}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>
  )
}