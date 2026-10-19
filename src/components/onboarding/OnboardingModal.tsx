import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Clock,
  Sparkles,
  Timer,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const OnboardingModal: React.FC = () => {
  const {
    onboardingModalOpen,
    setOnboardingModalOpen,
    updateSettings,
    setActiveTab,
    setQuickNewTaskModalOpen,
    loadSampleData,
  } = useApp();

  if (!onboardingModalOpen) return null;

  const handleDismiss = () => {
    updateSettings({ onboarded: true });
    setOnboardingModalOpen(false);
  };

  const handleCreateTask = () => {
    handleDismiss();
    setActiveTab('tasks');
    setQuickNewTaskModalOpen(true);
  };

  const handleStartSession = () => {
    handleDismiss();
    setActiveTab('timer');
  };

  const handleDemo = () => {
    loadSampleData();
    handleDismiss();
    setActiveTab('dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-xl bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Banner with gradient */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-purple-900/60 via-[#0B0F19] to-[#0E1526] border-b border-slate-200 dark:border-slate-800 text-center sm:text-left">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-400 flex items-center justify-center mb-3 shadow-inner">
            <Zap className="w-6 h-6 fill-purple-400" />
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Welcome to FocusForge
          </h2>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-md">
            Build focus. Track progress. Get better every day.
          </p>
        </div>

        {/* 3 Core Workflow Steps */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold mb-2">
                1
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                Plan Your Tasks
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Break homework and revision into actionable subjects with duration estimates.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold mb-2">
                2
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                Run Focus Sprints
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Launch 25-min Pomodoro sprints with background-safe countdowns and break pacing.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold mb-2">
                3
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                Tame Distractions
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Log urges and interruptions without guilt to build long-term focus endurance.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-300 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>
              <strong>100% Private & Local:</strong> No registration, passwords, or tracking. All data is saved right in your browser.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              onClick={handleDemo}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-800 order-2 sm:order-1"
            >
              Explore with Demo Data
            </button>
            <button
              onClick={handleCreateTask}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 order-3 sm:order-2"
            >
              Create First Task
            </button>
            <button
              onClick={handleStartSession}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg shadow-md shadow-purple-900/30 transition-all hover:scale-[1.02] order-1 sm:order-3"
            >
              Start Focus Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
