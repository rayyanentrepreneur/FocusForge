import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Tag, X } from 'lucide-react';
import { Priority, Task } from '../../types';
import { useApp } from '../../context/AppContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, taskToEdit }) => {
  const { subjects, addSubject, addTask, updateTask } = useApp();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(subjects[0] || 'General Study');
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [isAddingNewSubject, setIsAddingNewSubject] = useState(false);
  const [priority, setPriority] = useState<Priority>('medium');
  const [estimatedDuration, setEstimatedDuration] = useState<number>(25);
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setSubject(taskToEdit.subject);
      setPriority(taskToEdit.priority);
      setEstimatedDuration(taskToEdit.estimatedDuration);
      setDeadline(taskToEdit.deadline || '');
    } else {
      setTitle('');
      setSubject(subjects[0] || 'General Study');
      setPriority('medium');
      setEstimatedDuration(25);
      setDeadline('');
    }
    setIsAddingNewSubject(false);
    setNewSubjectInput('');
    setError('');
  }, [taskToEdit, isOpen, subjects]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }

    let finalSubject = subject;
    if (isAddingNewSubject && newSubjectInput.trim()) {
      finalSubject = newSubjectInput.trim();
      addSubject(finalSubject);
    }

    if (taskToEdit) {
      updateTask({
        ...taskToEdit,
        title: title.trim(),
        subject: finalSubject,
        priority,
        estimatedDuration: Number(estimatedDuration) || 25,
        deadline: deadline || undefined,
      });
    } else {
      addTask({
        title: title.trim(),
        subject: finalSubject,
        priority,
        estimatedDuration: Number(estimatedDuration) || 25,
        deadline: deadline || undefined,
      });
    }

    onClose();
  };

  const durationPresets = [15, 25, 45, 50, 90];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {taskToEdit ? 'Edit Task' : 'Create New Study Task'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Plan what you want to achieve in your next focus session.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Read Physics Chapter 3 or Solve Math Problem Set"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              autoFocus
            />
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject / Topic
            </label>
            {!isAddingNewSubject ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                  >
                    {subjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                  <Tag className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingNewSubject(true)}
                  className="px-3 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800/60 whitespace-nowrap transition-colors"
                >
                  + Custom Subject
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  placeholder="Enter new subject name..."
                  className="flex-1 px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-purple-500 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsAddingNewSubject(false)}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Priority & Estimated Duration Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                {(['low', 'medium', 'high'] as Priority[]).map((p) => {
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-1.5 text-xs font-medium capitalize rounded-md transition-all ${
                        isSelected
                          ? p === 'high'
                            ? 'bg-rose-500 text-white shadow-xs'
                            : p === 'medium'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Deadline (Optional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono tabular-nums"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Estimated Duration */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Estimated Study Duration: <span className="font-mono tabular-nums text-purple-600 dark:text-purple-400">{estimatedDuration} min</span>
              </label>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {durationPresets.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setEstimatedDuration(mins)}
                  className={`px-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border transition-all ${
                    estimatedDuration === mins
                      ? 'bg-purple-600 border-purple-600 text-white font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {mins}m
                </button>
              ))}
              <div className="flex items-center gap-1 ml-auto">
                <input
                  type="number"
                  min="5"
                  max="360"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(Math.max(1, Number(e.target.value)))}
                  className="w-16 px-2 py-1 rounded-md text-xs font-mono tabular-nums text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-400">mins</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm shadow-purple-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
