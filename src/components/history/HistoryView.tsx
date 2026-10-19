import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  History,
  Trash2,
  Zap,
  Tag,
  BookOpen,
} from 'lucide-react';
import { FocusSession, HistoryFilter } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatMinutesReadable, formatDateKey } from '../../utils/analytics';
import { getSubjectColor } from '../../utils/storage';

export const HistoryView: React.FC = () => {
  const { sessions, subjects, deleteSession, setActiveTab } = useApp();

  const [dateFilter, setDateFilter] = useState<HistoryFilter>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [sessionToDelete, setSessionToDelete] = useState<FocusSession | null>(null);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    const now = new Date();
    const todayKey = formatDateKey(now);

    return sessions
      .filter((s) => {
        // Date range filter
        if (dateFilter === 'today') {
          if (formatDateKey(new Date(s.startTime)) !== todayKey) return false;
        } else if (dateFilter === 'week') {
          const sessionDate = new Date(s.startTime);
          const diffDays = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 7) return false;
        } else if (dateFilter === 'month') {
          const sessionDate = new Date(s.startTime);
          const diffDays = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 30) return false;
        }

        // Subject filter
        if (selectedSubject !== 'all' && s.subject !== selectedSubject) return false;

        return true;
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [sessions, dateFilter, selectedSubject]);

  // Aggregate metrics for filtered sessions
  const totalFilteredMinutes = filteredSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalFilteredSessions = filteredSessions.length;
  const avgSessionMinutes =
    totalFilteredSessions > 0 ? Math.round(totalFilteredMinutes / totalFilteredSessions) : 0;
  const totalDistractions = filteredSessions.reduce(
    (acc, curr) => acc + (curr.distractions?.length || 0),
    0
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Session History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review your logged focus sessions, subjects covered, and distraction notes.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-lg border border-slate-200 dark:border-slate-800">
            {(
              [
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: '7 Days' },
                { id: 'month', label: '30 Days' },
              ] as { id: HistoryFilter; label: string }[]
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setDateFilter(filter.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  dateFilter === filter.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregate Stat Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Study Time</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {formatMinutesReadable(totalFilteredMinutes)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Across filtered sessions</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Sessions</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-purple-600 dark:text-purple-400 mt-1">
            {totalFilteredSessions}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Completed sprints</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Avg Session Length</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {avgSessionMinutes}m
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Minutes per session</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Logged Distractions</span>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
            {totalDistractions}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Total interruptions</span>
        </div>
      </div>

      {/* Session History List */}
      <div className="space-y-3">
        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {dateFilter !== 'all' || selectedSubject !== 'all'
                ? 'No sessions in this filter'
                : 'No completed focus sessions yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Complete your first focus timer sprint to start building your personal session log.
            </p>
            <button
              onClick={() => setActiveTab('timer')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
            >
              Start Focus Session
            </button>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const subjectColor = getSubjectColor(session.subject);
            const sessionDate = new Date(session.startTime);
            const dateStr = sessionDate.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const timeStr = sessionDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={session.id}
                className="p-4 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs hover:border-purple-200 dark:hover:border-purple-900/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Info & Metadata */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {session.durationMinutes} min Focus Session
                      </span>
                      {session.taskTitle && (
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium truncate max-w-xs">
                          (Task: {session.taskTitle})
                        </span>
                      )}
                    </div>

                    {/* Unboxed Metadata Line with typographic separators */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      {/* Subject */}
                      <span className="font-semibold flex items-center gap-1.5" style={{ color: subjectColor }}>
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: subjectColor }} />
                        {session.subject}
                      </span>
                      <span aria-hidden="true">·</span>

                      {/* Date & Time */}
                      <span className="font-mono tabular-nums">
                        {dateStr} at {timeStr}
                      </span>
                      <span aria-hidden="true">·</span>

                      {/* Distraction Count */}
                      <span className="font-mono tabular-nums flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        {session.distractions?.length || 0} distraction
                        {(session.distractions?.length || 0) === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Distraction breakdown if any notes were logged */}
                    {session.distractions && session.distractions.length > 0 && (
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        {session.distractions.map((d, i) => (
                          <span
                            key={d.id || i}
                            className="text-[11px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40"
                          >
                            {d.note || 'Distraction'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => setSessionToDelete(session)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Delete session"
                    aria-label="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#0E1526] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Session Log?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              This will remove this {sessionToDelete.durationMinutes}-minute focus session from your records and recalculate your streak and stats.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSessionToDelete(null)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteSession(sessionToDelete.id);
                  setSessionToDelete(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
