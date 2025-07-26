'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Vocabulary Admin page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
        <Link href="/flashcard" className="text-[#0e141b] flex size-12 shrink-0 items-center">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          Vocabulary Admin Error
        </h2>
      </div>

      {/* Error Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center border border-red-200">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Vocabulary Admin Error
          </h3>
          <p className="text-gray-600 mb-4">
            There was an error loading the vocabulary management page. This could be due to:
          </p>
          
          <div className="text-left text-sm text-gray-700 mb-6 space-y-1">
            <p>• Database connection issues</p>
            <p>• API endpoint problems</p>
            <p>• Gemini AI API configuration</p>
            <p>• Supabase configuration issues</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/flashcard"
              className="block w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
            >
              Back to Flashcards
            </Link>
          </div>
          
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error Details
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    </div>
  )
}