'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { House, BookOpen, Brain, User } from 'lucide-react';
import { ArrowLeft, Upload, FileText, X, Check, Trash2 } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  status: 'uploading' | 'success' | 'error';
  chunks?: Array<{
    id: string;
    content: string;
    size: number;
    title: string;
    error?: string;
  }>;
  fileInfo?: {
    chunksProcessed: number;
    totalChunks: number;
    contentLength: number;
  };
}

export default function UploadPage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 加载已上传的文件
  useEffect(() => {
    loadUploadedFiles();
  }, []);

  const loadUploadedFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/uploaded-files?userId=00000000-0000-0000-0000-000000000001'); // Fixed UUID format
      const result = await response.json();

      if (response.ok && result.files) {
        const files: UploadedFile[] = result.files.map((file: any) => ({
          id: file.fileName,
          name: file.fileName,
          size: file.totalWords * 5, // 估算文件大小
          type: 'application/pdf', // 默认类型
          uploadedAt: new Date(file.uploadedAt).toISOString().split('T')[0],
          status: 'success' as const,
          chunks: file.chunks.map((chunk: any) => ({
            id: chunk.id,
            content: chunk.preview,
            size: chunk.wordCount * 5,
            title: chunk.title
          })),
          fileInfo: {
            chunksProcessed: file.totalChunks,
            totalChunks: file.totalChunks,
            contentLength: file.totalWords * 5
          }
        }));
        setUploadedFiles(files);
      }
    } catch (error) {
      console.error('Error loading uploaded files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    await handleFileUpload(files);
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    await handleFileUpload(files);
  }, []);

  const handleFileUpload = async (files: File[]) => {
    setUploading(true);
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', '00000000-0000-0000-0000-000000000001'); // Fixed UUID format

      const newFile: UploadedFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'uploading'
      };

      setUploadedFiles(prev => [newFile, ...prev]);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          // 上传成功后，重新加载文件列表以显示最新数据
          await loadUploadedFiles();
        } else {
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === newFile.id 
                ? { ...f, status: 'error' as const }
                : f
            )
          );
        }
      } catch (error) {
        console.error('Upload error:', error);
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === newFile.id 
              ? { ...f, status: 'error' as const }
              : f
          )
        );
      }
    }
    
    setUploading(false);
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/uploaded-files?userId=00000000-0000-0000-0000-000000000001&fileName=${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 从本地状态中移除文件
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      } else {
        console.error('Failed to delete file from database');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
          <Link href="/" className="text-[#0e141b] flex size-12 shrink-0 items-center">
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Upload Materials
          </h2>
        </div>

        {/* Upload Section */}
        <div className="p-4">
          <div className="mb-6">
            <p className="text-[#4e7397] text-base font-normal leading-normal mb-4">
              Upload your study materials to personalize your learning experience. Supported formats include PDF and text files.
            </p>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver 
                  ? 'border-[#197fe5] bg-blue-50' 
                  : 'border-[#d0dbe7] bg-white'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload size={48} className="mx-auto text-[#4e7397] mb-4" />
              <p className="text-[#0e141b] text-lg font-medium mb-2">Drag and drop files here</p>
              <p className="text-[#4e7397] text-sm mb-4">Or</p>
              
              <div className="flex gap-2 justify-center">
                <label className="bg-[#197fe5] text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-[#1668c7] transition-colors">
                  Browse Files
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <label className="bg-gray-100 text-[#0e141b] px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                  选择文件
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
              
              <p className="text-[#4e7397] text-sm mt-2">未选择任何文件</p>
            </div>
          </div>

          {/* Uploaded Documents */}
          <div>
            <h3 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] mb-4">
              Uploaded Documents
            </h3>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#197fe5]"></div>
                <p className="text-[#4e7397] text-sm ml-2">Loading files...</p>
              </div>
            ) : uploadedFiles.length === 0 ? (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto text-[#4e7397] mb-4" />
                <p className="text-[#4e7397] text-base">No files uploaded yet</p>
                <p className="text-[#4e7397] text-sm">Upload your first document to get started</p>
              </div>
            ) : (
              <div className="space-y-3" data-testid="uploaded-files-list">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="bg-white rounded-lg p-4 border border-[#d0dbe7]" data-testid="file-item">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText size={24} className="text-[#197fe5]" />
                    <div className="flex-1">
                      <p className="text-[#0e141b] text-base font-medium">{file.name}</p>
                      <p className="text-[#4e7397] text-sm">
                        Uploaded on {file.uploadedAt} • {formatFileSize(file.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === 'uploading' && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#197fe5]"></div>
                      )}
                      {file.status === 'success' && (
                        <Check size={16} className="text-green-500" />
                      )}
                      {file.status === 'error' && (
                        <X size={16} className="text-red-500" />
                      )}
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-[#4e7397] hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* RAG Processing Results */}
                  {file.status === 'success' && file.fileInfo && (
                    <div className="mt-3 pt-3 border-t border-[#e7edf3]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-[#0e141b] text-sm font-medium">RAG Processing Complete</p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="text-center">
                          <p className="text-[#4e7397] text-xs">Chunks</p>
                          <p className="text-[#0e141b] text-sm font-bold">{file.fileInfo.chunksProcessed}/{file.fileInfo.totalChunks}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[#4e7397] text-xs">Content</p>
                          <p className="text-[#0e141b] text-sm font-bold">{file.fileInfo.contentLength.toLocaleString()} chars</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[#4e7397] text-xs">Status</p>
                          <p className="text-green-600 text-sm font-bold">Ready for AI</p>
                        </div>
                      </div>
                      
                      {/* Chunks Preview */}
                      {file.chunks && file.chunks.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[#4e7397] text-xs font-medium mb-2">Knowledge Chunks:</p>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {file.chunks.slice(0, 3).map((chunk, index) => (
                              <div key={chunk.id} className="bg-[#f8fafc] rounded p-2">
                                <p className="text-[#0e141b] text-xs font-medium">{chunk.title}</p>
                                <p className="text-[#4e7397] text-xs mt-1">{chunk.content}</p>
                                {chunk.error && (
                                  <p className="text-red-500 text-xs mt-1">Error: {chunk.error}</p>
                                )}
                              </div>
                            ))}
                            {file.chunks.length > 3 && (
                              <p className="text-[#4e7397] text-xs text-center">
                                +{file.chunks.length - 3} more chunks
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Error Display */}
                  {file.status === 'error' && (
                    <div className="mt-3 pt-3 border-t border-[#e7edf3]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <p className="text-red-600 text-sm">Processing failed</p>
                      </div>
                    </div>
                  )}
                </div>
                              ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div>
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
          <Link href="/flashcard" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <Brain size={24} />
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Vocabulary</p>
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