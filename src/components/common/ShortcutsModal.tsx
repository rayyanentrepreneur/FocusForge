import React from 'react';
import { Command, Keyboard, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ShortcutsModal: React.FC = () => {
  const { shortcutsModalOpen, setShortcutsModalOpen } = useApp();

  if (!shortcutsModalOpen) return null;

  const shortcutSections = [
    {
      title: 'Global Navigation',
      items: [
        { key: 'D', label: 'Go to Dashboard' },
        { key: 'T', label: 'Go to My Tasks' },
        { key: 'S', label: 'Go to Focus Timer (and start)' },
        { key: 'H', label: 'Go to Session History' },
        { key: 'A', label: 'Go to Analytics & Insights' },
        { key: ',', label: 'Go to Settings' },
      ],
    },
    {
      title: 'Quick Power Actions',
      items: [
        { key: 'N', label: 'Open new task dialog from anywhere' },
        { key: '?', label: 'Open / close this shortcuts guide' },
        { key: 'Esc', label: 'Close open dialogs or dismiss modals' },
      ],
    },
    {
      title: 'Focus Timer Controls',
      items: [
        { key: 'Space', label: 'Start, Pause, or Resume countdown' },
        { key: 'S', label: 'Alternate toggle for start/pause' },
        { key: 'R', label: 'Reset timer countdown' },
        { key: 'X', label: 'Quickly log a distraction' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Keyboard Shortcuts
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Speed up your study workflow with one-key actions.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {shortcutSections.map((sec) => (
            <div key={sec.title} className="space-y-2">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {sec.title}
              </h3>
              <div className="grid grid-cols-1 gap-1.5">
                {sec.items.map((item) => (
                  <div
                    key={item.key + item.label}
                    className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 text-xs"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {item.label}
                    </span>
                    <kbd className="px-2 py-0.5 text-xs font-mono font-semibold rounded-md bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-300 border border-slate-200 dark:border-slate-700 shadow-xs tabular-nums">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Esc</kbd> anytime to close dialogs, or <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">?</kbd> to view this cheat sheet.
          </p>
        </div>
      </div>
    </div>
  );
};
