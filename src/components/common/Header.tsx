import React, { useState } from 'react';
import {
  Flame,
  Moon,
  Plus,
  Sun,
  Play,
  Keyboard,
  Cloud,
  CloudOff,
  RefreshCw,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  WifiOff,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateStudyStreak } from '../../utils/analytics';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    settings,
    toggleTheme,
    sessions,
    setQuickNewTaskModalOpen,
    setShortcutsModalOpen,
    currentUser,
    signOutUser,
    setAuthModalOpen,
    setAuthModalTab,
    isOnline,
    syncStatus,
    pendingSyncCount,
    lastSyncedAt,
    syncNow,
  } = useApp();

  const [syncMenuOpen, setSyncMenuOpen] = useState(false);
  const [manualSyncing, setManualSyncing] = useState(false);

  const { currentStreak } = calculateStudyStreak(sessions);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'tasks':
        return 'My Tasks';
      case 'timer':
        return 'Focus Timer';
      case 'history':
        return 'Session History';
      case 'analytics':
        return 'Analytics & Insights';
      case 'settings':
        return 'Settings & Data';
      default:
        return 'FocusForge';
    }
  };

  const handleManualSync = async () => {
    setManualSyncing(true);
    try {
      await syncNow();
    } finally {
      setManualSyncing(false);
    }
  };

  const formatLastSync = () => {
    if (!lastSyncedAt) return 'Never';
    const diffSec = Math.floor((Date.now() - lastSyncedAt.getTime()) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>Offline Mode Active:</strong> All task updates and study sessions are saved locally and will automatically sync to Firestore when connection is restored.
            </span>
          </div>
          {pendingSyncCount > 0 && (
            <span className="font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px]">
              {pendingSyncCount} change{pendingSyncCount === 1 ? '' : 's'} queued
            </span>
          )}
        </div>
      )}

      <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
        {/* Zone 1: Current Breadcrumb & Wordmark */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-900 dark:text-white truncate">
              {getPageTitle()}
            </span>
            <span className="text-slate-400 dark:text-slate-600 hidden sm:inline" aria-hidden="true">
              /
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              FocusForge
            </span>
          </div>
        </div>

        {/* Zone 2: Streak Indicator & Quick Stats */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentStreak > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span className="tabular-nums font-mono font-semibold">{currentStreak}</span>
              <span className="hidden sm:inline">day streak</span>
            </div>
          )}

          {/* Sync Status Badge (Interactive dropdown for logged in, or info for guest) */}
          <div className="relative">
            {currentUser ? (
              <button
                onClick={() => setSyncMenuOpen(!syncMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  !isOnline
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 text-amber-700 dark:text-amber-300'
                    : syncStatus === 'syncing' || manualSyncing
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800/60 text-purple-700 dark:text-purple-300'
                    : pendingSyncCount > 0
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800/60 text-blue-700 dark:text-blue-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
                }`}
                title="Cloud Sync Status"
              >
                {!isOnline ? (
                  <>
                    <CloudOff className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">Offline</span>
                    {pendingSyncCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900/60 font-mono text-[10px]">
                        {pendingSyncCount}
                      </span>
                    )}
                  </>
                ) : syncStatus === 'syncing' || manualSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-purple-500 animate-spin" />
                    <span className="hidden sm:inline">Syncing...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="hidden sm:inline">Synced</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthModalTab('login');
                  setAuthModalOpen(true);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Stored locally in browser. Sign in to sync across devices."
              >
                <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Local Only</span>
              </button>
            )}

            {/* Sync Menu Dropdown Popover */}
            {syncMenuOpen && currentUser && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setSyncMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-white">Firestore Sync Engine</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        isOnline
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-slate-600 dark:text-slate-400 mb-3">
                    <div className="flex justify-between">
                      <span>Account:</span>
                      <span className="font-mono text-slate-900 dark:text-white truncate max-w-[140px]">
                        {currentUser.email || currentUser.displayName || 'User'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Queue Status:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {pendingSyncCount === 0
                          ? 'All changes uploaded'
                          : `${pendingSyncCount} action(s) waiting`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last sync:</span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        {formatLastSync()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleManualSync}
                    disabled={!isOnline || manualSyncing}
                    className="w-full py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${manualSyncing ? 'animate-spin' : ''}`} />
                    <span>{manualSyncing ? 'Synchronizing...' : 'Sync Now'}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Keyboard Shortcuts Guide Button */}
          <button
            onClick={() => setShortcutsModalOpen(true)}
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors hidden sm:inline-flex items-center gap-1.5 text-xs font-medium"
          >
            <Keyboard className="w-4 h-4" />
            <kbd className="text-[10px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 font-mono text-slate-500 dark:text-slate-400">
              ?
            </kbd>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Firebase Authentication Cloud Profile */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 pl-1">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[80px] truncate hidden md:inline">
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
              <button
                onClick={signOutUser}
                title="Sign out of FocusForge"
                className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthModalTab('login');
                setAuthModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors border border-purple-200/80 dark:border-purple-800/50"
              title="Sign in with Email or Google to sync data"
            >
              <LogIn className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Sign In</span>
            </button>
          )}

          {/* Quick Add Task */}
          <button
            onClick={() => setQuickNewTaskModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-lg transition-colors border border-slate-200 dark:border-slate-700/50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
            <kbd className="text-[10px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 font-mono text-slate-500 dark:text-slate-300">
              N
            </kbd>
          </button>

          {/* Zone 3: Primary Action Button */}
          {activeTab !== 'timer' && (
            <button
              onClick={() => setActiveTab('timer')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg shadow-xs shadow-purple-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Focus</span>
              <kbd className="text-[10px] px-1 py-0.2 rounded bg-white/20 text-white/90 font-mono hidden md:inline">
                S
              </kbd>
            </button>
          )}
        </div>
      </header>
    </>
  );
};
