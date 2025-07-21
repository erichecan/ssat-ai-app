'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, FileText, Trash2, Upload, Eye, Calendar, Hash, Type } from 'lucide-react'

interface FileChunk {
  id: string
  title: string
  preview: string
  wordCount: number
}

interface UploadedFile {
  fileName: string
  totalChunks: number
  totalWords: number
  topic: string
  difficulty: string
  type: string
  uploadedAt: string
  lastUpdated: string
  chunks: FileChunk[]
}

export default function FilesPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [userId] = useState('demo-user-' + Date.now()) // 演示用户ID
  const router = useRouter()

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/uploaded-files?userId=${encodeURIComponent(userId)}`)
      const data = await response.json()
      
      if (data.success) {
        setFiles(data.files || [])
      } else {
        console.error('Failed to load files:', data.error)
      }
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFile = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(fileName)
    try {
      const response = await fetch(`/api/uploaded-files?userId=${encodeURIComponent(userId)}&fileName=${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      if (data.success) {
        setFiles(files.filter(f => f.fileName !== fileName))
        if (selectedFile?.fileName === fileName) {
          setSelectedFile(null)
        }
      } else {
        alert('Failed to delete file: ' + data.error)
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Error deleting file')
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'hard': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'concept': return <Type className="w-4 h-4" />
      case 'strategy': return <Hash className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between border-b border-gray-200">
        <button
          onClick={() => router.back()}
          className="text-[#0e141b] flex size-12 shrink-0 items-center justify-center"
        >
          <X size={24} />
        </button>
        <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          My Uploaded Files
        </h2>
        <button
          onClick={() => router.push('/upload')}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#197fe5] hover:text-[#1570d4]"
        >
          <Upload size={16} />
          Upload
        </button>
      </div>

      <div className="flex flex-1">
        {/* File List */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#197fe5]"></div>
              <p className="text-[#4e7397] text-sm ml-3">Loading files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No files uploaded yet</h3>
              <p className="text-gray-500 mb-4">Upload your first PDF or text file to get started with personalized AI questions</p>
              <button
                onClick={() => router.push('/upload')}
                className="flex items-center gap-2 px-4 py-2 bg-[#197fe5] text-white rounded-lg hover:bg-[#1570d4] transition-colors"
              >
                <Upload size={16} />
                Upload File
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {files.map((file) => (
                <div
                  key={file.fileName}
                  className={`bg-white rounded-lg p-4 border transition-all cursor-pointer ${
                    selectedFile?.fileName === file.fileName
                      ? 'border-[#197fe5] shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedFile(selectedFile?.fileName === file.fileName ? null : file)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        {getTypeIcon(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#0e141b] truncate text-sm">
                          {file.fileName}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-[#4e7397] mt-1">
                          <span className="flex items-center gap-1">
                            <Hash size={12} />
                            {file.totalChunks} chunks
                          </span>
                          <span>{file.totalWords.toLocaleString()} words</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(file.uploadedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(file.difficulty)}`}>
                            {file.difficulty}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            {file.topic}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedFile(selectedFile?.fileName === file.fileName ? null : file)
                        }}
                        className="p-2 text-gray-400 hover:text-[#197fe5] transition-colors"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFile(file.fileName)
                        }}
                        disabled={deleting === file.fileName}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Delete file"
                      >
                        {deleting === file.fileName ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File Details Panel */}
        {selectedFile && (
          <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-bold text-lg text-[#0e141b] mb-4">File Details</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-[#4e7397] mb-1">File Name</h4>
                <p className="text-[#0e141b] break-words">{selectedFile.fileName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-[#4e7397] mb-1">Chunks</h4>
                  <p className="text-[#0e141b] text-lg font-bold">{selectedFile.totalChunks}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[#4e7397] mb-1">Words</h4>
                  <p className="text-[#0e141b] text-lg font-bold">{selectedFile.totalWords.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-[#4e7397] mb-1">Topic</h4>
                <p className="text-[#0e141b]">{selectedFile.topic}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-[#4e7397] mb-1">Difficulty</h4>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedFile.difficulty)}`}>
                  {selectedFile.difficulty}
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-[#4e7397] mb-1">Uploaded</h4>
                <p className="text-[#0e141b] text-sm">{formatDate(selectedFile.uploadedAt)}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-[#4e7397] mb-2">Content Chunks</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedFile.chunks.map((chunk, index) => (
                    <div key={chunk.id} className="bg-gray-50 rounded-lg p-3">
                      <h5 className="font-medium text-sm text-[#0e141b] mb-1">
                        Part {index + 1} ({chunk.wordCount} words)
                      </h5>
                      <p className="text-xs text-[#4e7397] leading-relaxed">
                        {chunk.preview}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="text-center text-sm text-[#4e7397]">
            {files.length} file{files.length !== 1 ? 's' : ''} • {files.reduce((sum, f) => sum + f.totalChunks, 0)} chunks total
          </div>
        </div>
      )}
    </div>
  )
}