import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export function useKeyboardShortcuts() {
  const {
    activeTab,
    setActiveTab,
    quickNewTaskModalOpen,
    setQuickNewTaskModalOpen,
    shortcutsModalOpen,
    setShortcutsModalOpen,
    onboardingModalOpen,
    setOnboardingModalOpen,
    authModalOpen,
    setAuthModalOpen,
    triggerTimerAction,
  } = useApp();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input, textarea, or select
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // Handle Escape globally to dismiss modals or blur inputs
      if (e.key === 'Escape') {
        if (authModalOpen) {
          setAuthModalOpen(false);
          return;
        }
        if (shortcutsModalOpen) {
          setShortcutsModalOpen(false);
          return;
        }
        if (quickNewTaskModalOpen) {
          setQuickNewTaskModalOpen(false);
          return;
        }
        if (onboardingModalOpen) {
          setOnboardingModalOpen(false);
          return;
        }
        if (isTyping) {
          target.blur();
          return;
        }
      }

      // If user is currently typing, do not intercept single-key navigation/actions
      if (isTyping) {
        return;
      }

      // Ignore if modifier keys (Ctrl/Cmd/Alt) are pressed, unless it's ? (Shift + /)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();

      // Show Keyboard Shortcuts Cheat Sheet ('?' or 'Shift + /')
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShortcutsModalOpen(!shortcutsModalOpen);
        return;
      }

      // 'n' -> New Task modal
      if (key === 'n') {
        e.preventDefault();
        setQuickNewTaskModalOpen(true);
        return;
      }

      // 't' -> Open Task List
      if (key === 't') {
        e.preventDefault();
        setActiveTab('tasks');
        return;
      }

      // 's' -> Start Timer or Toggle Timer
      if (key === 's') {
        e.preventDefault();
        if (activeTab !== 'timer') {
          setActiveTab('timer');
          // Short delay to ensure timer view is active before auto-starting
          setTimeout(() => {
            triggerTimerAction('start');
          }, 50);
        } else {
          triggerTimerAction('toggle');
        }
        return;
      }

      // 'd' -> Open Dashboard (when not in timer) or if in timer without conflict
      if (key === 'd') {
        e.preventDefault();
        setActiveTab('dashboard');
        return;
      }

      // 'h' -> Open Session History
      if (key === 'h') {
        e.preventDefault();
        setActiveTab('history');
        return;
      }

      // 'a' -> Open Analytics
      if (key === 'a') {
        e.preventDefault();
        setActiveTab('analytics');
        return;
      }

      // ',' -> Open Settings
      if (e.key === ',') {
        e.preventDefault();
        setActiveTab('settings');
        return;
      }

      // Timer View Specific Controls
      if (activeTab === 'timer') {
        // Spacebar toggles start / pause
        if (e.code === 'Space') {
          e.preventDefault();
          triggerTimerAction('toggle');
          return;
        }

        // 'r' -> Reset timer
        if (key === 'r') {
          e.preventDefault();
          triggerTimerAction('reset');
          return;
        }

        // 'x' -> Log distraction
        if (key === 'x') {
          e.preventDefault();
          triggerTimerAction('distract');
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    activeTab,
    setActiveTab,
    quickNewTaskModalOpen,
    setQuickNewTaskModalOpen,
    shortcutsModalOpen,
    setShortcutsModalOpen,
    onboardingModalOpen,
    setOnboardingModalOpen,
    triggerTimerAction,
  ]);
}
