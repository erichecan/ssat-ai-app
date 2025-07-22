'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, X, Check, Trash2 } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  status: 'uploading' | 'success' | 'error';
}

export default function UploadPage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    {
      id: '1',
      name: 'Essay on American History',
      size: 2400000,
      type: 'application/pdf',
      uploadedAt: '2024-04-20',
      status: 'success'
    },
    {
      id: '2',
      name: 'Science Textbook Chapter 3',
      size: 1800000,
      type: 'application/pdf',
      uploadedAt: '2024-04-15',
      status: 'success'
    }
  ]);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

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
      formData.append('userId', 'demo-user-123');

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
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === newFile.id 
                ? { ...f, status: 'success' as const }
                : f
            )
          );
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

  const handleDeleteFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
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
            
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="bg-white rounded-lg p-4 border border-[#d0dbe7]">
                  <div className="flex items-center gap-3">
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div>
        <div className="flex gap-2 border-t border-[#e7edf3] bg-slate-50 px-4 pb-3 pt-2">
          <Link href="/" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
                <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Home</p>
          </Link>
          <Link href="/practice" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 7v14"></path>
                <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>
              </svg>
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Practice</p>
          </Link>
          <Link href="/review" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="m21 21-4.34-4.34"></path>
                <circle cx="11" cy="11" r="8"></circle>
              </svg>
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Review</p>
          </Link>
          <Link href="/profile" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#4e7397]">
            <div className="text-[#4e7397] flex h-8 items-center justify-center">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <p className="text-[#4e7397] text-xs font-medium leading-normal tracking-[0.015em]">Profile</p>
          </Link>
        </div>
        <div className="h-5 bg-slate-50"></div>
      </div>
    </div>
  );
} 