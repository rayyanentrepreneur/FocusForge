import { FocusSession, Task, UserSettings } from '../types';

export const STORAGE_KEYS = {
  TASKS: 'focusforge_tasks_v1',
  SESSIONS: 'focusforge_sessions_v1',
  SETTINGS: 'focusforge_settings_v1',
  SUBJECTS: 'focusforge_subjects_v1',
  ACTIVE_TIMER: 'focusforge_active_timer_v1',
} as const;

export const DEFAULT_SUBJECTS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Literature',
  'Biology',
  'History',
  'General Study',
];

export const SUBJECT_COLORS: Record<string, string> = {
  'Computer Science': '#3B82F6', // Blue
  'Mathematics': '#8B5CF6',      // Purple
  'Physics': '#06B6D4',          // Cyan
  'Literature': '#EC4899',       // Pink
  'Biology': '#10B981',          // Emerald
  'History': '#F59E0B',          // Amber
  'General Study': '#64748B',    // Slate
};

export function getSubjectColor(subject: string): string {
  if (SUBJECT_COLORS[subject]) return SUBJECT_COLORS[subject];
  // Generate consistent color hash for custom subjects
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#6366F1', '#8B5CF6', '#3B82F6', '#0EA5E9', '#14B8A6', '#10B981', '#F59E0B', '#F97316'];
  return colors[Math.abs(hash) % colors.length];
}

export const DEFAULT_SETTINGS: UserSettings = {
  studentName: 'Alex',
  dailyGoalMinutes: 120,
  focusDurationMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  soundEnabled: true,
  notificationsEnabled: false,
  autoStartBreak: false,
  autoStartFocus: false,
  theme: 'dark',
  onboarded: false,
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Solve Linear Algebra Problem Set 4',
    subject: 'Mathematics',
    priority: 'high',
    estimatedDuration: 50,
    deadline: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'task-2',
    title: 'Read System Architecture Chapters 5 & 6',
    subject: 'Computer Science',
    priority: 'medium',
    estimatedDuration: 45,
    deadline: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'task-3',
    title: 'Review Electromagnetism Lecture Notes',
    subject: 'Physics',
    priority: 'low',
    estimatedDuration: 25,
    deadline: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    completed: true,
    completedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export function loadTasksFromStorage(): Task[] {
  if (typeof window === 'undefined') return INITIAL_TASKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_TASKS;
  } catch (err) {
    console.error('Failed to load tasks from localStorage', err);
    return INITIAL_TASKS;
  }
}

export function saveTasksToStorage(tasks: Task[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks', err);
  }
}

export function loadSessionsFromStorage(): FocusSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load sessions from localStorage', err);
    return [];
  }
}

export function saveSessionsToStorage(sessions: FocusSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to save sessions', err);
  }
}

