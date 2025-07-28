'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ArrowRight, 
  House, 
  BookOpen, 
  Brain, 
  FileText, 
  User,
  Bell,
  Palette,
  Globe,
  UserCog,
  HelpCircle,
  Shield,
  Save,
  RotateCcw,
  PenTool
} from 'lucide-react';
import { MockSessionManager as SessionManager } from '@/lib/mock-auth';
import { UserSettings } from '@/app/api/settings/route';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser) return;

      const response = await fetch(`/api/settings?userId=${currentUser.id}`);
      const result = await response.json();

      if (response.ok) {
        setSettings(result.settings);
      } else {
        setError('Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage('Settings saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (!confirm('Are you sure you want to reset all settings to default?')) return;

    try {
      const currentUser = SessionManager.getCurrentUser();
      if (!currentUser) return;

      const response = await fetch(`/api/settings?userId=${currentUser.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadSettings(); // Reload default settings
        setSuccessMessage('Settings reset to default!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      setError('Failed to reset settings');
    }
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const handleReminderToggle = () => {
    updateSetting('reminder_enabled', !settings?.reminder_enabled);
  };

  if (loading) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-gray-50 justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#197fe5]"></div>
        <p className="text-[#5c738a] text-sm mt-2">Loading settings...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="relative flex size-full min-h-screen flex-col bg-gray-50 justify-center items-center">
        <p className="text-[#5c738a] text-base">Failed to load settings</p>
        <button onClick={loadSettings} className="text-[#197fe5] mt-2">Retry</button>
      </div>
    );
  }

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-gray-50 justify-between overflow-x-hidden"
      style={{ fontFamily: 'Lexend, "Noto Sans", sans-serif' }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center bg-gray-50 p-4 pb-2 justify-between">
          <Link href="/profile" className="text-[#101418] flex size-12 shrink-0 items-center">
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-[#101418] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
            Settings
          </h2>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="mx-4 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Account Settings */}
        <div className="space-y-0">
          <div className="flex items-center gap-4 bg-gray-50 px-4 min-h-14 justify-between border-b border-gray-200">
            <div className="flex items-center gap-3">
              <UserCog className="text-[#5c738a]" size={20} />
              <p className="text-[#101418] text-base font-normal leading-normal flex-1 truncate">Account</p>
            </div>
            <div className="shrink-0">
              <ArrowRight className="text-[#101418]" size={20} />
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-gray-50 px-4 min-h-14 justify-between border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Bell className="text-[#5c738a]" size={20} />
              <p className="text-[#101418] text-base font-normal leading-normal flex-1 truncate">Notifications</p>
            </div>
            <div className="shrink-0">
              <ArrowRight className="text-[#101418]" size={20} />
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-gray-50 px-4 min-h-14 justify-between border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Palette className="text-[#5c738a]" size={20} />
              <p className="text-[#101418] text-base font-normal leading-normal flex-1 truncate">Appearance</p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <select 
                value={settings.theme}
                onChange={(e) => updateSetting('theme', e.target.value)}
                className="text-[#101418] text-base bg-transparent border-none outline-none"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-gray-50 px-4 min-h-14 justify-between border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Globe className="text-[#5c738a]" size={20} />
              <p className="text-[#101418] text-base font-normal leading-normal flex-1 truncate">Language</p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <select 
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="text-[#101418] text-base bg-transparent border-none outline-none"
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </div>

        {/* Study Reminders Section */}
        <h2 className="text-[#101418] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
          Study Reminders
        </h2>
        
        <div className="space-y-0">
          <div className="flex items-center gap-4 bg-gray-50 px-4 min-h-[72px] py-2 justify-between border-b border-gray-200">
            <div className="flex flex-col justify-center">
              <p className="text-[#101418] text-base font-medium leading-normal line-clamp-1">
                Enable Reminders
              </p>
              <p className="text-[#5c738a] text-sm font-normal leading-normal line-clamp-2">
                Get notified to study at your preferred times.
              </p>
            </div>
            <div className="shrink-0">
              <label className={`relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none p-0.5 transition-all duration-200 ${
                settings.reminder_enabled
                  ? 'justify-end bg-[#3f7fbf]' 
                  : 'justify-start bg-[#eaedf1]'
              }`}>
                <div 
                  className="h-full w-[27px] rounded-full bg-white transition-transform duration-200"
                  style={{ boxShadow: 'rgba(0, 0, 0, 0.15) 0px 3px 8px, rgba(0, 0, 0, 0.06) 0px 3px 1px' }}
                />
                <input 
                  type="checkbox" 
                  className="invisible absolute" 
                  checked={settings.reminder_enabled}
                  onChange={handleReminderToggle}
                />
              </label>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-gray-50 px-4 min-h-14 justify-between border-b border-gray-200">
            <p className="text-[#101418] text-base font-normal leading-normal flex-1 truncate">
              Reminder Time
            </p>
            <div className="shrink-0 flex items-center gap-2">
              <input 
                type="time"
                value={settings.reminder_time}
                onChange={(e) => updateSetting('reminder_time', e.target.value)}
                className="text-[#101418] text-base bg-transparent border-none outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-gray-50 px-4 min-h-14 justify-between border-b border-gray-200">
            <p className="text-[#101418] text-base font-normal leading-normal flex-1 truncate">
              Reminder Frequency
            </p>
            <div className="shrink-0 flex items-center gap-2">
              <select 
                value={settings.reminder_frequency}
                onChange={(e) => updateSetting('reminder_frequency', e.target.value)}
                className="text-[#101418] text-base bg-transparent border-none outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
        </div>

        {/* Study Preferences */}
        <h2 className="text-[#101418] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
          Study Preferences
        </h2>
        
        <div className="space-y-0">
          <div className="flex items-center gap-4 bg-gray-50 px-4 min-h-14 justify-between border-b border-gray-200">
            <p className="text-[#101418] text-base font-normal leading-normal flex-1 truncate">
              Difficulty Level
            </p>
            <div className="shrink-0 flex items-center gap-2">
              <select 
                value={settings.difficulty_level}
                onChange={(e) => updateSetting('difficulty_level', e.target.value)}
                className="text-[#101418] text-base bg-transparent border-none outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="adaptive">Adaptive</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-gray-50 px-4 min-h-14 justify-between border-b border-gray-200">
            <p className="text-[#101418] text-base font-normal leading-normal flex-1 truncate">
              Study Goal
            </p>
            <div className="shrink-0 flex items-center gap-2">
              <select 
                value={settings.study_goal_minutes}
                onChange={(e) => updateSetting('study_goal_minutes', parseInt(e.target.value))}
                className="text-[#101418] text-base bg-transparent border-none outline-none"
              >
                <option value="15">15 min/day</option>
                <option value="30">30 min/day</option>
                <option value="45">45 min/day</option>
                <option value="60">60 min/day</option>
                <option value="90">90 min/day</option>
                <option value="120">120 min/day</option>
              </select>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <h2 className="text-[#101418] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
          Support
        </h2>
        
        <div className="space-y-0">
          <div className="flex items-center gap-4 bg-gray-50 px-4 min-h-14 justify-between border-b border-gray-200">
            <div className="flex items-center gap-3">
              <HelpCircle className="text-[#5c738a]" size={20} />
              <p className="text-[#101418] text-base font-normal leading-normal flex-1 truncate">
                Help & Feedback
              </p>
            </div>
            <div className="shrink-0">
              <ArrowRight className="text-[#101418]" size={20} />
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-gray-50 px-4 min-h-14 justify-between border-b border-gray-200">
            <div className="flex items-center gap-3">
              <FileText className="text-[#5c738a]" size={20} />
              <p className="text-[#101418] text-base font-normal leading-normal flex-1 truncate">
                Terms of Service
              </p>
            </div>
            <div className="shrink-0">
              <ArrowRight className="text-[#101418]" size={20} />
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-gray-50 px-4 min-h-14 justify-between border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Shield className="text-[#5c738a]" size={20} />
              <p className="text-[#101418] text-base font-normal leading-normal flex-1 truncate">
                Privacy Policy
              </p>
            </div>
            <div className="shrink-0">
              <ArrowRight className="text-[#101418]" size={20} />
            </div>
          </div>
        </div>

        {/* Preferred Subjects */}
        <div className="px-4 py-3">
          <h4 className="text-[#101418] text-base font-medium leading-normal pb-2">Preferred Subjects</h4>
          <div className="space-y-2">
            {['vocabulary', 'reading', 'math', 'writing'].map((subject) => (
              <label key={subject} className="flex items-center gap-3 p-2">
                <input 
                  type="checkbox" 
                  checked={settings.preferred_subjects.includes(subject)}
                  onChange={(e) => {
                    const newSubjects = e.target.checked 
                      ? [...settings.preferred_subjects, subject]
                      : settings.preferred_subjects.filter(s => s !== subject);
                    updateSetting('preferred_subjects', newSubjects);
                  }}
                  className="h-4 w-4 text-[#197fe5] border-gray-300 focus:ring-[#197fe5] rounded"
                />
                <span className="text-[#101418] text-sm capitalize">{subject}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pb-6"></div>
      </div>

      {/* Save/Reset Actions */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex gap-3">
          <button
            onClick={resetSettings}
            className="flex-1 h-10 px-4 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className={`flex-1 h-10 px-4 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 ${
              saving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#197fe5] text-white hover:bg-[#1668c7]'
            }`}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div>
        <div className="flex gap-2 border-t border-[#eaedf1] bg-gray-50 px-4 pb-3 pt-2">
          <Link href="/" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#5c738a]">
            <div className="text-[#5c738a] flex h-8 items-center justify-center">
              <House size={24} />
            </div>
            <p className="text-[#5c738a] text-xs font-medium leading-normal tracking-[0.015em]">Home</p>
          </Link>
          <Link href="/practice" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#5c738a]">
            <div className="text-[#5c738a] flex h-8 items-center justify-center">
              <BookOpen size={24} />
            </div>
            <p className="text-[#5c738a] text-xs font-medium leading-normal tracking-[0.015em]">Practice</p>
          </Link>
          <Link href="/writing" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#5c738a]">
            <div className="text-[#5c738a] flex h-8 items-center justify-center">
              <PenTool size={24} />
            </div>
            <p className="text-[#5c738a] text-xs font-medium leading-normal tracking-[0.015em]">Writing</p>
          </Link>
          <Link href="/flashcard" className="flex flex-1 flex-col items-center justify-end gap-1 text-[#5c738a]">
            <div className="text-[#5c738a] flex h-8 items-center justify-center">
              <Brain size={24} />
            </div>
            <p className="text-[#5c738a] text-xs font-medium leading-normal tracking-[0.015em]">Vocabulary</p>
          </Link>
          <Link href="/profile" className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full text-[#101418]">
            <div className="text-[#101418] flex h-8 items-center justify-center">
              <User size={24} fill="currentColor" />
            </div>
            <p className="text-[#101418] text-xs font-medium leading-normal tracking-[0.015em]">Profile</p>
          </Link>
        </div>
        <div className="h-5 bg-gray-50"></div>
      </div>
    </div>
  );
}