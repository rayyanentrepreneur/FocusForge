import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Lightbulb,
  Play,
  Plus,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  calculateStudyStreak,
  formatDateKey,
  formatMinutesReadable,
  generateRealInsights,
  getLast7DaysFocusRecords,
  getTodayCompletedSessionCount,
  getTodayFocusMinutes,
} from '../../utils/analytics';
import { getSubjectColor } from '../../utils/storage';

export const DashboardView: React.FC = () => {
  const {
    settings,
    tasks,
    sessions,
    toggleTask,
    setActiveTab,
    startTimerForTask,
    setQuickNewTaskModalOpen,
  } = useApp();

  const todayMinutes = getTodayFocusMinutes(sessions);
  const todaySessionsCount = getTodayCompletedSessionCount(sessions);
  const goalMinutes = settings.dailyGoalMinutes || 120;
  const goalPercent = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100));

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const { currentStreak } = calculateStudyStreak(sessions);

  const weeklyRecords = useMemo(
    () => getLast7DaysFocusRecords(sessions, goalMinutes),
    [sessions, goalMinutes]
  );

  const realInsights = useMemo(
    () => generateRealInsights(sessions, tasks, goalMinutes),
    [sessions, tasks, goalMinutes]
  );

  // Personalized Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = settings.studentName || 'Student';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 18) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Recent/Pending tasks to focus on today
  const pendingTasks = tasks.filter((t) => !t.completed).slice(0, 4);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Hero Welcome & Quick Start Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-purple-900/40 via-[#0E1526] to-[#090D16] border border-purple-900/40 dark:border-purple-800/40 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl z-10">
          <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
            {formattedDate}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {getGreeting()}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 mt-1.5 leading-relaxed">
            Build focus. Track progress. Get better every day. Ready for your next deep study sprint?
          </p>

          {/* Real Data Insights Strip */}
          {realInsights.length > 0 && (
            <div className="mt-4 flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300 bg-purple-100/60 dark:bg-purple-950/40 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800/40 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="font-medium">{realInsights[0]}</span>
            </div>
          )}
        </div>

        {/* Start Focus CTA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 z-10 shrink-0">
          <button
            onClick={() => setActiveTab('timer')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Focus Session</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Focus Time */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Today's Focus</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
            {formatMinutesReadable(todayMinutes)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-mono tabular-nums">
            Target: {formatMinutesReadable(goalMinutes)}
          </span>
        </div>

        {/* Focus Sessions Today */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Sessions Completed</span>
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
            {todaySessionsCount}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            {todaySessionsCount > 0 ? 'Logged today' : 'No sessions yet'}
          </span>
        </div>

        {/* Tasks Completed */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Tasks Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
            {completedTasks} <span className="text-xs font-normal text-slate-400">/ {totalTasks}</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-mono tabular-nums">
            {totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}% progress` : 'No tasks created'}
          </span>
        </div>

        {/* Current Study Streak */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Study Streak</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
            {currentStreak} <span className="text-xs font-normal text-slate-400">days</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            {currentStreak > 0 ? 'Consecutive days active' : 'Start session to begin'}
          </span>
        </div>
      </div>

      {/* Row 2: Daily Goal Progress Card + Weekly Focus Chart Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Study Goal Widget (1 col) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Daily Study Goal
              </span>
              <Target className="w-4 h-4 text-purple-500" />
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mb-2">
              {goalPercent}%
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              {todayMinutes >= goalMinutes
                ? '🎉 Congratulations! You have met your daily focus target.'
                : `You have completed ${formatMinutesReadable(todayMinutes)} of your ${formatMinutesReadable(goalMinutes)} goal.`}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
          </div>

          {/* Motivational Insights */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Productivity Notes</span>
            </div>
            {realInsights.map((insight, idx) => (
              <p key={idx} className="text-xs text-slate-600 dark:text-slate-400">
                {insight}
              </p>
            ))}
          </div>
        </div>

        {/* Weekly Focus Time Chart (2 cols) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Weekly Study Time
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Minutes focused per day over the last 7 days.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('analytics')}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>View full analytics</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyRecords} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 bg-slate-900 text-white rounded-lg border border-slate-800 shadow-xl text-xs">
                          <p className="font-semibold">{data.dayLabel} ({data.date})</p>
                          <p className="font-mono tabular-nums text-purple-400 mt-1">
                            Focus: {formatMinutesReadable(data.minutes)}
                          </p>
                          <p className="text-slate-400 text-[11px] font-mono tabular-nums">
                            {data.sessionsCount} session{data.sessionsCount === 1 ? '' : 's'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="minutes"
                  fill="#8B5CF6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Priority Study Tasks for Today */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Upcoming Study Tasks
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Check off completed items or click Focus to start a dedicated timer sprint.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuickNewTaskModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>All tasks ({totalTasks})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            {totalTasks > 0
              ? '🎉 All pending tasks completed! Great work.'
              : 'No tasks created yet. Plan your first study topic.'}
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task) => {
              const subjectColor = getSubjectColor(task.subject);
              return (
                <div
                  key={task.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/60 hover:border-purple-300 dark:hover:border-purple-800/60 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-700 hover:border-purple-500 flex items-center justify-center shrink-0 bg-white dark:bg-slate-900"
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3] text-purple-600" />}
                    </button>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-medium flex items-center gap-1" style={{ color: subjectColor }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subjectColor }} />
                          {task.subject}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{task.estimatedDuration}m</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => startTimerForTask(task)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg border border-purple-200/80 dark:border-purple-800/50 transition-colors shrink-0"
                  >
                    <Play className="w-3 h-3 fill-purple-600 dark:fill-purple-400" />
                    <span>Focus</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
