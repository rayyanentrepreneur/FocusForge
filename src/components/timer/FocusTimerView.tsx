import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  AlertTriangle,
  CheckCircle2,
  Coffee,
  Flame,
  ListPlus,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { Distraction, FocusSession, Task, TimerMode } from '../../types';
import { useApp } from '../../context/AppContext';
import { playCompletionChime, playDistractionTone, playPauseTone, playStartTone } from '../../utils/sound';
import { sendBrowserNotification } from '../../utils/notifications';
import { getSubjectColor } from '../../utils/storage';

export const FocusTimerView: React.FC = () => {
  const {
    settings,
    updateSettings,
    subjects,
    tasks,
    selectedTaskForTimer,
    setSelectedTaskForTimer,
    saveSession,
    toggleTask,
    timerShortcutTrigger,
  } = useApp();

  // Timer Configuration
  const [mode, setMode] = useState<TimerMode>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Time in milliseconds
  const getModeDurationMs = useCallback((m: TimerMode) => {
    switch (m) {
      case 'focus':
        return (settings.focusDurationMinutes || 25) * 60 * 1000;
      case 'short_break':
        return (settings.shortBreakMinutes || 5) * 60 * 1000;
      case 'long_break':
        return (settings.longBreakMinutes || 15) * 60 * 1000;
    }
  }, [settings.focusDurationMinutes, settings.shortBreakMinutes, settings.longBreakMinutes]);

  const [remainingMs, setRemainingMs] = useState<number>(() => getModeDurationMs('focus'));
  const [totalMs, setTotalMs] = useState<number>(() => getModeDurationMs('focus'));

  // Session metadata
  const [selectedSubject, setSelectedSubject] = useState<string>(
    selectedTaskForTimer ? selectedTaskForTimer.subject : subjects[0] || 'General Study'
  );
  const [linkedTaskId, setLinkedTaskId] = useState<string>(selectedTaskForTimer?.id || '');

  // Distraction tracking
  const [distractions, setDistractions] = useState<Distraction[]>([]);
  const [isDistractionModalOpen, setIsDistractionModalOpen] = useState(false);
  const [customDistractionNote, setCustomDistractionNote] = useState('');

  // Session start timestamp for calculating actual completed duration
  const sessionStartTimeRef = useRef<string | null>(null);
  const targetEndTimeRef = useRef<number | null>(null);

  // Completed session celebration banner
  const [completedCelebration, setCompletedCelebration] = useState<{
    show: boolean;
    duration: number;
    mode: TimerMode;
  }>({ show: false, duration: 0, mode: 'focus' });

  // Sync selected task when changed from external tabs
  useEffect(() => {
    if (selectedTaskForTimer) {
      setLinkedTaskId(selectedTaskForTimer.id);
      setSelectedSubject(selectedTaskForTimer.subject);
    }
  }, [selectedTaskForTimer]);

  // When timer mode changes (e.g. user toggles focus vs break tabs), reset countdown if not active
  useEffect(() => {
    if (!isRunning && !isPaused) {
      const ms = getModeDurationMs(mode);
      setRemainingMs(ms);
      setTotalMs(ms);
    }
  }, [mode, getModeDurationMs, isRunning, isPaused]);

  // Reliable timestamp-based timer ticker
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isRunning && !isPaused && targetEndTimeRef.current !== null) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, targetEndTimeRef.current! - now);
        setRemainingMs(diff);

        if (diff <= 0) {
          // Finished timer
          handleSessionCompletion();
        }
      }, 250);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, isPaused]);

  // Sync tab title with timer countdown
  useEffect(() => {
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (isRunning && !isPaused) {
      document.title = `(${timeFormatted}) ${mode === 'focus' ? '🎯 Focus' : '☕ Break'} — FocusForge`;
    } else if (isPaused) {
      document.title = `(Paused) FocusForge`;
    } else {
      document.title = `FocusForge — Student Focus & Study Tracker`;
    }

    return () => {
      document.title = `FocusForge — Student Focus & Study Tracker`;
    };
  }, [remainingMs, isRunning, isPaused, mode]);

  // Switch timer mode cleanly
  const switchMode = (newMode: TimerMode) => {
    if (isRunning && !window.confirm('Active session in progress. Switch mode and discard current timer?')) {
      return;
    }
    setIsRunning(false);
    setIsPaused(false);
    targetEndTimeRef.current = null;
    sessionStartTimeRef.current = null;
    setDistractions([]);
    setMode(newMode);
    const ms = getModeDurationMs(newMode);
    setRemainingMs(ms);
    setTotalMs(ms);
  };

  // Start Timer
  const handleStart = useCallback(() => {
    if (settings.soundEnabled) {
      playStartTone();
    }
    const now = Date.now();
    targetEndTimeRef.current = now + remainingMs;
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date(now).toISOString();
    }
    setIsRunning(true);
    setIsPaused(false);
  }, [remainingMs, settings.soundEnabled]);

  // Pause Timer
  const handlePause = useCallback(() => {
    if (settings.soundEnabled) {
      playPauseTone();
    }
    if (targetEndTimeRef.current !== null) {
      const now = Date.now();
      const left = Math.max(0, targetEndTimeRef.current - now);
      setRemainingMs(left);
      targetEndTimeRef.current = null;
    }
    setIsPaused(true);
  }, [settings.soundEnabled]);

  // Resume Timer
  const handleResume = useCallback(() => {
    if (settings.soundEnabled) {
      playStartTone();
    }
    const now = Date.now();
    targetEndTimeRef.current = now + remainingMs;
    setIsPaused(false);
  }, [remainingMs, settings.soundEnabled]);

  // Reset Timer
  const handleReset = useCallback(() => {
    if (isRunning && !window.confirm('Reset this timer and cancel current session?')) {
      return;
    }
    setIsRunning(false);
    setIsPaused(false);
    targetEndTimeRef.current = null;
    sessionStartTimeRef.current = null;
    setDistractions([]);
    const ms = getModeDurationMs(mode);
    setRemainingMs(ms);
    setTotalMs(ms);
  }, [isRunning, getModeDurationMs, mode]);

  // Handle keyboard shortcut actions dispatched from global shortcuts
  const lastProcessedTriggerRef = useRef<number>(0);
  useEffect(() => {
    if (!timerShortcutTrigger || timerShortcutTrigger.timestamp === lastProcessedTriggerRef.current) {
      return;
    }
    lastProcessedTriggerRef.current = timerShortcutTrigger.timestamp;

    if (timerShortcutTrigger.action === 'toggle') {
      if (isRunning && !isPaused) {
        handlePause();
      } else if (isPaused) {
        handleResume();
      } else {
        handleStart();
      }
    } else if (timerShortcutTrigger.action === 'start') {
      if (!isRunning) {
        handleStart();
      } else if (isPaused) {
        handleResume();
      }
    } else if (timerShortcutTrigger.action === 'pause') {
      if (isRunning && !isPaused) {
        handlePause();
      }
    } else if (timerShortcutTrigger.action === 'reset') {
      handleReset();
    } else if (timerShortcutTrigger.action === 'distract') {
      setIsDistractionModalOpen(true);
    }
  }, [timerShortcutTrigger, isRunning, isPaused, handleStart, handlePause, handleResume, handleReset]);

  // Log distraction
  const handleRecordDistraction = (note?: string) => {
    if (settings.soundEnabled) {
      playDistractionTone();
    }
    const newDistraction: Distraction = {
      id: `dist-${Date.now()}`,
      timestamp: new Date().toISOString(),
      note: note || undefined,
    };
    setDistractions((prev) => [...prev, newDistraction]);
    setIsDistractionModalOpen(false);
    setCustomDistractionNote('');
  };

  // Complete session handler
  const handleSessionCompletion = () => {
    setIsRunning(false);
    setIsPaused(false);
    targetEndTimeRef.current = null;

    const sessionDurationMinutes = Math.round(totalMs / 60000);

    // ONLY focus sessions count as study time (breaks are excluded per specs)
    if (mode === 'focus') {
      const currentTask = tasks.find((t) => t.id === linkedTaskId);
      const startTime = sessionStartTimeRef.current || new Date(Date.now() - totalMs).toISOString();

      saveSession({
        startTime,
        endTime: new Date().toISOString(),
        durationMinutes: sessionDurationMinutes,
        subject: selectedSubject,
        taskId: linkedTaskId || undefined,
        taskTitle: currentTask?.title || undefined,
        distractions,
        completed: true,
        mode: 'focus',
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'],
        });
      } catch {
        // Safe fallback
      }

      // Audio notification
      if (settings.soundEnabled) {
        playCompletionChime();
      }

      // Browser push notification
      if (settings.notificationsEnabled) {
        sendBrowserNotification(
          '🎉 Focus Session Finished!',
          `Great work! You logged ${sessionDurationMinutes} minutes of focused study in ${selectedSubject}.`
        );
      }

      // Show banner
      setCompletedCelebration({
        show: true,
        duration: sessionDurationMinutes,
        mode: 'focus',
      });
    } else {
      // Break session finished
      if (settings.soundEnabled) {
        playCompletionChime();
      }
      if (settings.notificationsEnabled) {
        sendBrowserNotification(
          '☕ Break Finished!',
          'Your break is complete. Ready to resume your focus sprint?'
        );
      }
      setCompletedCelebration({
        show: true,
        duration: Math.round(totalMs / 60000),
        mode,
      });
    }

    // Reset session refs
    sessionStartTimeRef.current = null;
    setDistractions([]);

    // Automatically prompt next mode
    if (mode === 'focus') {
      setMode('short_break');
      const breakMs = getModeDurationMs('short_break');
      setRemainingMs(breakMs);
      setTotalMs(breakMs);
    } else {
      setMode('focus');
      const focusMs = getModeDurationMs('focus');
      setRemainingMs(focusMs);
      setTotalMs(focusMs);
    }
  };

  // Early finish (student wraps up task early after meaningful time)
  const handleFinishEarlyAndLog = () => {
    if (!isRunning && !isPaused) return;
    const elapsedMs = totalMs - remainingMs;
    const elapsedMinutes = Math.round(elapsedMs / 60000);

    if (elapsedMinutes < 1) {
      alert('Session must be at least 1 minute long to log.');
      return;
    }

    if (window.confirm(`Wrap up session early and log ${elapsedMinutes} minutes of focus time?`)) {
      setIsRunning(false);
      setIsPaused(false);
      targetEndTimeRef.current = null;

      if (mode === 'focus') {
        const currentTask = tasks.find((t) => t.id === linkedTaskId);
        saveSession({
          startTime: sessionStartTimeRef.current || new Date(Date.now() - elapsedMs).toISOString(),
          endTime: new Date().toISOString(),
          durationMinutes: elapsedMinutes,
          subject: selectedSubject,
          taskId: linkedTaskId || undefined,
          taskTitle: currentTask?.title || undefined,
          distractions,
          completed: true,
          mode: 'focus',
        });

        if (settings.soundEnabled) playCompletionChime();
        setCompletedCelebration({
          show: true,
          duration: elapsedMinutes,
          mode: 'focus',
        });
      }

      sessionStartTimeRef.current = null;
      setDistractions([]);
      const ms = getModeDurationMs(mode);
      setRemainingMs(ms);
      setTotalMs(ms);
    }
  };

  // Circular progress calculations
  const progressRatio = totalMs > 0 ? (totalMs - remainingMs) / totalMs : 0;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const minutesDisplay = Math.floor(remainingMs / 60000);
  const secondsDisplay = Math.floor((remainingMs % 60000) / 1000);

  const linkedTask = tasks.find((t) => t.id === linkedTaskId);
  const pendingTasks = tasks.filter((t) => !t.completed);

  const quickDistractionOptions = [
    'Phone notification',
    'Social media urge',
    'Roommate / Family',
    'Daydreaming / Mind wandered',
    'Checked email',
    'Snack / Water craving',
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Celebration Notification Banner */}
      {completedCelebration.show && (
        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 shadow-md flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {completedCelebration.mode === 'focus'
                  ? 'Awesome Focus Session Logged!'
                  : 'Break Completed!'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {completedCelebration.mode === 'focus'
                  ? `Recorded ${completedCelebration.duration} minutes of high-focus study. Streak and analytics updated!`
                  : `Well rested! Take a deep breath and start your next study block.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCompletedCelebration({ show: false, duration: 0, mode: 'focus' })}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mode Segmented Bar */}
      <div className="flex justify-center">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => switchMode('focus')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'focus'
                ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Focus ({settings.focusDurationMinutes || 25}m)</span>
          </button>

          <button
            onClick={() => switchMode('short_break')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'short_break'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Short Break ({settings.shortBreakMinutes || 5}m)</span>
          </button>

          <button
            onClick={() => switchMode('long_break')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'long_break'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Long Break ({settings.longBreakMinutes || 15}m)</span>
          </button>
        </div>
      </div>

      {/* Main Timer Display Card */}
      <div className="p-6 sm:p-10 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-md text-center flex flex-col items-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 ${
            mode === 'focus' ? 'bg-purple-600' : 'bg-blue-600'
          }`}
        />

        {/* Linked Task & Subject Selector Header */}
        <div className="w-full max-w-md mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Subject Selector */}
          <div className="w-full sm:w-auto flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isRunning}
              className="flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden cursor-pointer disabled:opacity-70"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Linked Task Selector */}
          <div className="w-full sm:w-auto flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Task:</span>
            <select
              value={linkedTaskId}
              onChange={(e) => {
                const id = e.target.value;
                setLinkedTaskId(id);
                const t = tasks.find((task) => task.id === id);
                if (t) {
                  setSelectedSubject(t.subject);
                  setSelectedTaskForTimer(t);
                } else {
                  setSelectedTaskForTimer(null);
                }
              }}
              disabled={isRunning}
              className="flex-1 sm:w-48 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden cursor-pointer truncate disabled:opacity-70"
            >
              <option value="">(No task linked)</option>
              {pendingTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Circular SVG Timer with Large MM:SS Display */}
        <div className="relative my-4 flex items-center justify-center">
          <svg className="w-68 h-68 sm:w-80 sm:h-80 -rotate-90">
            {/* Background ring */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className="text-slate-100 dark:text-slate-800/80 stroke-current"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Animated progress ring */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className={`stroke-current transition-all duration-300 ${
                mode === 'focus' ? 'text-purple-600 dark:text-purple-500' : 'text-blue-500'
              }`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center Info Overlay */}
          <div className="absolute flex flex-col items-center justify-center">
            {/* Status indicator */}
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
              {isRunning && !isPaused ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{mode === 'focus' ? 'Deep Focus' : 'Taking Break'}</span>
                </>
              ) : isPaused ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Paused</span>
                </>
              ) : (
                <span>Ready to start</span>
              )}
            </div>

            {/* Huge Tabular Clock Numbers */}
            <div className="text-5xl sm:text-6xl font-extrabold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
              {String(minutesDisplay).padStart(2, '0')}:{String(secondsDisplay).padStart(2, '0')}
            </div>

            {/* Linked Task Tag or Subject */}
            {linkedTask ? (
              <div className="mt-2 max-w-[200px] truncate text-xs text-purple-600 dark:text-purple-400 font-medium">
                🎯 {linkedTask.title}
              </div>
            ) : (
              <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 font-medium">
                {selectedSubject}
              </div>
            )}
          </div>
        </div>

        {/* Primary Timer Controls */}
        <div className="flex items-center gap-3 mt-4">
          {!isRunning || isPaused ? (
            <button
              onClick={isPaused ? handleResume : handleStart}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isPaused ? 'Resume Focus' : 'Start Focus'}</span>
              <kbd className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-white/25 text-white/90 font-mono uppercase tracking-wider hidden sm:inline">Space</kbd>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Pause className="w-4 h-4" />
              <span>Pause Session</span>
              <kbd className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono uppercase tracking-wider hidden sm:inline">Space</kbd>
            </button>
          )}

          {/* Reset button */}
          <button
            onClick={handleReset}
            disabled={!isRunning && remainingMs === totalMs}
            className="p-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors disabled:opacity-40"
            title="Reset timer (R)"
            aria-label="Reset timer (R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Secondary Actions: Finish Early & Sound Toggle */}
        <div className="flex items-center gap-4 mt-6 text-xs text-slate-500 dark:text-slate-400">
          {(isRunning || isPaused) && (
            <button
              onClick={handleFinishEarlyAndLog}
              className="hover:text-purple-600 dark:hover:text-purple-400 underline underline-offset-2 transition-colors"
            >
              Finish early & log study time
            </button>
          )}
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {settings.soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-purple-500" />
                <span>Sound on</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Sound muted</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Distraction Tracker Section */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Distraction Logger
              </h2>
              {distractions.length > 0 && (
                <span className="font-mono text-xs tabular-nums px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-200/60 dark:border-amber-500/20">
                  {distractions.length} recorded
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Felt an urge to check your phone or wander off? Acknowledge it instantly without breaking your timer.
            </p>
          </div>

          {/* The Prominent "I Got Distracted" Button */}
          <button
            onClick={() => setIsDistractionModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200/80 dark:border-amber-800/50 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>I got distracted</span>
            <kbd className="text-[10px] ml-0.5 px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 font-mono font-bold text-amber-800 dark:text-amber-200 hidden sm:inline">X</kbd>
          </button>
        </div>

        {/* Distraction Log List for current session */}
        {distractions.length > 0 ? (
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            {distractions.map((d, idx) => (
              <div
                key={d.id}
                className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono tabular-nums text-slate-400">#{idx + 1}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {d.note || 'Unspecified distraction'}
                  </span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-slate-400">
                  {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2 text-xs text-slate-400 dark:text-slate-500 italic">
            Zero distractions logged for this session. Great flow!
          </div>
        )}
      </div>

      {/* Distraction Modal / Quick Logger */}
      {isDistractionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  What distracted you?
                </h3>
              </div>
              <button
                onClick={() => setIsDistractionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Choose a quick reason or type a note. Acknowledging distractions trains focus endurance.
            </p>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {quickDistractionOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleRecordDistraction(opt)}
                  className="px-2.5 py-1 text-xs rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-950/60 dark:hover:text-purple-300 transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Or custom note (optional)..."
                value={customDistractionNote}
                onChange={(e) => setCustomDistractionNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRecordDistraction(customDistractionNote || 'Quick distraction');
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-purple-500"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => handleRecordDistraction('Quick distraction')}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Skip Note
                </button>
                <button
                  onClick={() => handleRecordDistraction(customDistractionNote || 'Quick distraction')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors"
                >
                  Log Distraction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
