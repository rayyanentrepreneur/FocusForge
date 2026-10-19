import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { FocusSession, Task, UserSettings } from '../types';
import { db, handleFirestoreError, OperationType } from './config';

export type SyncActionType =
  | 'UPSERT_TASK'
  | 'DELETE_TASK'
  | 'UPSERT_SESSION'
  | 'DELETE_SESSION'
  | 'UPDATE_SETTINGS';

export interface SyncQueueItem {
  id: string;
  timestamp: number;
  type: SyncActionType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

const QUEUE_STORAGE_KEY = 'focusforge_offline_sync_queue_v1';

// Read queue from LocalStorage
export function getStoredSyncQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse sync queue from localStorage:', e);
    return [];
  }
}

// Persist queue to LocalStorage
export function saveSyncQueue(queue: SyncQueueItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save sync queue:', e);
  }
}

// Add item to offline queue
export function enqueueSyncAction(type: SyncActionType, payload: unknown): SyncQueueItem {
  const item: SyncQueueItem = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    type,
    payload,
  };
  const queue = getStoredSyncQueue();
  queue.push(item);
  saveSyncQueue(queue);
  return item;
}

// Clear or update queue
export function removeQueueItems(idsToRemove: string[]): void {
  const set = new Set(idsToRemove);
  const queue = getStoredSyncQueue().filter((item) => !set.has(item.id));
  saveSyncQueue(queue);
}

