import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { FocusSession, Task, UserSettings } from '../types';

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

// Remove processed queue items
export function removeQueueItems(idsToRemove: string[]): void {
  const set = new Set(idsToRemove);
  const queue = getStoredSyncQueue().filter((item) => !set.has(item.id));
  saveSyncQueue(queue);
}

// Check if an error is network / offline related
export function isNetworkOrOfflineError(err: unknown): boolean {
  if (!err) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('offline') ||
    msg.includes('network') ||
    msg.includes('unavailable') ||
    msg.includes('failed to get document') ||
    msg.includes('client is offline') ||
    msg.includes('could not reach')
  );
}

// Apply single action to Firestore directly
export async function applyActionToFirestore(userId: string, action: SyncQueueItem): Promise<void> {
  const { type, payload } = action;

  switch (type) {
    case 'UPSERT_TASK': {
      const task: Task = payload;
      const path = `users/${userId}/tasks/${task.id}`;
      try {
        const taskDoc = doc(db, 'users', userId, 'tasks', task.id);
        const dataToSave: Record<string, unknown> = {
          id: task.id,
          userId,
          title: task.title,
          subject: task.subject,
          priority: task.priority,
          estimatedDuration: Number(task.estimatedDuration),
          completed: Boolean(task.completed),
          createdAt: task.createdAt,
          updatedAt: new Date().toISOString(),
        };
        if (task.deadline) dataToSave.deadline = task.deadline;
        if (task.completedAt) dataToSave.completedAt = task.completedAt;

        await setDoc(taskDoc, dataToSave, { merge: true });
      } catch (err) {
        if (isNetworkOrOfflineError(err)) {
          throw err;
        }
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
        if (isNetworkOrOfflineError(err)) {
          throw err;
        }
        handleFirestoreError(err, OperationType.DELETE, path);
      }
      break;
    }

    case 'UPSERT_SESSION': {
      const session: FocusSession = payload;
      const path = `users/${userId}/sessions/${session.id}`;
      try {
        const sessionDoc = doc(db, 'users', userId, 'sessions', session.id);
        const dataToSave: Record<string, unknown> = {
          id: session.id,
          userId,
          startTime: session.startTime,
          endTime: session.endTime,
          durationMinutes: Number(session.durationMinutes),
          subject: session.subject,
          completed: Boolean(session.completed),
          mode: session.mode,
          distractions: session.distractions || [],
        };
        if (session.taskId) dataToSave.taskId = session.taskId;
        if (session.taskTitle) dataToSave.taskTitle = session.taskTitle;

        await setDoc(sessionDoc, dataToSave);
      } catch (err) {
        if (isNetworkOrOfflineError(err)) {
          throw err;
        }
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
        if (isNetworkOrOfflineError(err)) {
          throw err;
        }
        handleFirestoreError(err, OperationType.DELETE, path);
      }
      break;
    }

    case 'UPDATE_SETTINGS': {
      const settings: UserSettings = payload;
      const path = `users/${userId}/settings/preferences`;
      try {
        const settingsDoc = doc(db, 'users', userId, 'settings', 'preferences');
        const dataToSave: Record<string, unknown> = {
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
        await setDoc(settingsDoc, dataToSave, { merge: true });
      } catch (err) {
        if (isNetworkOrOfflineError(err)) {
          throw err;
        }
        handleFirestoreError(err, OperationType.WRITE, path);
      }
      break;
    }
  }
}

// Queue flush routine: processes pending actions in order
export async function flushSyncQueue(
  userId: string,
  onProgress?: (pendingCount: number) => void
): Promise<{ success: boolean; processed: number; failed: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, processed: 0, failed: getStoredSyncQueue().length };
  }

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
      console.warn(`Sync queue item ${item.id} deferral:`, err);
      failed++;
      // Stop flushing if network failure to preserve sequential ordering
      break;
    }
  }

  return {
    success: failed === 0,
    processed: successfullyProcessedIds.length,
    failed,
  };
}

// Local-first mutators: try direct write; if offline or fails due to network, enqueue!
export async function syncTaskToFirestore(userId: string, task: Task): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueSyncAction('UPSERT_TASK', task);
    return;
  }

  try {
    await applyActionToFirestore(userId, {
      id: `task_${task.id}`,
      timestamp: Date.now(),
      type: 'UPSERT_TASK',
      payload: task,
    });
  } catch (err) {
    if (isNetworkOrOfflineError(err)) {
      enqueueSyncAction('UPSERT_TASK', task);
    } else {
      throw err;
    }
  }
}

