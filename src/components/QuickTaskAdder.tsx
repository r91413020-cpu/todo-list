import React, { useState } from 'react';
import { Task, Priority, CategoryInfo } from '../types';
import { CATEGORIES } from '../data';
import { Plus, Zap, Calendar, Clock, Gauge, Compass } from 'lucide-react';

interface QuickTaskAdderProps {
  onAddTask: (taskData: Omit<Task, 'id' | 'createdAt'>) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function QuickTaskAdder({ onAddTask, addToast }: QuickTaskAdderProps) {
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('work');
  const [priority, setPriority] = useState<Priority>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [deadline, setDeadline] = useState<string>('');

  const [showOptions, setShowOptions] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Please enter a task title first.', 'error');
      return;
    }

    onAddTask({
      title: title.trim(),
      description: 'Quick task registered using instant dashboard control',
      category,
      priority,
      completed: false,
      pinned: false,
      estimatedMinutes,
      deadline: deadline || undefined,
      subTasks: []
    });

    setTitle('');
    addToast(`Successfully created task: "${title.trim()}"`, 'success');
  };

  const activeCategory = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-indigo-100/50 dark:border-indigo-950/30 rounded-3xl p-4 md:p-5 mb-6 shadow-md shadow-indigo-600/[0.02]"
      id="quick-task-adder-panel"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Main Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Instant Add Input wrapper */}
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-indigo-500 animate-pulse animate-duration-1000" />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Instant task creator... Type title and hit Enter"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-850/80 border border-slate-150 dark:border-slate-800/80 rounded-2xl text-sm placeholder-slate-400 dark:placeholder-slate-500 text-slate-850 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/85 transition-all font-medium"
              id="quick-title-input"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Options Toggler */}
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className={`px-3.5 py-3 border rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                showOptions
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-350 dark:border-slate-700 text-slate-800 dark:text-white'
                  : 'bg-white dark:bg-slate-905 border-slate-200 dark:border-slate-805 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
              id="quick-options-toggle"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Configure</span>
            </button>

            {/* Instant Create Action Button */}
            <button
              type="submit"
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-650/15 cursor-pointer dark:shadow-none hover:-translate-y-[0.5px] active:translate-y-0 transition-all flex-shrink-0"
              id="quick-save-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Add Goal</span>
            </button>
          </div>
        </div>

        {/* Hidden configuration panel drawer */}
        {showOptions && (
          <div
            className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50/50 dark:bg-slate-850/20 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 text-left animate-fade-in"
            id="quick-add-controls"
          >
            {/* Column 1: Priority Picker */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-current" />
                Priority Layer
              </label>
              <div className="flex bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-1 rounded-xl" id="quick-priority-control">
                {(['low', 'medium', 'high'] as Priority[]).map((p) => {
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 text-[10px] font-extrabold uppercase py-1.5 rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? p === 'high'
                            ? 'bg-rose-500 text-white shadow-xs'
                            : p === 'medium'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-indigo-500 text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Category Selector */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Target Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-805 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 cursor-pointer outline-none focus:border-indigo-505"
                id="quick-add-category"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Column 3: Duration / Deadline parameters */}
            <div className="md:col-span-4 grid grid-cols-2 gap-3.5">
              {/* Focus minutes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Block Minutes
                </label>
                <select
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-805 rounded-xl px-2.5 py-2 text-xs text-slate-850 dark:text-slate-100 cursor-pointer outline-none focus:border-indigo-505"
                  id="quick-add-duration"
                >
                  <option value={15}>15m block</option>
                  <option value={30}>30m block</option>
                  <option value={45}>45m block</option>
                  <option value={60}>1h block</option>
                  <option value={120}>2h block</option>
                  <option value={180}>3h block</option>
                </select>
              </div>

              {/* Deadline */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-805 rounded-xl px-2.5 py-1.8 text-xs text-slate-850 dark:text-slate-100 cursor-pointer outline-none focus:border-indigo-505"
                  id="quick-add-deadline"
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
