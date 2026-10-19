import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Check,
  Clock,
  Filter,
  MoreVertical,
  Play,
  Plus,
  Search,
  Trash2,
  Edit2,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { Task, TaskFilter, TaskSort } from '../../types';
import { useApp } from '../../context/AppContext';
import { TaskModal } from './TaskModal';
import { getSubjectColor } from '../../utils/storage';

export const TasksView: React.FC = () => {
  const {
    tasks,
    subjects,
    toggleTask,
    deleteTask,
    startTimerForTask,
    setQuickNewTaskModalOpen,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<TaskSort>('priority');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Filter & Sort tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchSub = task.subject.toLowerCase().includes(q);
          if (!matchTitle && !matchSub) return false;
        }

        // Status Filter
        if (activeFilter === 'pending' && task.completed) return false;
        if (activeFilter === 'completed' && !task.completed) return false;
        if (activeFilter === 'high_priority' && task.priority !== 'high') return false;

        // Subject Filter
        if (selectedSubject !== 'all' && task.subject !== selectedSubject) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const priorityWeights = { high: 3, medium: 2, low: 1 };
          return priorityWeights[b.priority] - priorityWeights[a.priority];
        }
        if (sortBy === 'deadline') {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline.localeCompare(b.deadline);
        }
        if (sortBy === 'duration') {
          return b.estimatedDuration - a.estimatedDuration;
        }
        if (sortBy === 'created') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [tasks, activeFilter, selectedSubject, sortBy, searchQuery]);

  // Overall completion metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const formatDeadlineText = (deadlineStr?: string) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr + 'T23:59:59');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true };
    }
    if (diffDays === 0) {
      return { text: 'Due today', isToday: true };
    }
    if (diffDays === 1) {
      return { text: 'Due tomorrow' };
    }
    return { text: `Due in ${diffDays}d` };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Title & Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Study Tasks
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize academic goals, set priority, and launch focused study sprints.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm shadow-purple-900/30 transition-all hover:scale-[1.01] active:scale-[0.99] whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Study Task</span>
          <kbd className="text-[10px] ml-0.5 px-1.5 py-0.5 rounded bg-purple-700/80 font-mono text-purple-100 uppercase tracking-wider hidden sm:inline">N</kbd>
        </button>
      </div>

      {/* Progress & Quick Stats Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Task Completion Progress
            </span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {completedTasks} of {totalTasks} finished
            </span>
          </div>
          <span className="text-xs font-mono font-bold tabular-nums text-purple-600 dark:text-purple-400">
            {completionPercentage}% completed
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Control Bar: Filters, Search, Subject, Sort */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Segmented Filter Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0">
          {[
            { id: 'all' as const, label: 'All Tasks' },
            { id: 'pending' as const, label: 'Pending' },
            { id: 'completed' as const, label: 'Completed' },
            { id: 'high_priority' as const, label: 'High Priority' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeFilter === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search, Subject Filter & Sort Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Search */}
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-purple-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Subject Filter */}
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

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as TaskSort)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="priority">Priority</option>
            <option value="deadline">Deadline</option>
            <option value="duration">Duration</option>
            <option value="created">Recently Added</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {searchQuery || activeFilter !== 'all' || selectedSubject !== 'all'
                ? 'No matching tasks found'
                : 'No study tasks logged yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              {searchQuery || activeFilter !== 'all' || selectedSubject !== 'all'
                ? 'Try clearing your filters or search term to see more tasks.'
                : 'Add tasks with duration estimates so you can link them to your focus sessions.'}
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const deadlineInfo = formatDeadlineText(task.deadline);
            const subjectColor = getSubjectColor(task.subject);

            return (
              <div
                key={task.id}
                className={`group p-4 rounded-xl bg-white dark:bg-[#0E1526] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  task.completed
                    ? 'border-slate-200 dark:border-slate-800/50 opacity-70 bg-slate-50/50 dark:bg-[#0B0F19]/40'
                    : 'border-slate-200 dark:border-slate-800/80 hover:border-purple-300 dark:hover:border-purple-700/60 shadow-xs'
                }`}
              >
                {/* Left: Checkbox + Title + Metadata */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      task.completed
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 bg-white dark:bg-slate-900'
                    }`}
                    aria-label={task.completed ? 'Mark pending' : 'Mark completed'}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold truncate ${
                        task.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {task.title}
                    </p>

                    {/* Clean unboxed metadata with typographic separators */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      {/* Subject with subtle color indicator */}
                      <span className="flex items-center gap-1.5 font-medium" style={{ color: subjectColor }}>
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: subjectColor }} />
                        {task.subject}
                      </span>
                      <span aria-hidden="true">·</span>

                      {/* Priority unboxed label */}
                      <span
                        className={`font-medium capitalize ${
                          task.priority === 'high'
                            ? 'text-rose-600 dark:text-rose-400 font-semibold'
                            : task.priority === 'medium'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {task.priority} Priority
                      </span>
                      <span aria-hidden="true">·</span>

                      {/* Estimated Duration */}
                      <span className="font-mono tabular-nums flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {task.estimatedDuration}m
                      </span>

                      {/* Deadline if present */}
                      {deadlineInfo && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`font-mono tabular-nums flex items-center gap-1 ${
                              deadlineInfo.isOverdue
                                ? 'text-rose-600 dark:text-rose-400 font-bold'
                                : deadlineInfo.isToday
                                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {deadlineInfo.text}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Focus on this task button */}
                  {!task.completed && (
                    <button
                      onClick={() => startTimerForTask(task)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg border border-purple-200/80 dark:border-purple-800/40 transition-colors whitespace-nowrap"
                    >
                      <Play className="w-3 h-3 fill-purple-600 text-purple-600 dark:fill-purple-400 dark:text-purple-400" />
                      <span>Focus</span>
                    </button>
                  )}

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEdit(task)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Edit task"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setTaskToDelete(task)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={editingTask}
      />

      {/* Delete Confirmation Dialog */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#0E1526] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Delete Task?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">"{taskToDelete.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteTask(taskToDelete.id);
                  setTaskToDelete(null);
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