export async function deleteTaskFromFirestore(userId: string, taskId: string): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueSyncAction('DELETE_TASK', { id: taskId });
    return;
  }

  try {
    await applyActionToFirestore(userId, {
      id: `del_task_${taskId}`,
      timestamp: Date.now(),
      type: 'DELETE_TASK',
      payload: { id: taskId },
    });
  } catch (err) {
    if (isNetworkOrOfflineError(err)) {
      enqueueSyncAction('DELETE_TASK', { id: taskId });
    } else {
      throw err;
    }
  }
}

export async function syncSessionToFirestore(userId: string, session: FocusSession): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueSyncAction('UPSERT_SESSION', session);
    return;
  }

  try {
    await applyActionToFirestore(userId, {
      id: `session_${session.id}`,
      timestamp: Date.now(),
      type: 'UPSERT_SESSION',
      payload: session,
    });
  } catch (err) {
    if (isNetworkOrOfflineError(err)) {
      enqueueSyncAction('UPSERT_SESSION', session);
    } else {
      throw err;
    }
  }
}

export async function deleteSessionFromFirestore(userId: string, sessionId: string): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueSyncAction('DELETE_SESSION', { id: sessionId });
    return;
  }

  try {
    await applyActionToFirestore(userId, {
      id: `del_session_${sessionId}`,
      timestamp: Date.now(),
      type: 'DELETE_SESSION',
      payload: { id: sessionId },
    });
  } catch (err) {
    if (isNetworkOrOfflineError(err)) {
      enqueueSyncAction('DELETE_SESSION', { id: sessionId });
    } else {
      throw err;
    }
  }
}

export async function syncUserProfileToFirestore(
  userId: string,
  email: string,
  displayName?: string,
  dailyGoalMinutes?: number
): Promise<void> {
  const profilePath = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    const data: Record<string, unknown> = {
      userId,
      email,
      updatedAt: new Date().toISOString(),
    };
    if (displayName) data.displayName = displayName;
    if (dailyGoalMinutes) data.dailyGoalMinutes = dailyGoalMinutes;

    await setDoc(userRef, data, { merge: true });
  } catch (err) {
    if (isNetworkOrOfflineError(err)) {
      // Non-critical profile sync, ignore network error silently
      return;
    }
    handleFirestoreError(err, OperationType.WRITE, profilePath);
  }
}

export async function syncSettingsToFirestore(userId: string, settings: UserSettings): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueSyncAction('UPDATE_SETTINGS', settings);
    return;
  }

  try {
    await applyActionToFirestore(userId, {
      id: `settings_${Date.now()}`,
      timestamp: Date.now(),
      type: 'UPDATE_SETTINGS',
      payload: settings,
    });
  } catch (err) {
    if (isNetworkOrOfflineError(err)) {
      enqueueSyncAction('UPDATE_SETTINGS', settings);
    } else {
      throw err;
    }
  }
}

// Subscribe to real-time tasks for a user
export function subscribeToUserTasks(
  userId: string,
  onTasksUpdated: (tasks: Task[]) => void
): () => void {
  const tasksCollectionPath = `users/${userId}/tasks`;
  const tasksRef = collection(db, 'users', userId, 'tasks');

  return onSnapshot(
    tasksRef,
    (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        tasks.push({
          id: d.id,
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
      onTasksUpdated(tasks);
    },
    (error) => {
      if (isNetworkOrOfflineError(error)) {
        console.warn('Realtime tasks listener offline waiting for reconnection.');
        return;
      }
      handleFirestoreError(error, OperationType.GET, tasksCollectionPath);
    }
  );
}

// Subscribe to real-time sessions for a user
export function subscribeToUserSessions(
  userId: string,
  onSessionsUpdated: (sessions: FocusSession[]) => void
): () => void {
  const sessionsCollectionPath = `users/${userId}/sessions`;
  const sessionsRef = collection(db, 'users', userId, 'sessions');

  return onSnapshot(
    sessionsRef,
    (snapshot) => {
      const sessions: FocusSession[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        sessions.push({
          id: d.id,
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
      onSessionsUpdated(sessions);
    },
    (error) => {
      if (isNetworkOrOfflineError(error)) {
        console.warn('Realtime sessions listener offline waiting for reconnection.');
        return;
      }
      handleFirestoreError(error, OperationType.GET, sessionsCollectionPath);
    }
  );
}
