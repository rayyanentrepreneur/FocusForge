export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  subject: string;
  priority: Priority;
  estimatedDuration: number; // in minutes
  deadline?: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string; // ISO string
  createdAt: string; // ISO string
}

export interface Distraction {
  id: string;
  timestamp: string; // ISO string
  note?: string;
}

export type TimerMode = 'focus' | 'short_break' | 'long_break';

export interface FocusSession {
  id: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationMinutes: number;
  subject: string;
  taskId?: string;
  taskTitle?: string;
  distractions: Distraction[];
  completed: boolean;
  mode: TimerMode;
}

export interface UserSettings {
  studentName: string;
  dailyGoalMinutes: number;
  focusDurationMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number; // sessions before long break (default 4)
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoStartBreak: boolean;
  autoStartFocus: boolean;
  theme: 'dark' | 'light';
  onboarded: boolean;
}

export type TaskFilter = 'all' | 'pending' | 'completed' | 'high_priority';
export type TaskSort = 'deadline' | 'priority' | 'duration' | 'created';
export type HistoryFilter = 'all' | 'today' | 'week' | 'month';
export type ActiveTab = 'dashboard' | 'tasks' | 'timer' | 'history' | 'analytics' | 'settings';

export interface DailyFocusRecord {
  date: string; // YYYY-MM-DD
  dayLabel: string; // "Mon", "Tue", etc.
  minutes: number;
  sessionsCount: number;
  distractionsCount: number;
  goalMet: boolean;
}

export interface SubjectFocusStat {
  subject: string;
  minutes: number;
  sessionsCount: number;
  percentage: number;
  color: string;
}