export function loadSettingsFromStorage(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (err) {
    console.error('Failed to load settings', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettingsToStorage(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

export function loadSubjectsFromStorage(): string[] {
  if (typeof window === 'undefined') return DEFAULT_SUBJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
      return DEFAULT_SUBJECTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_SUBJECTS;
  } catch (err) {
    console.error('Failed to load subjects', err);
    return DEFAULT_SUBJECTS;
  }
}

export function saveSubjectsToStorage(subjects: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  } catch (err) {
    console.error('Failed to save subjects', err);
  }
}

/**
 * Creates realistic demo data spanning the last 7 days so students or evaluators
 * can immediately see the rich charts, streak calculations, and session history in action.
 */
export function generateDemoData(): { tasks: Task[]; sessions: FocusSession[] } {
  const now = new Date();
  const demoSessions: FocusSession[] = [];

  const demoSubjects = ['Mathematics', 'Computer Science', 'Physics', 'Literature'];
  const distractionNotes = [
    'Phone notification',
    'Social media urge',
    'Roommate entered room',
    'Checked email',
    'Lost train of thought',
    'Snack break craving',
  ];

  // Generate sessions across past 6 days + today
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const dayDate = new Date(now);
    dayDate.setDate(now.getDate() - daysAgo);

    // Number of sessions for this day (2 to 5 sessions)
    const sessionsToday = daysAgo === 0 ? 3 : (daysAgo % 2 === 0 ? 4 : 3);

    for (let s = 0; s < sessionsToday; s++) {
      const subject = demoSubjects[(daysAgo + s) % demoSubjects.length];
      const duration = 25;
      
      const sessionStart = new Date(dayDate);
      sessionStart.setHours(9 + s * 2, 15, 0, 0);
      const sessionEnd = new Date(sessionStart.getTime() + duration * 60000);

      const distractionCount = (s + daysAgo) % 3 === 0 ? 2 : ((s + daysAgo) % 2 === 0 ? 1 : 0);
      const distractions = [];
      for (let d = 0; d < distractionCount; d++) {
        distractions.push({
          id: `dist-${daysAgo}-${s}-${d}`,
          timestamp: new Date(sessionStart.getTime() + (d + 1) * 7 * 60000).toISOString(),
          note: distractionNotes[(daysAgo + s + d) % distractionNotes.length],
        });
      }

      demoSessions.push({
        id: `demo-session-${daysAgo}-${s}`,
        startTime: sessionStart.toISOString(),
        endTime: sessionEnd.toISOString(),
        durationMinutes: duration,
        subject,
        taskTitle: s === 0 ? `Study ${subject} Module ${s + 1}` : undefined,
        distractions,
        completed: true,
        mode: 'focus',
      });
    }
  }

  const demoTasks: Task[] = [
    {
      id: 'task-demo-1',
      title: 'Complete Discrete Mathematics Assignment 3',
      subject: 'Mathematics',
      priority: 'high',
      estimatedDuration: 50,
      deadline: new Date(now.getTime() + 86400000).toISOString().split('T')[0],
      completed: false,
      createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    },
    {
      id: 'task-demo-2',
      title: 'Build React Component for Portfolio Project',
      subject: 'Computer Science',
      priority: 'high',
      estimatedDuration: 75,
      deadline: new Date(now.getTime() + 86400000 * 3).toISOString().split('T')[0],
      completed: false,
      createdAt: new Date(now.getTime() - 86400000 * 3).toISOString(),
    },
    {
      id: 'task-demo-3',
      title: 'Read Thermodynamics Chapter 7: Entropy',
      subject: 'Physics',
      priority: 'medium',
      estimatedDuration: 30,
      deadline: new Date(now.getTime() + 86400000 * 4).toISOString().split('T')[0],
      completed: true,
      completedAt: new Date(now.getTime() - 3600000 * 2).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 4).toISOString(),
    },
    {
      id: 'task-demo-4',
      title: 'Draft Essay on Dystopian Fiction Themes',
      subject: 'Literature',
      priority: 'low',
      estimatedDuration: 45,
      deadline: new Date(now.getTime() + 86400000 * 6).toISOString().split('T')[0],
      completed: true,
      completedAt: new Date(now.getTime() - 86400000).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
    },
  ];

  return { tasks: demoTasks, sessions: demoSessions };
}

export function exportBackupData(): string {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: loadTasksFromStorage(),
    sessions: loadSessionsFromStorage(),
    settings: loadSettingsFromStorage(),
    subjects: loadSubjectsFromStorage(),
  };
  return JSON.stringify(data, null, 2);
}

export function validateAndImportBackup(jsonString: string): { success: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid JSON file format.' };
    }
    if (!Array.isArray(data.tasks) || !Array.isArray(data.sessions)) {
      return { success: false, error: 'Backup missing required tasks or sessions arrays.' };
    }

    saveTasksToStorage(data.tasks);
    saveSessionsToStorage(data.sessions);
    if (data.settings && typeof data.settings === 'object') {
      saveSettingsToStorage({ ...DEFAULT_SETTINGS, ...data.settings });
    }
    if (Array.isArray(data.subjects) && data.subjects.length > 0) {
      saveSubjectsToStorage(data.subjects);
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to parse JSON file.' };
  }
}

export function resetAllStorageData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.TASKS);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.SUBJECTS);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_TIMER);
}