// Push a single action to Firestore directly
export async function applyActionToFirestore(userId: string, action: SyncQueueItem): Promise<void> {
  const { type, payload } = action;

  switch (type) {
    case 'UPSERT_TASK': {
      const task: Task = payload;
      const path = `users/${userId}/tasks/${task.id}`;
      try {
        const taskDoc = doc(db, 'users', userId, 'tasks', task.id);
        const taskPayload = {
          id: task.id,
          userId,
          title: task.title,
          subject: task.subject,
          priority: task.priority,
          estimatedDuration: Number(task.estimatedDuration),
          completed: Boolean(task.completed),
          createdAt: task.createdAt,
          ...(task.deadline ? { deadline: task.deadline } : {}),
          ...(task.completedAt ? { completedAt: task.completedAt } : {}),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(taskDoc, taskPayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      break;
    }

    case 'DELETE_TASK': {
      const taskId: string = typeof payload === 'string' ? payload : payload.id;
      const path = `users/${userId}/tasks/${taskId}`;
      try {
        const taskDoc = doc(db, 'users', userId, 'tasks', taskId);
        await deleteDoc(taskDoc);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
      break;
    }

    case 'UPSERT_SESSION': {
      const session: FocusSession = payload;
      const path = `users/${userId}/sessions/${session.id}`;
      try {
        const sessionDoc = doc(db, 'users', userId, 'sessions', session.id);
        const sessionPayload = {
          id: session.id,
          userId,
          startTime: session.startTime,
          endTime: session.endTime,
          durationMinutes: Number(session.durationMinutes),
          subject: session.subject,
          completed: Boolean(session.completed),
          mode: session.mode,
          ...(session.taskId ? { taskId: session.taskId } : {}),
          ...(session.taskTitle ? { taskTitle: session.taskTitle } : {}),
          distractions: Array.isArray(session.distractions) ? session.distractions.slice(0, 50) : [],
        };
        await setDoc(sessionDoc, sessionPayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      break;
    }

    case 'DELETE_SESSION': {
      const sessionId: string = typeof payload === 'string' ? payload : payload.id;
      const path = `users/${userId}/sessions/${sessionId}`;
      try {
        const sessionDoc = doc(db, 'users', userId, 'sessions', sessionId);
        await deleteDoc(sessionDoc);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
      break;
    }

    case 'UPDATE_SETTINGS': {
      const settings: UserSettings = payload;
      const path = `users/${userId}/settings/preferences`;
      try {
        const settingsDoc = doc(db, 'users', userId, 'settings', 'preferences');
        const settingsPayload = {
          userId,
          studentName: settings.studentName,
          dailyGoalMinutes: Number(settings.dailyGoalMinutes),
          focusDurationMinutes: Number(settings.focusDurationMinutes),
          shortBreakMinutes: Number(settings.shortBreakMinutes),
          longBreakMinutes: Number(settings.longBreakMinutes),
          longBreakInterval: Number(settings.longBreakInterval || 4),
          soundEnabled: Boolean(settings.soundEnabled),
          notificationsEnabled: Boolean(settings.notificationsEnabled),
          autoStartBreak: Boolean(settings.autoStartBreak),
          autoStartFocus: Boolean(settings.autoStartFocus),
          theme: settings.theme,
          onboarded: Boolean(settings.onboarded),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(settingsDoc, settingsPayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      break;
    }
  }
}

// Process all pending items in the offline queue
export async function flushSyncQueue(
  userId: string,
  onProgress?: (pendingCount: number) => void
): Promise<{ success: boolean; processed: number; failed: number }> {
  const queue = getStoredSyncQueue();
  if (queue.length === 0) {
    onProgress?.(0);
    return { success: true, processed: 0, failed: 0 };
  }

  const successfullyProcessedIds: string[] = [];
  let failed = 0;

  for (const item of queue) {
    try {
      await applyActionToFirestore(userId, item);
      successfullyProcessedIds.push(item.id);
      removeQueueItems([item.id]);
      onProgress?.(queue.length - successfullyProcessedIds.length);
    } catch (err) {
      console.warn(`Sync queue item ${item.id} failed to sync:`, err);
      failed++;
      // Stop flushing if network failure to preserve order
      break;
    }
  }

  return {
    success: failed === 0,
    processed: successfullyProcessedIds.length,
    failed,
  };
}

// Attach real-time snapshot listeners to sync changes from other devices
export function subscribeToUserData(
  userId: string,
  callbacks: {
    onTasksUpdated: (tasks: Task[]) => void;
    onSessionsUpdated: (sessions: FocusSession[]) => void;
    onSettingsUpdated: (settings: Partial<UserSettings>) => void;
  }
): () => void {
  const unsubscribes: Unsubscribe[] = [];

  // Tasks listener
  const tasksPath = `users/${userId}/tasks`;
  try {
    const unsubTasks = onSnapshot(
      collection(db, 'users', userId, 'tasks'),
      (snapshot) => {
        const remoteTasks: Task[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          remoteTasks.push({
            id: d.id || docSnap.id,
            title: d.title,
            subject: d.subject,
            priority: d.priority,
            estimatedDuration: d.estimatedDuration,
            deadline: d.deadline,
            completed: d.completed,
            completedAt: d.completedAt,
            createdAt: d.createdAt,
          });
        });
        callbacks.onTasksUpdated(remoteTasks);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, tasksPath);
      }
    );
    unsubscribes.push(unsubTasks);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, tasksPath);
  }

  // Sessions listener
  const sessionsPath = `users/${userId}/sessions`;
  try {
    const unsubSessions = onSnapshot(
      collection(db, 'users', userId, 'sessions'),
      (snapshot) => {
        const remoteSessions: FocusSession[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          remoteSessions.push({
            id: d.id || docSnap.id,
            startTime: d.startTime,
            endTime: d.endTime,
            durationMinutes: d.durationMinutes,
            subject: d.subject,
            taskId: d.taskId,
            taskTitle: d.taskTitle,
            distractions: d.distractions || [],
            completed: d.completed,
            mode: d.mode,
          });
        });
        callbacks.onSessionsUpdated(remoteSessions);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, sessionsPath);
      }
    );
    unsubscribes.push(unsubSessions);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, sessionsPath);
  }

  // Settings listener
  const settingsPath = `users/${userId}/settings/preferences`;
  try {
    const unsubSettings = onSnapshot(
      doc(db, 'users', userId, 'settings', 'preferences'),
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          callbacks.onSettingsUpdated({
            studentName: d.studentName,
            dailyGoalMinutes: d.dailyGoalMinutes,
            focusDurationMinutes: d.focusDurationMinutes,
            shortBreakMinutes: d.shortBreakMinutes,
            longBreakMinutes: d.longBreakMinutes,
            longBreakInterval: d.longBreakInterval,
            soundEnabled: d.soundEnabled,
            notificationsEnabled: d.notificationsEnabled,
            autoStartBreak: d.autoStartBreak,
            autoStartFocus: d.autoStartFocus,
            theme: d.theme,
            onboarded: d.onboarded,
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, settingsPath);
      }
    );
    unsubscribes.push(unsubSettings);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, settingsPath);
  }

  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
}

// Initial upload of existing local data when user signs up / signs in first time
export async function uploadLocalDataIfEmptyCloud(
  userId: string,
  localTasks: Task[],
  localSessions: FocusSession[],
  localSettings: UserSettings
): Promise<{ uploaded: boolean }> {
  try {
    const tasksSnap = await getDocs(collection(db, 'users', userId, 'tasks'));
    const sessionsSnap = await getDocs(collection(db, 'users', userId, 'sessions'));

    // If cloud is empty and local has items, seed cloud with local data
    if (tasksSnap.empty && sessionsSnap.empty && (localTasks.length > 0 || localSessions.length > 0)) {
      for (const task of localTasks) {
        await applyActionToFirestore(userId, {
          id: `seed_${task.id}`,
          timestamp: Date.now(),
          type: 'UPSERT_TASK',
          payload: task,
        });
      }
      for (const session of localSessions) {
        await applyActionToFirestore(userId, {
          id: `seed_${session.id}`,
          timestamp: Date.now(),
          type: 'UPSERT_SESSION',
          payload: session,
        });
      }
      await applyActionToFirestore(userId, {
        id: `seed_settings`,
        timestamp: Date.now(),
        type: 'UPDATE_SETTINGS',
        payload: localSettings,
      });
      return { uploaded: true };
    }
    return { uploaded: false };
  } catch (err) {
    console.warn('Initial cloud migration check notice:', err);
    return { uploaded: false };
  }
}
