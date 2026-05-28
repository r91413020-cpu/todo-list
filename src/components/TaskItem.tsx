import React, { useState } from 'react';
import { Task, CategoryInfo } from '../types';
import { CATEGORIES } from '../data';
import {
  Briefcase,
  User,
  Activity,
  DollarSign,
  ShoppingCart,
  Sparkles,
  Folder,
  Calendar,
  Pin,
  Trash2,
  Edit,
  Check,
  ChevronDown,
  ChevronUp,
  Square,
  CheckSquare,
  Star,
  Gauge,
  Play,
  Pause,
  RotateCcw,
  ListTodo,
  Plus,
  X
} from 'lucide-react';
import { motion } from 'motion/react';

const iconMap: Record<string, any> = {
  Briefcase,
  User,
  Activity,
  DollarSign,
  ShoppingCart,
  Sparkles,
};

const BACKUP_PALETTES = [
  { color: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100/60 dark:border-indigo-900/60', textColor: 'text-indigo-700 dark:text-indigo-305' },
  { color: 'bg-teal-50 dark:bg-teal-950/40 border-teal-100/60 dark:border-teal-900/60', textColor: 'text-teal-700 dark:text-teal-305' },
  { color: 'bg-rose-50 dark:bg-rose-950/40 border-rose-100/60 dark:border-rose-900/60', textColor: 'text-rose-700 dark:text-rose-300' },
  { color: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100/60 dark:border-emerald-900/60', textColor: 'text-emerald-700 dark:text-emerald-305' },
  { color: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100/60 dark:border-amber-900/60', textColor: 'text-amber-700 dark:text-amber-305' },
  { color: 'bg-violet-50 dark:bg-violet-950/40 border-violet-100/60 dark:border-violet-900/60', textColor: 'text-violet-700 dark:text-violet-305' },
  { color: 'bg-pink-50 dark:bg-pink-950/40 border-pink-100/60 dark:border-pink-900/60', textColor: 'text-pink-700 dark:text-pink-305' },
  { color: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-100/60 dark:border-cyan-900/60', textColor: 'text-cyan-705 dark:text-cyan-305' },
];

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const IconComp = iconMap[name] || Folder;
  return <IconComp className={className} />;
}

interface TaskItemProps {
  key?: React.Key;
  task: Task;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onAddSubtask?: (taskId: string, title: string) => void;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onUpdateTimeSpent?: (taskId: string, actualMinutesSpent: number) => void;
}

export function TaskItem({
  task,
  isSelected,
  onToggleSelect,
  onToggleComplete,
  onTogglePin,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onEdit,
  onDelete,
  onUpdateTimeSpent,
}: TaskItemProps) {
  const [showSubtasks, setShowSubtasks] = useState<boolean>(true);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<string>('');

  // Focus Timer Logic
  const initialSeconds = (task.actualMinutesSpent || 0) * 60;
  const [timerSeconds, setTimerSeconds] = useState<number>(initialSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Synchronize with external task changes (e.g. if loaded initially or modified through form)
  React.useEffect(() => {
    setTimerSeconds((task.actualMinutesSpent || 0) * 60);
  }, [task.actualMinutesSpent]);

  // Check complete to auto stop
  React.useEffect(() => {
    if (task.completed && isTimerRunning) {
      setIsTimerRunning(false);
      if (onUpdateTimeSpent) {
        onUpdateTimeSpent(task.id, parseFloat((timerSeconds / 60).toFixed(2)));
      }
    }
  }, [task.completed, isTimerRunning, task.id, onUpdateTimeSpent, timerSeconds]);

  // Interval effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          const next = prev + 1;
          // Sync to parent every 10 seconds so the persistent database saves it regularly
          if (next % 10 === 0 && onUpdateTimeSpent) {
            onUpdateTimeSpent(task.id, parseFloat((next / 60).toFixed(2)));
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, task.id, onUpdateTimeSpent]);

  const handleToggleTimer = () => {
    if (isTimerRunning) {
      if (onUpdateTimeSpent) {
        onUpdateTimeSpent(task.id, parseFloat((timerSeconds / 60).toFixed(2)));
      }
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
    if (onUpdateTimeSpent) {
      onUpdateTimeSpent(task.id, 0);
    }
  };

  const handleAdjustMinutes = (delta: number) => {
    setTimerSeconds((prev) => {
      const next = Math.max(0, prev + delta * 60);
      if (onUpdateTimeSpent) {
        onUpdateTimeSpent(task.id, parseFloat((next / 65).toFixed(2))); // fallback guard
        // Let's use clean precision division
        onUpdateTimeSpent(task.id, parseFloat((next / 60).toFixed(2)));
      }
      return next;
    });
  };

  const formatTimeStr = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  // Find Category Info dynamically and case-insensitively, handling list items & subcategories
  const categoryKey = (task.category || '').trim();
  const categoryKeyLower = categoryKey.toLowerCase();
  
  const predefinedCategory = CATEGORIES.find(
    (c) => c.id.toLowerCase() === categoryKeyLower || c.name.toLowerCase() === categoryKeyLower
  );

  const categoryInfo = predefinedCategory || (() => {
    // Dynamically generate color palette based on unique string hash for better visual hierarchy of custom categories
    let hash = 0;
    for (let i = 0; i < categoryKeyLower.length; i++) {
      hash = categoryKeyLower.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % BACKUP_PALETTES.length;
    const backup = BACKUP_PALETTES[colorIndex];
    
    return {
      id: categoryKeyLower || 'other',
      name: categoryKey || 'Other',
      color: backup.color,
      textColor: backup.textColor,
      iconName: 'Folder',
    };
  })();

  const priorityColors = {
    high: {
      border: 'border-l-4 border-l-rose-500 border-slate-100 dark:border-slate-800',
      badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-450 border border-rose-100 dark:border-rose-900/40',
      glow: 'shadow-[0_4px_12px_rgba(244,63,94,0.02)]',
    },
    medium: {
      border: 'border-l-4 border-l-amber-500 border-slate-100 dark:border-slate-800',
      badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-455 border border-amber-100 dark:border-amber-900/40',
      glow: 'shadow-[0_4px_12px_rgba(245,158,11,0.02)]',
    },
    low: {
      border: 'border-l-4 border-l-indigo-450 border-slate-100 dark:border-slate-800',
      badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/40',
      glow: 'shadow-[0_4px_12px_rgba(100,116,139,0.01)]',
    },
  };

  const styleConfig = priorityColors[task.priority] || priorityColors.medium;

  // Deadline Checks
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = !task.completed && task.deadline && task.deadline < todayStr;
  const isDueToday = !task.completed && task.deadline && task.deadline === todayStr;

  let deadlineTextStyle = 'text-slate-500 dark:text-slate-400';
  let deadlineBg = 'bg-slate-50 dark:bg-slate-850';
  if (isOverdue) {
    deadlineTextStyle = 'text-rose-600 dark:text-rose-400 font-bold';
    deadlineBg = 'bg-rose-50 dark:bg-rose-950/35 border border-rose-100 dark:border-rose-900/40';
  } else if (isDueToday) {
    deadlineTextStyle = 'text-amber-600 dark:text-amber-400 font-bold animate-pulse';
    deadlineBg = 'bg-amber-50 dark:bg-amber-950/35 border border-amber-100 dark:border-amber-900/40';
  }

  // Subtasks Completion Calc
  const subTasksTotal = task.subTasks.length;
  const subTasksCompleted = task.subTasks.filter((st) => st.completed).length;
  const subtasksPercent = subTasksTotal > 0 ? Math.round((subTasksCompleted / subTasksTotal) * 100) : 0;

  // Formatting due date to reader-friendly format
  const formatDeadline = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleLocalAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !onAddSubtask) return;
    onAddSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const handleLocalDeleteSubtask = (subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteSubtask) {
      onDeleteSubtask(task.id, subId);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`bg-white dark:bg-slate-900 rounded-2xl border ${styleConfig.border} ${styleConfig.glow} p-5 hover:shadow-md transition-all group`}
      id={`task-item-card-${task.id}`}
    >
      {/* Block 1: Main Header and Action Row */}
      <div className="flex items-start gap-4" id={`task-card-header-row-${task.id}`}>
        {/* Bulk select checkbox */}
        <div className="mt-1.5 flex-shrink-0 flex items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(task.id)}
            className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/25 bg-slate-50 dark:bg-slate-850 cursor-pointer transition-colors"
            id={`task-select-checkbox-${task.id}`}
          />
        </div>

        {/* Checkbox trigger */}
        <button
          onClick={() => onToggleComplete(task.id)}
          className="mt-1 flex-shrink-0 text-slate-350 hover:text-indigo-600 dark:text-slate-650 dark:hover:text-indigo-550 transition-colors focus:outline-none cursor-pointer"
          aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
          id={`task-checkbox-${task.id}`}
        >
          {task.completed ? (
            <motion.div whileTap={{ scale: 0.85 }}>
              <CheckSquare className="w-5.5 h-5.5 text-indigo-600 dark:text-indigo-500 fill-indigo-50 dark:fill-indigo-950/20" />
            </motion.div>
          ) : (
            <motion.div whileTap={{ scale: 0.85 }}>
              <Square className="w-5.5 h-5.5 text-slate-300 hover:border-slate-400 dark:text-slate-600 dark:hover:border-slate-500" />
            </motion.div>
          )}
        </button>

        {/* Info detail block */}
        <div className="flex-1 min-w-0" id={`task-card-title-block-${task.id}`}>
          <div className="flex flex-wrap items-center gap-2 mb-1.5" id={`task-card-tags-row-${task.id}`}>
            {/* Category badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${categoryInfo.color} ${categoryInfo.textColor}`}
            >
              <CategoryIcon name={categoryInfo.iconName} className="w-3 h-3" />
              <span>{categoryInfo.name}</span>
            </span>

            {/* Visual Priority Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${styleConfig.badge}`}
              title={`Priority: ${task.priority}`}
            >
              <span className="flex items-end gap-0.5 h-3 mb-0.5" aria-hidden="true">
                <span className={`w-[3px] rounded-t-[1px] transition-colors ${
                  task.priority === 'low' ? 'bg-indigo-505 dark:bg-indigo-400' :
                  task.priority === 'medium' ? 'bg-amber-500' :
                  'bg-rose-500'
                } h-1.5`} />
                <span className={`w-[3px] rounded-t-[1px] transition-colors ${
                  task.priority === 'low' ? 'bg-slate-205 dark:bg-slate-700/60' :
                  task.priority === 'medium' ? 'bg-amber-500' :
                  'bg-rose-500'
                } h-2.5`} />
                <span className={`w-[3px] rounded-t-[1px] transition-colors ${
                  task.priority === 'high' ? 'bg-rose-500' :
                  'bg-slate-205 dark:bg-slate-700/60'
                } h-3.5`} />
              </span>
              <Gauge className="w-3.5 h-3.5 opacity-85 text-current" />
              <span>{task.priority}</span>
            </span>

            {/* Estimated Focus Duration Badge */}
            {task.estimatedMinutes !== undefined && task.estimatedMinutes > 0 && (
              <span className="bg-indigo-50/50 text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 border border-indigo-100/30 dark:border-slate-700/60 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5" id={`task-duration-badge-${task.id}`}>
                <span className="text-[11px]">⏱️</span>
                <span>{task.estimatedMinutes < 60 ? `${task.estimatedMinutes}m` : `${task.estimatedMinutes % 60 === 0 ? `${task.estimatedMinutes / 60}h` : `${Math.floor(task.estimatedMinutes / 60)}h ${task.estimatedMinutes % 60}m`}`}</span>
              </span>
            )}

            {/* Pinned Tag indicator */}
            {task.pinned && (
              <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                Featured
              </span>
            )}
          </div>

          <h3
            className={`text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100 break-words transition-all ${
              task.completed ? 'line-through text-slate-400 dark:text-slate-550 dec-2 dec-indigo-300' : ''
            }`}
            id={`task-title-${task.id}`}
          >
            {task.title}
          </h3>

          {task.description && (
            <p
              className={`text-sm text-slate-500 dark:text-slate-400 mt-1 break-words leading-relaxed ${
                task.completed ? 'text-slate-400/80 dark:text-slate-600' : ''
              }`}
              id={`task-desc-${task.id}`}
            >
              {task.description}
            </p>
          )}

          {/* Focused Timer HUD Panel */}
          {!task.completed && (
            <div
              className={`mt-4 p-4 rounded-xl border transition-all ${
                isTimerRunning
                  ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-250 dark:border-indigo-900/60 shadow-inner'
                  : 'bg-slate-50/60 dark:bg-slate-850/45 border-slate-150 dark:border-slate-800/50'
              }`}
              id={`task-focus-timer-hud-${task.id}`}
            >
              {/* Header metrics */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    {isTimerRunning && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isTimerRunning ? 'bg-indigo-500' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 tracking-wider uppercase">
                    {isTimerRunning ? 'Focusing Active' : 'Focus Timer Queued'}
                  </span>
                </div>

                <div className="text-right">
                  <span id={`elapsed-indicator-${task.id}`} className="text-xs font-mono font-bold text-indigo-650 dark:text-indigo-400">
                    {formatTimeStr(timerSeconds)}
                  </span>
                  <span className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 ml-1">
                    spent
                  </span>
                </div>
              </div>

              {/* Progress bar visual comparison */}
              {task.estimatedMinutes !== undefined && task.estimatedMinutes > 0 && (
                <div className="space-y-1.5 mb-3" id={`timer-progress-bar-wrapper-${task.id}`}>
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    <span>Focus ratio</span>
                    <span>
                      {Math.round(timerSeconds / 60)}m / {task.estimatedMinutes}m total ({Math.min(200, Math.round(((timerSeconds / 60) / task.estimatedMinutes) * 100))}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        (timerSeconds / 60) > task.estimatedMinutes
                          ? 'bg-amber-500'
                          : 'bg-indigo-600 dark:bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, ((timerSeconds / 60) / task.estimatedMinutes) * 105)}%` }} // offset styling
                    />
                  </div>
                </div>
              )}

              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {/* Start / Pause trigger */}
                  <button
                    type="button"
                    onClick={handleToggleTimer}
                    className={`px-3 py-1.5 rounded-lg text-[10.5px] font-extrabold uppercase flex items-center gap-1 transition-all cursor-pointer ${
                      isTimerRunning
                        ? 'bg-indigo-150/80 hover:bg-indigo-200 dark:bg-indigo-950/70 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-250 dark:border-indigo-850'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-sm shadow-indigo-600/10'
                    }`}
                    id={`btn-time-play-${task.id}`}
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start focus</span>
                      </>
                    )}
                  </button>

                  {/* Reset trigger */}
                  <button
                    type="button"
                    onClick={handleResetTimer}
                    disabled={timerSeconds === 0}
                    className={`p-1.5 rounded-lg transition-colors border text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
                      timerSeconds === 0 ? 'opacity-40 cursor-not-allowed' : 'opacity-100'
                    }`}
                    title="Reset focus clock"
                    id={`btn-time-reset-${task.id}`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Adjustments */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAdjustMinutes(-5)}
                    disabled={timerSeconds < 300}
                    className={`px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-[9px] font-extrabold text-slate-600 dark:text-slate-355 rounded-md cursor-pointer ${
                      timerSeconds < 300 ? 'opacity-40 cursor-not-allowed' : 'opacity-100'
                    }`}
                    title="Deduct 5 minutes"
                  >
                    -5m
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustMinutes(5)}
                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-[9px] font-extrabold text-slate-600 dark:text-slate-355 rounded-md cursor-pointer"
                    title="Add 5 minutes"
                  >
                    +5m
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Show logged summary on completed task */}
          {task.completed && task.actualMinutesSpent !== undefined && task.actualMinutesSpent > 0 && (
            <div className="mt-2 text-[10.5px] text-slate-455 dark:text-slate-500 italic flex items-center gap-1 bg-emerald-50/15 dark:bg-slate-900/20 border border-emerald-100/10 dark:border-slate-800/20 px-2.5 py-1.5 rounded-xl w-fit">
              <span>🎯 Total focus time logged: <strong>{formatTimeStr(task.actualMinutesSpent * 60)}</strong></span>
            </div>
          )}
        </div>

        {/* Floating Quick Action Row */}
        <div className="flex items-center gap-1 ml-2 flex-shrink-0" id={`task-actions-wrapper-${task.id}`}>
          {/* Checklist Toggle Button */}
          <button
            type="button"
            onClick={() => setShowSubtasks(!showSubtasks)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${
              showSubtasks
                ? 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-305 bg-indigo-50/50 dark:bg-indigo-950/25'
                : 'text-slate-300 hover:text-slate-550 dark:text-slate-600 dark:hover:text-slate-400'
            }`}
            title="Toggle Checklist Checklist"
            id={`task-checklist-btn-${task.id}`}
          >
            <ListTodo className="w-4 h-4" />
          </button>

          {/* Star/Pin Button */}
          <button
            onClick={() => onTogglePin(task.id)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 group-hover:opacity-100 ${
              task.pinned
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400'
            }`}
            title={task.pinned ? 'Unpin' : 'Pin to top'}
            id={`task-pin-btn-${task.id}`}
          >
            <Pin className={`w-4 h-4 ${task.pinned ? 'fill-amber-500 rotate-45' : ''}`} />
          </button>

          {/* Edit Button */}
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg text-slate-350 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            title="Edit Task"
            id={`task-edit-btn-${task.id}`}
          >
            <Edit className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-lg text-slate-350 hover:text-rose-600 dark:text-slate-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
            title="Delete Task"
            id={`task-delete-btn-${task.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Block 2: Date & Progress Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/60" id={`task-bottom-strip-${task.id}`}>
        {/* Deadline block */}
        {task.deadline ? (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${deadlineTextStyle} ${deadlineBg}`} id={`task-deadline-badge-${task.id}`}>
            <Calendar className="w-4 h-4 text-current" />
            <span>
              {isOverdue && 'Overdue: '}
              {isDueToday && 'Due Today: '}
              {!isOverdue && !isDueToday && 'Due: '}
              {formatDeadline(task.deadline)}
            </span>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic dark:text-slate-600 flex items-center gap-1" id={`no-deadline-holder-${task.id}`}>
            <Calendar className="w-3.5 h-3.5" />
            No due deadline
          </div>
        )}

        {/* Subtask micro-metric bar */}
        {subTasksTotal > 0 && (
          <div className="flex items-center gap-3" id={`task-subtasks-progress-summary-${task.id}`}>
            <span className="text-xs font-semibold text-slate-550 dark:text-slate-400">
              Checklist: {subTasksCompleted}/{subTasksTotal} ({subtasksPercent}%)
            </span>
            <div className="w-20 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${subtasksPercent}%` }}
              />
            </div>

            {/* Toggle collapser */}
            <button
              onClick={() => setShowSubtasks(!showSubtasks)}
              className="p-1 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-450 rounded-md cursor-pointer"
              title={showSubtasks ? 'Hide subtasks' : 'Show subtasks'}
              aria-label="Toggle subtasks section visibility"
              id={`toggle-subtasks-accordion-${task.id}`}
            >
              {showSubtasks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Block 3: checklist sub-tasks detail accordion */}
      {showSubtasks && (
        <div className="mt-4 pl-9 pr-2 py-3 bg-slate-50/70 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-850/40 rounded-2xl flex flex-col gap-2.5 transition-all" id={`subtasks-accordion-list-${task.id}`}>
          {subTasksTotal > 0 ? (
            task.subTasks.map((sub) => (
              <div
                key={sub.id}
                onClick={() => onToggleSubtask(task.id, sub.id)}
                className="flex items-center justify-between gap-2.5 cursor-pointer select-none group/sub text-xs font-medium text-slate-705 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                id={`subtask-item-${task.id}-${sub.id}`}
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <span className="mt-0.5 flex-shrink-0 text-slate-400 dark:text-slate-600 group-hover/sub:text-indigo-600 dark:group-hover/sub:text-indigo-450 transition-colors">
                    {sub.completed ? (
                      <CheckSquare className="w-4 h-4 text-indigo-500 fill-indigo-50 dark:fill-indigo-950/15" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </span>
                  <span className={`break-words leading-tight ${sub.completed ? 'line-through text-slate-405 dark:text-slate-500' : ''}`}>
                    {sub.title}
                  </span>
                </div>
                {/* Trash delete icon */}
                {onDeleteSubtask && (
                  <button
                    type="button"
                    onClick={(e) => handleLocalDeleteSubtask(sub.id, e)}
                    className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all opacity-0 group-hover/sub:opacity-100 cursor-pointer"
                    title="Remove item"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-[11px] text-slate-400 dark:text-slate-500 italic pb-0.5">
              No checklist points yet. Create actions below.
            </div>
          )}

          {/* Inline Addition Input Form */}
          {onAddSubtask && (
            <form onSubmit={handleLocalAddSubtask} className="flex items-center gap-2 mt-1.5 border-t border-slate-200/50 dark:border-slate-800/40 pt-2.5">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Quick add checklist task..."
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg text-xs placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                id={`add-subtask-input-${task.id}`}
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400 rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40"
                title="Append to checklist"
                id={`add-subtask-submit-${task.id}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </motion.div>
  );
}
