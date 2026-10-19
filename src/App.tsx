/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { TasksView } from './components/tasks/TasksView';
import { FocusTimerView } from './components/timer/FocusTimerView';
import { HistoryView } from './components/history/HistoryView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { TaskModal } from './components/tasks/TaskModal';
import { ShortcutsModal } from './components/common/ShortcutsModal';
import { AuthModal } from './components/auth/AuthModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const AppContent: React.FC = () => {
  const { activeTab, quickNewTaskModalOpen, setQuickNewTaskModalOpen } = useApp();

  // Initialize global keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar (Desktop left sidebar + mobile bottom nav) */}
      <Sidebar />

      {/* Main Viewport */}
      <div className="flex flex-col flex-1 h-screen min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Dynamic Main Content with scroll */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-8">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'tasks' && <TasksView />}
          {activeTab === 'timer' && <FocusTimerView />}
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Quick Add Task Modal */}
      <TaskModal
        isOpen={quickNewTaskModalOpen}
        onClose={() => setQuickNewTaskModalOpen(false)}
      />

      {/* Onboarding Welcome Guide */}
      <OnboardingModal />

      {/* Global Keyboard Shortcuts Guide Modal */}
      <ShortcutsModal />

      {/* Firebase Email/Password & Google Auth Modal */}
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
