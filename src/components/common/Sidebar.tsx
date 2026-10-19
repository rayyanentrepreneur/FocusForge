import {
  BarChart3,
  CheckSquare,
  History,
  Keyboard,
  LayoutDashboard,
  Settings,
  Sparkles,
  Timer,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatMinutesReadable, getTodayFocusMinutes } from '../../utils/analytics';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, sessions, tasks, settings, setShortcutsModalOpen } = useApp();

  const todayMinutes = getTodayFocusMinutes(sessions);
  const goalMinutes = settings.dailyGoalMinutes || 120;
  const goalProgress = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100));

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, shortcut: 'D' },
    { id: 'tasks' as const, label: 'My Tasks', icon: CheckSquare, badge: pendingTasksCount > 0 ? pendingTasksCount : undefined, shortcut: 'T' },
    { id: 'timer' as const, label: 'Focus Timer', icon: Timer, shortcut: 'S' },
    { id: 'history' as const, label: 'Session History', icon: History, shortcut: 'H' },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3, shortcut: 'A' },
    { id: 'settings' as const, label: 'Settings', icon: Settings, shortcut: ',' },
  ];

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B0F19] shrink-0 h-screen sticky top-0 z-30 select-none">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              Focus<span className="text-purple-600 dark:text-purple-400">Forge</span>
            </span>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 -mt-0.5 tracking-wider font-medium">
              STUDENT FOCUS TRACKER
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-sm border border-purple-200/60 dark:border-purple-800/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge !== undefined && (
                    <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      {item.badge}
                    </span>
                  )}
                  <kbd className="hidden lg:inline-block text-[10px] font-mono text-slate-400 dark:text-slate-500 opacity-60">
                    {item.shortcut}
                  </kbd>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Mini Progress Card */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                Daily Target
              </span>
              <span className="font-mono tabular-nums text-xs font-semibold text-slate-900 dark:text-white">
                {goalProgress}%
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${goalProgress}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 tabular-nums font-mono">
              <span>{formatMinutesReadable(todayMinutes)}</span>
              <span>/ {formatMinutesReadable(goalMinutes)}</span>
            </div>
          </div>

          {/* Quick Shortcuts Trigger */}
          <button
            onClick={() => setShortcutsModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span className="flex items-center gap-2 font-medium">
              <Keyboard className="w-3.5 h-3.5" />
              <span>Keyboard Shortcuts</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">?</kbd>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (visible only on mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 py-2 safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors relative ${
                isActive
                  ? 'text-purple-600 dark:text-purple-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">{item.label.split(' ')[0]}</span>
              {item.badge !== undefined && (
                <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-purple-500" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
