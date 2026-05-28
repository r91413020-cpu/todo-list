import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { CheckCircle, Clock, Percent, ShieldAlert, Sparkles, Flame, HelpCircle } from 'lucide-react';

interface StatsDashboardProps {
  tasks: Task[];
}

export function StatsDashboard({ tasks }: StatsDashboardProps) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;

  // Calculate Overdue Tasks
  const todayStr = new Date().toISOString().split('T')[0];
  const overdue = tasks.filter((t) => {
    if (t.completed || !t.deadline) return false;
    return t.deadline < todayStr;
  }).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Active High Priority Count
  const highPriorityPending = tasks.filter((t) => t.priority === 'high' && !t.completed).length;

  // Advanced Focus Metrics (estimated focus allocation)
  const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
  const completedFocusMinutes = tasks.filter((t) => t.completed).reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
  const remainingFocusMinutes = Math.max(0, totalFocusMinutes - completedFocusMinutes);

  const formatHours = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hrs = (mins / 60).toFixed(1);
    return `${hrs}h`;
  };

  // Live Timer Clock for professional header context
  const [timeStr, setTimeStr] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 mb-6" id="stats-dashboard-container">
      {/* Upper premium panel: Time context & Focus Allocation */}
      <div className="bg-gradient-to-tr from-slate-900 via-slate-850 to-indigo-950 text-white rounded-3xl p-5 md:p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-5 transition-all" id="premium-pulse-panel">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.8 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-bold text-indigo-300 uppercase tracking-widest leading-none">
            <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
            Performance Workspace
          </span>
          <h3 className="text-xl font-bold tracking-tight font-display pr-1">Focus Analytics</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Optimize your daily session blocks. The system calculated <span className="text-indigo-300 font-bold">{formatHours(totalFocusMinutes)}</span> allocated across all assigned tasks.
          </p>
        </div>

        {/* Real-time stats widgets */}
        <div className="grid grid-cols-2 sm:flex items-center gap-4 text-left" id="premium-panel-widgets">
          {/* Widget 1: Focus Allocated */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:px-4 sm:py-3.5 min-w-[120px] transition-all hover:bg-white/10">
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">FOCUS REMAINING</span>
            <span className="block text-xl font-extrabold text-amber-300 mt-0.5">{formatHours(remainingFocusMinutes)}</span>
            <span className="block text-[9px] text-slate-500 mt-1">{formatHours(completedFocusMinutes)} completed</span>
          </div>

          {/* Widget 2: Clock Display */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:px-4 sm:py-3.5 min-w-[120px] transition-all hover:bg-white/10">
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">SYSTEM CLOCK</span>
            <span className="block text-md font-bold text-slate-200 mt-1 font-mono tracking-tight">{timeStr || '10:00 AM'}</span>
            <span className="block text-[9px] text-indigo-300 mt-1">UTC/Local Real-time</span>
          </div>
        </div>
      </div>

      {/* Primary responsive grid of counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="stats-dashboard">
        {/* Card 1: Completion Ring Indicator */}
        <div
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 transition-all hover:border-indigo-100 dark:hover:border-indigo-900/50 shadow-sm"
          id="stats-card-completion"
        >
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider">Completed Ratio</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <h4 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">{completionRate}%</h4>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">done</span>
            </div>
            <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Completed count */}
        <div
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 transition-all hover:border-emerald-100 dark:hover:border-emerald-900/50 shadow-sm"
          id="stats-card-completed-count"
        >
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-555 font-bold uppercase tracking-wider">Total Actions</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <h4 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">{completed}</h4>
              <span className="text-[11px] text-slate-450 dark:text-slate-500">/ {total} tasks</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              {total > 0 ? `${Math.round((completed / total) * 100)}% task fidelity` : 'Waiting for tasks'}
            </p>
          </div>
        </div>

        {/* Card 3: Pending Count */}
        <div
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 transition-all hover:border-amber-100 dark:hover:border-amber-900/50 shadow-sm"
          id="stats-card-pending"
        >
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-555 font-bold uppercase tracking-wider">In Progress</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <h4 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">{pending}</h4>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">remaining</span>
            </div>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1">
              {highPriorityPending > 0
                ? `${highPriorityPending} hot high-priorities`
                : 'Zero hot tasks pending'}
            </p>
          </div>
        </div>

        {/* Card 4: Overdue counts */}
        <div
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 transition-all hover:border-rose-100 dark:hover:border-rose-900/50 shadow-sm"
          id="stats-card-overdue"
        >
          <div className={`p-3 rounded-xl transition-colors ${overdue > 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-450' : 'bg-slate-50 text-slate-400 dark:bg-slate-850'}`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-555 font-bold uppercase tracking-wider">Overdue Alert</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <h4 className={`text-xl font-extrabold tracking-tight ${overdue > 0 ? 'text-rose-600 dark:text-rose-450' : 'text-slate-400 dark:text-slate-350'}`}>{overdue}</h4>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">over limit</span>
            </div>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1">
              {overdue > 0 ? 'Requires attention now' : 'All deadlines are secure'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
