import React, { useState, useRef } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Download,
  Flame,
  HelpCircle,
  Moon,
  RefreshCw,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
  User,
  Volume2,
  Zap,
  Keyboard,
  Cloud,
  Database,
  LogIn,
  LogOut,
  Globe,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playCompletionChime } from '../../utils/sound';
import { hasNotificationPermission, requestNotificationPermission } from '../../utils/notifications';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportBackup,
    importBackup,
    resetAllData,
    loadSampleData,
    setOnboardingModalOpen,
    setShortcutsModalOpen,
    currentUser,
    signInWithGoogle,
    signOutUser,
    setAuthModalOpen,
    setAuthModalTab,
    isOnline,
    syncStatus,
    pendingSyncCount,
    lastSyncedAt,
    syncNow,
  } = useApp();

  const [studentName, setStudentName] = useState(settings.studentName || '');
  const [dailyGoal, setDailyGoal] = useState(settings.dailyGoalMinutes || 120);
  const [focusDuration, setFocusDuration] = useState(settings.focusDurationMinutes || 25);
  const [shortBreak, setShortBreak] = useState(settings.shortBreakMinutes || 5);
  const [longBreak, setLongBreak] = useState(settings.longBreakMinutes || 15);

  const [importStatus, setImportStatus] = useState<{ message: string; isError?: boolean } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [saveBanner, setSaveBanner] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const handleCopyDomain = () => {
    navigator.clipboard.writeText('https://focusforge.xyz');
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      studentName: studentName.trim() || 'Student',
      dailyGoalMinutes: Number(dailyGoal) || 120,
      focusDurationMinutes: Number(focusDuration) || 25,
      shortBreakMinutes: Number(shortBreak) || 5,
      longBreakMinutes: Number(longBreak) || 15,
    });
    setSaveBanner(true);
    setTimeout(() => setSaveBanner(false), 3000);
  };

  const handleExport = () => {
    const jsonStr = exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusforge-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importBackup(content);
      if (res.success) {
        setImportStatus({ message: 'Backup successfully restored!' });
      } else {
        setImportStatus({ message: res.error || 'Failed to import backup.', isError: true });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleToggleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const granted = await requestNotificationPermission();
      updateSettings({ notificationsEnabled: granted });
      if (!granted) {
        alert('Browser notifications were not allowed. Please grant permission in your browser address bar.');
      }
    } else {
      updateSettings({ notificationsEnabled: false });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize study durations, targets, sounds, backup archives, and application data.
        </p>
      </div>

      {saveBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Preferences updated successfully!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* Profile & Student Name */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-purple-500" />
            <span>Student Profile</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Your Name (for personalized dashboard greetings)
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full max-w-sm px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500"
            />
          </div>
        </div>

        {/* Firebase Cloud Sync & Authentication */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cloud className="w-4 h-4 text-purple-500" />
              <span>Local-First Cloud Synchronization</span>
            </h2>
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                  isOnline
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <span>{isOnline ? 'Online · Connected' : 'Offline Mode'}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Powered by Google Cloud project <code className="text-purple-600 dark:text-purple-400 font-mono">gen-lang-client-0130345776</code> in region <code className="text-purple-600 dark:text-purple-400 font-mono">asia-south1</code>. Changes are applied locally with zero delay, queued during offline periods, and automatically synchronized to Firestore upon reconnection.
          </p>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {currentUser ? (
                  <span className="flex items-center gap-1.5">
                    <span>Active Account:</span>
                    <span className="text-purple-600 dark:text-purple-400 font-mono">
                      {currentUser.email || currentUser.displayName || 'Student'}
                    </span>
                  </span>
                ) : (
                  'Local Storage Mode'
                )}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {currentUser
                  ? `Sync Engine: ${
                      pendingSyncCount === 0
                        ? 'All changes fully synchronized to Firestore.'
                        : `${pendingSyncCount} action(s) currently queued locally.`
                    } Last synced: ${
                      lastSyncedAt
                        ? lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Pending'
                    }`
                  : 'Currently storing study data in this browser. Sign up or log in with Email/Password to synchronize your progress across mobile, laptop, and desktop.'}
              </span>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    await syncNow();
                  }}
                  disabled={!isOnline || syncStatus === 'syncing'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={signOutUser}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-300 dark:border-slate-700"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('login');
                    setAuthModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-all hover:scale-[1.02] whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In / Create Account</span>
                </button>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                >
                  <span>Google</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Official App Domain & Cross-Device Access */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Official App Domain
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-semibold">
                    Production
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bookmark and access your study hub from any laptop, mobile browser, or campus computer.
                </p>
              </div>
            </div>

            {/* Quick URL actions */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleCopyDomain}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-xs"
              >
                {copiedDomain ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>

              <a
                href="https://focusforge.xyz"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors shadow-xs"
              >
                <span>Visit</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-400 dark:text-slate-500 text-[11px]">Primary Domain:</span>
              <span className="text-purple-600 dark:text-purple-400 font-bold tracking-wide">
                focusforge.xyz
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                HTTPS Enabled
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                PWA Ready
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Firebase Auth Compatible
              </span>
            </div>
          </div>
        </div>

        {/* Goals & Study Durations */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" />
            <span>Study Goals & Timer Durations</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily Goal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Daily Study Goal (Minutes)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="15"
                  max="720"
                  step="15"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white font-mono tabular-nums focus:outline-hidden focus:border-purple-500"
                />
                <span className="text-xs text-slate-400 font-mono shrink-0">
                  ({Math.floor(dailyGoal / 60)}h {dailyGoal % 60}m)
                </span>
              </div>
            </div>

            {/* Focus Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Focus Session Length (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={focusDuration}
                onChange={(e) => setFocusDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white font-mono tabular-nums focus:outline-hidden focus:border-purple-500"
              />
            </div>

            {/* Short Break */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Short Break Length (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={shortBreak}
                onChange={(e) => setShortBreak(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white font-mono tabular-nums focus:outline-hidden focus:border-purple-500"
              />
            </div>

            {/* Long Break */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Long Break Length (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={longBreak}
                onChange={(e) => setLongBreak(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white font-mono tabular-nums focus:outline-hidden focus:border-purple-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm shadow-purple-900/30 transition-all"
            >
              Save Timing Preferences
            </button>
          </div>
        </div>
      </form>

      {/* Interface & Notifications Section */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Visual Theme & Audio Feedback
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Theme Selector */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Visual Theme
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {settings.theme === 'dark' ? 'Dark Navy & Purple' : 'Crisp Clean Light'}
              </span>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => updateSettings({ theme: 'light' })}
                className={`p-1.5 rounded-md ${settings.theme === 'light' ? 'bg-white text-amber-500 shadow-xs' : 'text-slate-400'}`}
                title="Light mode"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`p-1.5 rounded-md ${settings.theme === 'dark' ? 'bg-slate-900 text-purple-400 shadow-xs' : 'text-slate-400'}`}
                title="Dark mode"
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sound Synthesizer */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Sound Chimes
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Play pleasant bell tones on completion
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => playCompletionChime()}
                className="px-2 py-1 text-[11px] text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/40 rounded transition-colors"
              >
                Test Sound
              </button>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Browser Desktop Notifications */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 sm:col-span-2">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Desktop Notifications
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Notify when a focus sprint or break countdown concludes.
              </span>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                settings.notificationsEnabled
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {settings.notificationsEnabled ? 'Enabled' : 'Enable Notifications'}
            </button>
          </div>
        </div>
      </div>

      {/* Data Management, Backups & Demo Data */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Data Management & Backups
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your tasks and session history are stored locally in your browser. Export backups to safeguard your progress or transfer between devices.
        </p>

        {importStatus && (
          <div
            className={`p-3 rounded-lg text-xs font-medium ${
              importStatus.isError
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-900'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-900'
            }`}
          >
            {importStatus.message}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {/* Export JSON */}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup (JSON)</span>
          </button>

          {/* Import JSON */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore Backup</span>
          </button>

          {/* Load Sample Demo Data */}
          <button
            onClick={() => {
              if (window.confirm('Load 7 days of realistic student demo data to preview charts & streak stats? This will add sample tasks and sessions.')) {
                loadSampleData();
                setImportStatus({ message: 'Sample student data loaded successfully!' });
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors border border-purple-200/80 dark:border-purple-800/60"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Load Sample Student Data</span>
          </button>

          {/* View Welcome Tour */}
          <button
            onClick={() => setOnboardingModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Welcome Guide</span>
          </button>

          {/* View Keyboard Shortcuts */}
          <button
            onClick={() => setShortcutsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
          >
            <Keyboard className="w-3.5 h-3.5 text-purple-500" />
            <span>Shortcuts</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">?</kbd>
          </button>
        </div>

        {/* Danger Zone: Reset All Data */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
              Reset Application Data
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Clear all tasks, sessions, and history stored in this browser.
            </span>
          </div>
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset All Data</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#0E1526] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Reset All FocusForge Data?
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              This will permanently delete all your study tasks, completed focus sessions, distraction logs, and streak statistics.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAllData();
                  setIsResetConfirmOpen(false);
                  setImportStatus({ message: 'All application data has been reset.' });
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-colors"
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
