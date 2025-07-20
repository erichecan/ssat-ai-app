'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Lock } from 'lucide-react';
import { MockSessionManager as SessionManager } from '@/lib/mock-auth';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    fullName: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // 清除错误消息
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/signin' : '/api/auth/signup';
      const payload = isLogin 
        ? { username: formData.username }
        : {
            email: formData.email,
            username: formData.username,
            fullName: formData.fullName,
            password: formData.password
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        // 保存用户会话
        SessionManager.setUser(result.user);
        
        // 跳转到首页
        router.push('/');
      } else {
        setError(result.error || 'Authentication failed');
      }

    } catch (error) {
      console.error('Auth error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
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
          <Link href="/" className="text-[#0e141b] flex size-12 shrink-0 items-center">
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-[#0e141b] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </h2>
        </div>

        {/* Welcome Message */}
        <div className="px-4 py-6 text-center">
          <h1 className="text-[#0e141b] text-2xl font-bold leading-tight tracking-[-0.015em] mb-2">
            Welcome to SSAT Master
          </h1>
          <p className="text-[#4e7397] text-base font-normal leading-normal">
            {isLogin 
              ? 'Sign in to continue your learning journey'
              : 'Create an account to start your SSAT prep'
            }
          </p>
        </div>

        {/* Auth Form */}
        <div className="px-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[#0e141b] text-sm font-medium leading-normal">
                  Email
                </label>
                <div className="flex items-center bg-white rounded-lg border border-[#d0dbe7] p-3">
                  <Mail className="text-[#4e7397] mr-3" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="flex-1 text-[#0e141b] text-base font-normal leading-normal outline-none"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[#0e141b] text-sm font-medium leading-normal">
                Username
              </label>
              <div className="flex items-center bg-white rounded-lg border border-[#d0dbe7] p-3">
                <User className="text-[#4e7397] mr-3" size={20} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                  className="flex-1 text-[#0e141b] text-base font-normal leading-normal outline-none"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[#0e141b] text-sm font-medium leading-normal">
                  Full Name (Optional)
                </label>
                <div className="flex items-center bg-white rounded-lg border border-[#d0dbe7] p-3">
                  <User className="text-[#4e7397] mr-3" size={20} />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="flex-1 text-[#0e141b] text-base font-normal leading-normal outline-none"
                  />
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[#0e141b] text-sm font-medium leading-normal">
                  Password
                </label>
                <div className="flex items-center bg-white rounded-lg border border-[#d0dbe7] p-3">
                  <Lock className="text-[#4e7397] mr-3" size={20} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="flex-1 text-[#0e141b] text-base font-normal leading-normal outline-none"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full rounded-lg h-12 px-4 text-sm font-bold leading-normal tracking-[0.015em] ${
                isLoading
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-[#197fe5] text-slate-50 hover:bg-[#1668c7] cursor-pointer'
              }`}
            >
              {isLoading 
                ? (isLogin ? 'Signing In...' : 'Creating Account...') 
                : (isLogin ? 'Sign In' : 'Create Account')
              }
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="text-center mt-6">
            <p className="text-[#4e7397] text-sm">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setFormData({ email: '', username: '', fullName: '', password: '' });
                }}
                className="text-[#197fe5] font-medium hover:underline"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>

          {/* Demo Account */}
          {isLogin && (
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h3 className="text-[#0e141b] text-sm font-semibold mb-2">Demo Account</h3>
              <p className="text-[#4e7397] text-sm mb-3">
                Try the app with a demo account. Username: <strong>demo</strong>
              </p>
              <button
                onClick={() => {
                  setFormData({ ...formData, username: 'demo' });
                  setError('');
                }}
                className="text-[#197fe5] text-sm font-medium hover:underline"
              >
                Use Demo Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-6 text-center">
        <p className="text-[#4e7397] text-xs">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}