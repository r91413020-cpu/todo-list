import React, { useState, useEffect } from 'react';
import { Task, Priority, SubTask } from '../types';
import { CATEGORIES } from '../data';
import { X, Plus, Trash2, Calendar, Star, HelpCircle, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => void;
  editTask?: Task | null;
}

export function TaskForm({ isOpen, onClose, onSave, editTask }: TaskFormProps) {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('work');
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState<string>('');
  const [pinned, setPinned] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>('');

  // Speech Recognition / Dictation states
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
        : null;

    if (SpeechRecognitionAPI) {
      setSpeechSupported(true);
      const rec = new SpeechRecognitionAPI();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setTitle((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript));
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech Recognition Error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleDictation = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error('Failed to start dictation:', err);
      }
    }
  };

  useEffect(() => {
    if (!isOpen && recognition && isListening) {
      try {
        recognition.stop();
      } catch (err) {}
    }
  }, [isOpen, recognition, isListening]);

  // Subtask local drafting state
  const [subTasks, setSubTasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState<string>('');

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setCategory(editTask.category);
      setPriority(editTask.priority);
      setDeadline(editTask.deadline || '');
      setPinned(editTask.pinned);
      setCompleted(editTask.completed);
      setSubTasks(editTask.subTasks || []);
      setEstimatedMinutes(editTask.estimatedMinutes !== undefined ? editTask.estimatedMinutes : '');
    } else {
      // Reset to defaults
      setTitle('');
      setDescription('');
      setCategory('work');
      setPriority('medium');
      setDeadline('');
      setPinned(false);
      setCompleted(false);
      setSubTasks([]);
      setEstimatedMinutes('');
    }
    setNewSubTaskTitle('');
  }, [editTask, isOpen]);

  if (!isOpen) return null;

  const handleAddSubTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubTaskTitle.trim()) return;

    const newSub: SubTask = {
      id: `draft-sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: newSubTaskTitle.trim(),
      completed: false,
    };

    setSubTasks((prev) => [...prev, newSub]);
    setNewSubTaskTitle('');
  };

  const handleRemoveSubTask = (id: string) => {
    setSubTasks((prev) => prev.filter((sub) => sub.id !== id));
  };

  const handleSubTaskCheckedToggle = (id: string) => {
    setSubTasks((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, completed: !sub.completed } : sub))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: editTask?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      deadline: deadline || undefined,
      pinned,
      completed,
      subTasks,
      estimatedMinutes: typeof estimatedMinutes === 'number' ? estimatedMinutes : undefined,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto" id="task-form-overlay">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          id="task-form-backdrop"
        />

        {/* Modal content container */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 overflow-hidden md:p-8"
            id="task-form-modal-card"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-6" id="task-form-header">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100" id="task-form-title-text">
                  {editTask ? 'Edit Task Specifications' : 'New Task Creation'}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Configure categories, priorities, deadlines, and a complete checklist.
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close dialog"
                id="task-form-close-icon-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5" id="task-form-element">
              {/* Task Title */}
              <div id="form-field-title">
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="form-title-input" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Task Title <span className="text-rose-500">*</span>
                  </label>
                  {isListening && (
                    <span className="text-[10px] md:text-xs text-rose-500 dark:text-rose-450 font-bold flex items-center gap-1.5 animate-pulse" id="voice-listening-status">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                      Listening... Speak now
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    id="form-title-input"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Deliver design specifications mockups"
                    className="w-full pl-4 pr-12 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-1 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-ellipsis"
                    autoFocus
                  />
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleDictation}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        isListening
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }`}
                      title={isListening ? 'Stop dictation' : 'Dictate title with voice'}
                      id="voice-dictate-btn"
                    >
                      {isListening ? (
                        <div className="relative flex items-center justify-center">
                          <span className="absolute inline-flex h-4 w-4 rounded-full bg-rose-400 dark:bg-rose-500 opacity-60 animate-ping" />
                          <Mic className="w-4 h-4 relative z-10" />
                        </div>
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              <div id="form-field-description">
                <label htmlFor="form-description-input" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Task Description
                </label>
                <textarea
                  id="form-description-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe details, references, or specific metrics..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-1 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              {/* Grid: Category & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="form-category-priority-grid">
                {/* Category Selection */}
                <div id="form-field-category">
                  <label htmlFor="form-category-dropdown" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Category Tag
                  </label>
                  <select
                    id="form-category-dropdown"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-1 rounded-xl text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Selection */}
                <div id="form-field-priority">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Priority Tier
                  </label>
                  <div className="flex gap-2" id="form-priority-chips-row">
                    {(['low', 'medium', 'high'] as Priority[]).map((level) => {
                      const isActive = priority === level;
                      let activeStyle = '';
                      if (level === 'high') {
                        activeStyle = isActive
                          ? 'bg-rose-500 text-white border-rose-500 dark:bg-rose-600 dark:border-rose-600'
                          : 'hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40 bg-rose-50/30';
                      } else if (level === 'medium') {
                        activeStyle = isActive
                          ? 'bg-amber-500 text-white border-amber-500 dark:bg-amber-600 dark:border-amber-600'
                          : 'hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-amber-950/20 text-amber-605 dark:text-amber-400 border-amber-100 dark:border-amber-900/40 bg-amber-50/30';
                      } else {
                        activeStyle = isActive
                          ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-550 dark:border-indigo-550'
                          : 'hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-slate-50/50';
                      }

                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setPriority(level)}
                          className={`flex-1 py-2 text-xs font-bold uppercase rounded-xl border text-center transition-all cursor-pointer ${activeStyle}`}
                          id={`form-priority-chip-${level}`}
                        >
                          {level === 'high' ? '🔴 ' : level === 'medium' ? '🟡 ' : '🔵 '}
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Grid: Deadline Support & Star Marker */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="form-deadline-pin-grid">
                {/* Deadline */}
                <div id="form-field-deadline">
                  <label htmlFor="form-deadline-input" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Deadline / Due Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      type="date"
                      id="form-deadline-input"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-1 rounded-xl text-sm text-slate-705 dark:text-slate-205 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                    />
                  </div>
                </div>

                {/* Star Pin Selection & Edit Done status */}
                <div className="flex flex-col justify-center gap-2 pt-2 md:pt-4" id="form-checkbox-attributes">
                  {/* Pin */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm font-medium text-slate-700 dark:text-slate-350">
                    <input
                      type="checkbox"
                      checked={pinned}
                      onChange={(e) => setPinned(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5"
                    />
                    <span className="flex items-center gap-1">
                      <Star className={`w-4 h-4 ${pinned ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                      Pin to Top / Feature Task
                    </span>
                  </label>

                  {/* Completed (Only in editTask mode to allow direct toggles) */}
                  {editTask && (
                    <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm font-medium text-slate-700 dark:text-slate-350">
                      <input
                        type="checkbox"
                        checked={completed}
                        onChange={(e) => setCompleted(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5"
                      />
                      <span>Mark total task as Completed</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Focus Duration Timer Blocking */}
              <div id="form-field-duration" className="pt-3.5 border-t border-slate-50 dark:border-slate-800/60">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Estimated Focus Allocation Time
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2" id="duration-preset-chips">
                  {([15, 30, 45, 60, 120, 240] as number[]).map((mins) => {
                    const isActive = estimatedMinutes === mins;
                    const displayLabel = mins < 60 ? `${mins}m` : `${mins / 60}h`;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setEstimatedMinutes(mins)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        ⚡ {displayLabel}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setEstimatedMinutes('')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      estimatedMinutes === ''
                        ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Clear Preset
                  </button>
                </div>
                
                <div className="relative max-w-[170px]" id="custom-duration-input-box">
                  <input
                    type="number"
                    min="1"
                    placeholder="Custom minutes..."
                    value={estimatedMinutes === '' ? '' : estimatedMinutes}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEstimatedMinutes(val === '' ? '' : Number(val));
                    }}
                    className="w-full pl-8 pr-12 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-1 rounded-xl text-xs text-slate-705 dark:text-slate-205 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs">⚡</span>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase">mins</span>
                </div>
              </div>

              {/* Sub-tasks interactive list checklist manager */}
              <div className="pt-2 border-t border-slate-50 dark:border-slate-800/60" id="form-field-subtasks">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Task Checklist Sub-items
                </label>

                {/* Input with Plus */}
                <div className="flex gap-2" id="draft-subtask-input-row">
                  <input
                    type="text"
                    value={newSubTaskTitle}
                    onChange={(e) => setNewSubTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubTask();
                      }
                    }}
                    placeholder="Add a milestone, sub-task, or step..."
                    className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-1 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    id="draft-subtask-title-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSubTask()}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-250 font-bold rounded-xl text-sm flex items-center gap-1 cursor-pointer transition-colors"
                    id="draft-subtask-add-btn"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Subtasks draft stack */}
                {subTasks.length > 0 && (
                  <div className="mt-3.5 max-h-36 overflow-y-auto space-y-2 p-3 bg-slate-50/50 dark:bg-slate-900 border border-slate-1 rounded-2xl" id="draft-subtasks-list-box">
                    {subTasks.map((sub, idx) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between gap-3 text-xs p-1.5 hover:bg-slate-100/50 dark:hover:bg-slate-850 rounded-lg group/draft-item"
                        id={`draft-subtask-item-${sub.id}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={sub.completed}
                            onChange={() => handleSubTaskCheckedToggle(sub.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <span className={`break-words select-none text-slate-700 dark:text-slate-355 ${sub.completed ? 'line-through text-slate-400' : ''}`}>
                            {sub.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubTask(sub.id)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                          title="Remove Subtask"
                          id={`draft-subtask-delete-btn-${sub.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Submits */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80" id="form-actions-row">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                  id="form-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/10 dark:shadow-none cursor-pointer transition-colors"
                  id="form-submit-btn"
                >
                  {editTask ? 'Save Specifications' : 'Generate New Task'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
