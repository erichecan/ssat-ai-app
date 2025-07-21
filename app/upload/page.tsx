'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, House, BookOpen, File, Bot, User, Upload, X, Check } from 'lucide-react';
import { MockSessionManager as SessionManager } from '@/lib/mock-auth';

interface UploadedFile {
  id: string;
  name: string;
  uploadDate: string;
  size: string;
  type: 'pdf' | 'txt' | 'doc';
  status: 'uploading' | 'completed' | 'error';
  chunksProcessed?: number;
  totalChunks?: number;
  errorMessage?: string;
}

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    {
      id: '1',
      name: 'Essay on American History',
      uploadDate: '2024-04-20',
      size: '2.3 MB',
      type: 'pdf',
      status: 'completed'
    },
    {
      id: '2',
      name: 'Science Textbook Chapter 3',
      uploadDate: '2024-04-15',
      size: '1.8 MB',
      type: 'pdf',
      status: 'completed'
    }
  ]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (files) {
      Array.from(files).forEach(async (file) => {
        const fileId = Date.now().toString() + Math.random().toString();
        const newFile: UploadedFile = {
          id: fileId,
          name: file.name,
          uploadDate: new Date().toISOString().split('T')[0],
          size: formatFileSize(file.size),
          type: getFileType(file.name),
          status: 'uploading'
        };
        
        setUploadedFiles(prev => [...prev, newFile]);
        
        try {
          // 获取当前用户
          const currentUser = SessionManager.getCurrentUser();
          if (!currentUser) {
            throw new Error('Please sign in to upload files');
          }

          // 真实的文件上传
          const formData = new FormData();
          formData.append('file', file);
          formData.append('userId', currentUser.id);
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          // 检查响应类型
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            // 如果不是JSON响应，可能是HTML错误页面
            const text = await response.text();
            console.error('Non-JSON response:', text);
            throw new Error('Server returned an invalid response. Please check if the API is working correctly.');
          }
          
          const result = await response.json();
          
          if (response.ok) {
            setUploadedFiles(prev => 
              prev.map(f => 
                f.id === fileId 
                  ? { 
                      ...f, 
                      status: 'completed' as const,
                      chunksProcessed: result.fileInfo?.chunksProcessed,
                      totalChunks: result.fileInfo?.totalChunks
                    }
                  : f
              )
            );
            
            // 显示成功消息
            console.log('Upload successful:', result.message);
          } else {
            throw new Error(result.error || 'Upload failed');
          }
          
        } catch (error) {
          console.error('Upload error:', error);
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === fileId 
                ? { 
                    ...f, 
                    status: 'error' as const,
                    errorMessage: error instanceof Error ? error.message : 'Unknown error'
                  }
                : f
            )
          );
          
          // 可以添加错误提示 toast 或 alert
          alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (fileName: string): 'pdf' | 'txt' | 'doc' => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'pdf';
    if (extension === 'txt') return 'txt';
    return 'doc';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <div className="animate-spin w-4 h-4 border-2 border-[#197fe5] border-t-transparent rounded-full" />;
      case 'completed':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'error':
        return <X className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-slate-50 justify-between overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center bg-slate-50 p-4 pb-2 justify-between">
          <Link href="/" className="text-[#0d141b] flex size-12 shrink-0 items-center">
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-[#0d141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Upload Materials
          </h2>
        </div>

        {/* Description */}
        <p className="text-[#0d141b] text-base font-normal leading-normal pb-3 pt-1 px-4">
          Upload your study materials to personalize your learning experience. Supported formats include PDF and text files.
        </p>

        {/* Upload Area */}
        <div className="flex flex-col p-4">
          <div
            className={`flex flex-col items-center gap-6 rounded-xl border-2 border-dashed px-6 py-14 transition-colors ${
              isDragOver 
                ? 'border-[#197fe5] bg-blue-50' 
                : 'border-[#cfdbe7]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex max-w-[480px] flex-col items-center gap-2">
              <Upload className="w-12 h-12 text-[#4c739a] mb-2" />
              <p className="text-[#0d141b] text-lg font-bold leading-tight tracking-[-0.015em] max-w-[480px] text-center">
                Drag and drop files here
              </p>
              <p className="text-[#0d141b] text-sm font-normal leading-normal max-w-[480px] text-center">
                Or
              </p>
            </div>
            <button
              onClick={handleBrowseClick}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#e7edf3] text-[#0d141b] text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#d0dbe7] transition-colors"
            >
              <span className="truncate">Browse Files</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Uploaded Documents */}
        <h2 className="text-[#0d141b] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
          Uploaded Documents
        </h2>
        
        <div className="space-y-2">
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-4 bg-slate-50 px-4 min-h-[72px] py-2">
              <div className="text-[#0d141b] flex items-center justify-center rounded-lg bg-[#e7edf3] shrink-0 size-12">
                <File size={24} />
              </div>
              <div className="flex flex-col justify-center flex-1">
                <p className="text-[#0d141b] text-base font-medium leading-normal line-clamp-1">
                  {file.name}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-[#4c739a] text-sm font-normal leading-normal line-clamp-2">
                    {file.status === 'completed' && file.chunksProcessed ? 
                      `Processed ${file.chunksProcessed} chunks • ${file.size}` :
                      file.status === 'error' && file.errorMessage ? 
                        `Error: ${file.errorMessage}` :
                        `Uploaded on ${file.uploadDate} • ${file.size}`
                    }
                  </p>
                  {getStatusIcon(file.status)}
                </div>
              </div>
              {file.status === 'completed' && (
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="text-[#4c739a] hover:text-red-600 transition-colors p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          
          {uploadedFiles.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <p className="text-[#4c739a] text-base font-normal">No documents uploaded yet</p>
            </div>
          )}
        </div>

        {/* Upload Tips */}
        <div className="px-4 py-6">
          <div className="bg-white rounded-lg p-4 border border-[#e7edf3]">
            <h3 className="text-[#0d141b] text-base font-semibold mb-2">Upload Tips</h3>
            <ul className="space-y-1 text-[#4c739a] text-sm">
              <li>• Supported formats: PDF, TXT, DOC, DOCX</li>
              <li>• Maximum file size: 10MB per file</li>
              <li>• Upload multiple files at once</li>
              <li>• AI will analyze your materials for personalized questions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div>
        <div className="flex gap-2 border-t border-[#e7edf3] bg-slate-50 px-4 pb-3 pt-2">
          <Link href="/" className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full text-[#0d141b]">
            <div className="text-[#0d141b] flex h-8 items-center justify-center">
              <House size={24} fill="currentColor" />
            </div>
            <p className="text-[#0d141b] text-xs font-medium leading-normal tracking-[0.015em]">Home</p>
          </Link>
          <Link href="/practice" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4c739a]">
            <div className="text-[#4c739a] flex h-8 items-center justify-center">
              <BookOpen size={24} />
            </div>
            <p className="text-[#4c739a] text-xs font-medium leading-normal tracking-[0.015em]">Practice</p>
          </Link>
          <Link href="/review" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4c739a]">
            <div className="text-[#4c739a] flex h-8 items-center justify-center">
              <File size={24} />
            </div>
            <p className="text-[#4c739a] text-xs font-medium leading-normal tracking-[0.015em]">Review</p>
          </Link>
          <Link href="/aitutor" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4c739a]">
            <div className="text-[#4c739a] flex h-8 items-center justify-center">
              <Bot size={24} />
            </div>
            <p className="text-[#4c739a] text-xs font-medium leading-normal tracking-[0.015em]">AI Tutor</p>
          </Link>
          <Link href="/profile" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4c739a]">
            <div className="text-[#4c739a] flex h-8 items-center justify-center">
              <User size={24} />
            </div>
            <p className="text-[#4c739a] text-xs font-medium leading-normal tracking-[0.015em]">Profile</p>
          </Link>
        </div>
        <div className="h-5 bg-slate-50"></div>
      </div>
    </div>
  );
}