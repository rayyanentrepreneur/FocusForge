import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider, validateFirestoreConnection } from '../lib/firebase';
import {
  syncTaskToFirestore,
  deleteTaskFromFirestore,
  syncSessionToFirestore,
  deleteSessionFromFirestore,
  syncUserProfileToFirestore,
  syncSettingsToFirestore,
  subscribeToUserTasks,
  subscribeToUserSessions,
  flushSyncQueue,
  getStoredSyncQueue,
  SyncStatus,
} from '../services/firestoreSync';
import { ActiveTab, FocusSession, Task, UserSettings } from '../types';
import {
  exportBackupData,
  generateDemoData,
  loadSessionsFromStorage,
  loadSettingsFromStorage,
  loadSubjectsFromStorage,
  loadTasksFromStorage,
  resetAllStorageData,
  saveSessionsToStorage,
  saveSettingsToStorage,
  saveSubjectsToStorage,
  saveTasksToStorage,
  validateAndImportBackup,
} from '../utils/storage';

interface AppContextType {
  currentUser: User | null;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOutUser: () => Promise<void>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalTab: 'login' | 'signup';
  setAuthModalTab: (tab: 'login' | 'signup') => void;
  // Local-First Synchronization state
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingSyncCount: number;
  lastSyncedAt: Date | null;
  syncNow: () => Promise<void>;
  // Productivity Data
  tasks: Task[];
  sessions: FocusSession[];
  settings: UserSettings;
  subjects: string[];
  activeTab: ActiveTab;
  selectedTaskForTimer: Task | null;
  onboardingModalOpen: boolean;
  quickNewTaskModalOpen: boolean;
  shortcutsModalOpen: boolean;
  timerShortcutTrigger: { action: 'toggle' | 'reset' | 'distract' | 'start' | 'pause'; timestamp: number } | null;
  triggerTimerAction: (action: 'toggle' | 'reset' | 'distract' | 'start' | 'pause') => void;
  addTask: (data: { title: string; subject: string; priority: 'low' | 'medium' | 'high'; estimatedDuration: number; deadline?: string }) => Task;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  saveSession: (session: Omit<FocusSession, 'id'>) => FocusSession;
  deleteSession: (id: string) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  addSubject: (name: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
  startTimerForTask: (task: Task) => void;
  setSelectedTaskForTimer: (task: Task | null) => void;
  toggleTheme: () => void;
  resetAllData: () => void;
  importBackup: (json: string) => { success: boolean; error?: string };
  exportBackup: () => string;
  loadSampleData: () => void;
  setOnboardingModalOpen: (open: boolean) => void;
  setQuickNewTaskModalOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Network & Sync status
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getStoredSyncQueue().length);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());

  const [tasks, setTasks] = useState<Task[]>(() => loadTasksFromStorage());
  const [sessions, setSessions] = useState<FocusSession[]>(() => loadSessionsFromStorage());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettingsFromStorage());
  const [subjects, setSubjects] = useState<string[]>(() => loadSubjectsFromStorage());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedTaskForTimer, setSelectedTaskForTimer] = useState<Task | null>(null);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState<boolean>(false);
  const [quickNewTaskModalOpen, setQuickNewTaskModalOpen] = useState<boolean>(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');

  const [timerShortcutTrigger, setTimerShortcutTrigger] = useState<{
    action: 'toggle' | 'reset' | 'distract' | 'start' | 'pause';
    timestamp: number;
  } | null>(null);

  const triggerTimerAction = (action: 'toggle' | 'reset' | 'distract' | 'start' | 'pause') => {
    setTimerShortcutTrigger({ action, timestamp: Date.now() });
  };

  // Validate Firestore connection on boot
  useEffect(() => {
    validateFirestoreConnection();
  }, []);

  // Update pending queue count helper
  const refreshQueueCount = useCallback(() => {
    const count = getStoredSyncQueue().length;
    setPendingSyncCount(count);
    if (!navigator.onLine) {
      setSyncStatus('offline');
    } else if (count === 0 && syncStatus !== 'syncing') {
      setSyncStatus('synced');
    }
  }, [syncStatus]);

  // Flush offline queue when online
  const syncNow = useCallback(async () => {
    if (!currentUser) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');
    try {
      const res = await flushSyncQueue(currentUser.uid, (remaining) => {
        setPendingSyncCount(remaining);
      });
      if (res.success) {
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
        setPendingSyncCount(0);
      } else {
        setSyncStatus('error');
        setPendingSyncCount(getStoredSyncQueue().length);
      }
    } catch (e) {
      console.warn('SyncNow warning:', e);
      setSyncStatus('error');
    }
  }, [currentUser]);

  // Listen for online / offline events for automatic synchronization
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      if (currentUser) {
        syncNow();
      } else {
        setSyncStatus('synced');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check to process pending queue if back online
    const interval = setInterval(() => {
      if (navigator.onLine && currentUser && getStoredSyncQueue().length > 0) {
        syncNow();
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [currentUser, syncNow]);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        // Sync user profile to Firestore
        syncUserProfileToFirestore(
          user.uid,
          user.email || 'anonymous',
          user.displayName || undefined,
          settings.dailyGoalMinutes
        );
        // Also update local student name if default
        if (user.displayName && (!settings.studentName || settings.studentName === 'Alex')) {
          updateSettings({ studentName: user.displayName.split(' ')[0] });
        }
        // Flush any items that were queued while offline or logged out
        flushSyncQueue(user.uid, (remaining) => setPendingSyncCount(remaining)).then(() => {
          setLastSyncedAt(new Date());
          setSyncStatus(navigator.onLine ? 'synced' : 'offline');
        });
      } else {
        setSyncStatus('synced');
      }
    });

    return () => unsubscribe();
  }, [settings.dailyGoalMinutes]);

  // Real-time Firestore sync when authenticated
  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to tasks in Firestore
    const unsubTasks = subscribeToUserTasks(currentUser.uid, (firestoreTasks) => {
      if (firestoreTasks.length > 0) {
        handleSetTasks(firestoreTasks);
      }
    });

    // Subscribe to focus sessions in Firestore
    const unsubSessions = subscribeToUserSessions(currentUser.uid, (firestoreSessions) => {
      if (firestoreSessions.length > 0) {
        handleSetSessions(firestoreSessions);
      }
    });

    return () => {
      unsubTasks();
      unsubSessions();
    };
  }, [currentUser]);

  // Sync theme with document element
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [settings.theme]);

  // Check first-time onboarding
  useEffect(() => {
    if (!settings.onboarded) {
      setOnboardingModalOpen(true);
    }
  }, [settings.onboarded]);

  // Persist tasks
  const handleSetTasks = (newTasks: Task[] | ((prev: Task[]) => Task[])) => {
    setTasks((prev) => {
      const resolved = typeof newTasks === 'function' ? newTasks(prev) : newTasks;
      saveTasksToStorage(resolved);
      return resolved;
    });
  };

  // Persist sessions
  const handleSetSessions = (newSessions: FocusSession[] | ((prev: FocusSession[]) => FocusSession[])) => {
    setSessions((prev) => {
      const resolved = typeof newSessions === 'function' ? newSessions(prev) : newSessions;
      saveSessionsToStorage(resolved);
      return resolved;
    });
  };

  // Persist settings
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettingsToStorage(updated);
      if (currentUser) {
        syncSettingsToFirestore(currentUser.uid, updated).catch(() => {
          refreshQueueCount();
        });
      }
      return updated;
    });
  };

  // Persist subjects
  const addSubject = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || subjects.includes(trimmed)) return;
    const updated = [...subjects, trimmed];
    setSubjects(updated);
    saveSubjectsToStorage(updated);
  };

  const parseAuthError = (err: unknown): string => {
    if (err && typeof err === 'object' && 'code' in err) {
      const code = String((err as { code: string }).code);
      switch (code) {
        case 'auth/email-already-in-use':
          return 'An account with this email address already exists. Please sign in instead.';
        case 'auth/invalid-email':
          return 'Please enter a valid email address.';
        case 'auth/weak-password':
          return 'Password must be at least 6 characters.';
        case 'auth/user-not-found':
          return 'No account found with this email address. Please sign up first.';
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          return 'Incorrect email or password. Please verify your credentials.';
        case 'auth/operation-not-allowed':
          return 'Email/Password sign-in is not enabled in Firebase Console. Please enable Email/Password under Authentication > Sign-in method.';
        case 'auth/too-many-requests':
          return 'Too many failed attempts. Please wait a moment before trying again.';
        default:
          return (err as { message?: string }).message || 'Authentication error occurred.';
      }
    }
    return err instanceof Error ? err.message : 'Authentication error occurred.';
  };

  // Google Sign-in with Popup
  const signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      if (user) {
        const currentLocalTasks = loadTasksFromStorage();
        for (const t of currentLocalTasks) {
          await syncTaskToFirestore(user.uid, t);
        }
        const currentLocalSessions = loadSessionsFromStorage();
        for (const s of currentLocalSessions) {
          await syncSessionToFirestore(user.uid, s);
        }
        refreshQueueCount();
      }
    } catch (err) {
      console.error('Failed to sign in with Google', err);
      alert(parseAuthError(err));
    }
  };

  // Sign up with Email & Password
  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;

      if (displayName?.trim()) {
        try {
          await updateProfile(user, { displayName: displayName.trim() });
        } catch (e) {
          console.warn('Profile name update notice:', e);
        }
      }

      // Upload local tasks and sessions to Firestore for the newly registered user
      const currentLocalTasks = loadTasksFromStorage();
      for (const t of currentLocalTasks) {
        await syncTaskToFirestore(user.uid, t);
      }
      const currentLocalSessions = loadSessionsFromStorage();
      for (const s of currentLocalSessions) {
        await syncSessionToFirestore(user.uid, s);
      }

      // Sync user profile document
      await syncUserProfileToFirestore(
        user.uid,
        user.email || email,
        displayName || undefined,
        settings.dailyGoalMinutes
      );

      if (displayName?.trim()) {
        updateSettings({ studentName: displayName.trim() });
      }

      refreshQueueCount();
      return { success: true };
    } catch (err) {
      console.error('Failed to sign up with email', err);
      return { success: false, error: parseAuthError(err) };
    }
  };

  // Sign in with Email & Password
  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;

      if (user) {
        const currentLocalTasks = loadTasksFromStorage();
        for (const t of currentLocalTasks) {
          await syncTaskToFirestore(user.uid, t);
        }
        const currentLocalSessions = loadSessionsFromStorage();
        for (const s of currentLocalSessions) {
          await syncSessionToFirestore(user.uid, s);
        }
        refreshQueueCount();
      }

      return { success: true };
    } catch (err) {
      console.error('Failed to sign in with email', err);
      return { success: false, error: parseAuthError(err) };
    }
  };

  // Send Password Reset Email
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err) {
      console.error('Failed to send password reset email', err);
      return { success: false, error: parseAuthError(err) };
    }
  };

  // Sign out
  const signOutUser = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Failed to sign out', err);
    }
  };

  const addTask = (data: {
    title: string;
    subject: string;
    priority: 'low' | 'medium' | 'high';
    estimatedDuration: number;
    deadline?: string;
  }): Task => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: data.title.trim(),
      subject: data.subject.trim() || 'General Study',
      priority: data.priority,
      estimatedDuration: Number(data.estimatedDuration) || 25,
      deadline: data.deadline || undefined,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    handleSetTasks((prev) => [newTask, ...prev]);

    // Local-first sync to Firestore if authenticated (queues if offline)
    if (currentUser) {
      syncTaskToFirestore(currentUser.uid, newTask)
        .catch(console.error)
        .finally(() => refreshQueueCount());
    }

    if (newTask.subject && !subjects.includes(newTask.subject)) {
      addSubject(newTask.subject);
    }
    return newTask;
  };

  const updateTask = (updatedTask: Task) => {
    handleSetTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    if (selectedTaskForTimer?.id === updatedTask.id) {
      setSelectedTaskForTimer(updatedTask);
    }
    // Local-first sync to Firestore if authenticated
    if (currentUser) {
      syncTaskToFirestore(currentUser.uid, updatedTask)
        .catch(console.error)
        .finally(() => refreshQueueCount());
    }
  };

  const deleteTask = (id: string) => {
    handleSetTasks((prev) => prev.filter((t) => t.id !== id));
    if (selectedTaskForTimer?.id === id) {
      setSelectedTaskForTimer(null);
    }
    // Local-first sync deletion to Firestore
    if (currentUser) {
      deleteTaskFromFirestore(currentUser.uid, id)
        .catch(console.error)
        .finally(() => refreshQueueCount());
    }
  };

  const toggleTask = (id: string) => {
    handleSetTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          const updated: Task = {
            ...t,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
          if (currentUser) {
            syncTaskToFirestore(currentUser.uid, updated)
              .catch(console.error)
              .finally(() => refreshQueueCount());
          }
          return updated;
        }
        return t;
      })
    );
  };

  const saveSession = (sessionData: Omit<FocusSession, 'id'>): FocusSession => {
    const newSession: FocusSession = {
      ...sessionData,
      id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };

    handleSetSessions((prev) => [newSession, ...prev]);

    // Local-first sync to Firestore if authenticated
    if (currentUser) {
      syncSessionToFirestore(currentUser.uid, newSession)
        .catch(console.error)
        .finally(() => refreshQueueCount());
    }

    return newSession;
  };

  const deleteSession = (id: string) => {
    handleSetSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentUser) {
      deleteSessionFromFirestore(currentUser.uid, id)
        .catch(console.error)
        .finally(() => refreshQueueCount());
    }
  };

  const startTimerForTask = (task: Task) => {
    setSelectedTaskForTimer(task);
    setActiveTab('timer');
  };

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const resetAllData = () => {
    resetAllStorageData();
    setTasks([]);
    setSessions([]);
    const defaultSet = { ...loadSettingsFromStorage(), onboarded: true };
    setSettings(defaultSet);
    setSubjects(loadSubjectsFromStorage());
    setSelectedTaskForTimer(null);
  };

  const importBackup = (json: string) => {
    const res = validateAndImportBackup(json);
    if (res.success) {
      const importedTasks = loadTasksFromStorage();
      const importedSessions = loadSessionsFromStorage();
      setTasks(importedTasks);
      setSessions(importedSessions);
      setSettings(loadSettingsFromStorage());
      setSubjects(loadSubjectsFromStorage());

      if (currentUser) {
        importedTasks.forEach((t) => syncTaskToFirestore(currentUser.uid, t));
        importedSessions.forEach((s) => syncSessionToFirestore(currentUser.uid, s));
        refreshQueueCount();
      }
    }
    return res;
  };

  const exportBackup = () => {
    return exportBackupData();
  };

  const loadSampleData = () => {
    const demo = generateDemoData();
    handleSetTasks(demo.tasks);
    handleSetSessions(demo.sessions);
    updateSettings({ onboarded: true });

    if (currentUser) {
      demo.tasks.forEach((t) => syncTaskToFirestore(currentUser.uid, t));
      demo.sessions.forEach((s) => syncSessionToFirestore(currentUser.uid, s));
      refreshQueueCount();
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        authLoading,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        resetPassword,
        signOutUser,
        authModalOpen,
        setAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        isOnline,
        syncStatus,
        pendingSyncCount,
        lastSyncedAt,
        syncNow,
        tasks,
        sessions,
        settings,
        subjects,
        activeTab,
        selectedTaskForTimer,
        onboardingModalOpen,
        quickNewTaskModalOpen,
        shortcutsModalOpen,
        timerShortcutTrigger,
        triggerTimerAction,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        saveSession,
        deleteSession,
        updateSettings,
        addSubject,
        setActiveTab,
        startTimerForTask,
        setSelectedTaskForTimer,
        toggleTheme,
        resetAllData,
        importBackup,
        exportBackup,
        loadSampleData,
        setOnboardingModalOpen,
        setQuickNewTaskModalOpen,
        setShortcutsModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
