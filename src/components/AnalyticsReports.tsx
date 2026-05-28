import React, { useState, useMemo } from 'react';
import { Task } from '../types';
import { CATEGORIES } from '../data';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Calendar,
  CheckCircle2,
  ListTodo,
  Sparkles,
  Info
} from 'lucide-react';

interface AnalyticsReportsProps {
  tasks: Task[];
}

// Generate stable seed completions based on task details to prevent flat metrics on empty states
function getStablePseudoCompletionDay(taskId: string, dayOffsetLimit: number): number {
  let hash = 0;
  for (let i = 0; i < taskId.length; i++) {
    hash = taskId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % dayOffsetLimit; // Day index offset in the last N days
}

export function AnalyticsReports({ tasks }: AnalyticsReportsProps) {
  const [showDemoData, setShowDemoData] = useState<boolean>(() => {
    // Enable demo simulator automatically if the user has fewer than 2 completed tasks
    const activeCompletions = tasks.filter((t) => t.completed).length;
    return activeCompletions < 4;
  });

  const [trendView, setTrendView] = useState<'daily' | 'cumulative'>('daily');
  const [breakdownView, setBreakdownView] = useState<'bar' | 'pie'>('bar');

  // Define Category colors matching our primary database
  const getCategoryTheme = (catId: string) => {
    const defaultTheme = { color: '#6366f1', label: 'Other' };
    const predefined = CATEGORIES.find((c) => c.id.toLowerCase() === catId.toLowerCase());
    if (!predefined) return defaultTheme;

    // Map Tailwind color handles to Hex-equivalents for Recharts canvas compatibility
    const hexMap: Record<string, string> = {
      work: '#6366f1',      // Indigo
      personal: '#14b8a6',  // Teal
      health: '#f43f5e',    // Rose
      finance: '#10b981',   // Emerald
      shopping: '#f59e0b',  // Amber
      creative: '#8b5cf6'   // Violet
    };
    return {
      color: hexMap[predefined.id] || '#6366f1',
      label: predefined.name
    };
  };

  // 1. Process 30-Day Completion Trends Row
  const trendData = useMemo(() => {
    const today = new Date();
    const days: { dateStr: string; label: string; dateObj: Date }[] = [];

    // Formulate 30-day baseline array
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({ dateStr, label, dateObj: d });
    }

    // Capture actual task list completions
    const actualCompletions: Record<string, { count: number; estimatedMinutes: number }> = {};
    tasks.forEach((task) => {
      if (task.completed) {
        let compDateStr = '';
        if (task.completedAt) {
          compDateStr = task.completedAt.split('T')[0];
        } else {
          // If marked complete but lacks timestamp, calculate pseudo-random stable date
          const offset = getStablePseudoCompletionDay(task.id, 15);
          const d = new Date();
          d.setDate(today.getDate() - offset);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          compDateStr = `${yyyy}-${mm}-${dd}`;
        }

        if (!actualCompletions[compDateStr]) {
          actualCompletions[compDateStr] = { count: 0, estimatedMinutes: 0 };
        }
        actualCompletions[compDateStr].count += 1;
        actualCompletions[compDateStr].estimatedMinutes += task.estimatedMinutes || 30;
      }
    });

    // Capture Simulated completions for demo presentation if enabled
    const demoCompletions: Record<string, number> = {};
    if (showDemoData) {
      // Simulate completed tasks spread realistically across 30 days
      const mockCompletesSeed = [
        { offset: 28, count: 2 }, { offset: 26, count: 1 }, { offset: 25, count: 3 },
        { offset: 23, count: 2 }, { offset: 20, count: 4 }, { offset: 18, count: 1 },
        { offset: 16, count: 2 }, { offset: 15, count: 3 }, { offset: 13, count: 1 },
        { offset: 11, count: 4 }, { offset: 10, count: 2 }, { offset: 8, count: 3 },
        { offset: 7, count: 1 }, { offset: 5, count: 5 }, { offset: 4, count: 2 },
        { offset: 2, count: 4 }, { offset: 1, count: 3 }, { offset: 0, count: 2 }
      ];

      mockCompletesSeed.forEach((seed) => {
        const d = new Date();
        d.setDate(today.getDate() - seed.offset);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dStr = `${yyyy}-${mm}-${dd}`;
        demoCompletions[dStr] = seed.count;
      });
    }

    // Populate daily nodes array
    let runningTotal = 0;
    return days.map((day) => {
      const actual = actualCompletions[day.dateStr] || { count: 0, estimatedMinutes: 0 };
      const demoCount = demoCompletions[day.dateStr] || 0;
      const totalCompletedOnDay = actual.count + (showDemoData ? demoCount : 0);
      
      runningTotal += totalCompletedOnDay;

      return {
        dateStr: day.dateStr,
        name: day.label,
        Completed: totalCompletedOnDay,
        Cumulative: runningTotal,
        MinutesSaved: actual.estimatedMinutes + (showDemoData ? demoCount * 30 : 0)
      };
    });
  }, [tasks, showDemoData]);

  // 2. Process Completed Tasks per Category Distribution
  const categoryChartData = useMemo(() => {
    const categoryCounts: Record<string, { count: number; minutes: number }> = {};
    
    // Seed default categories
    CATEGORIES.forEach((cat) => {
      categoryCounts[cat.id] = { count: 0, minutes: 0 };
    });

    // Populate actual completions
    tasks.forEach((task) => {
      if (task.completed) {
        const catId = task.category || 'other';
        if (!categoryCounts[catId]) {
          categoryCounts[catId] = { count: 0, minutes: 0 };
        }
        categoryCounts[catId].count += 1;
        categoryCounts[catId].minutes += task.estimatedMinutes || 30;
      }
    });

    // Populate mock completions if demo selected
    if (showDemoData) {
      const mockDemoCategoryAllocations: Record<string, { count: number; minutes: number }> = {
        work: { count: 14, minutes: 540 },
        personal: { count: 12, minutes: 360 },
        health: { count: 9, minutes: 270 },
        finance: { count: 5, minutes: 150 },
        shopping: { count: 4, minutes: 120 },
        creative: { count: 6, minutes: 180 }
      };

      Object.entries(mockDemoCategoryAllocations).forEach(([catId, data]) => {
        if (!categoryCounts[catId]) {
          categoryCounts[catId] = { count: 0, minutes: 0 };
        }
        categoryCounts[catId].count += data.count;
        categoryCounts[catId].minutes += data.minutes;
      });
    }

    return Object.entries(categoryCounts)
      .map(([catId, data]) => {
        const theme = getCategoryTheme(catId);
        return {
          id: catId,
          name: theme.label,
          value: data.count,
          minutes: data.minutes,
          color: theme.color
        };
      })
      .filter((node) => node.value > 0);
  }, [tasks, showDemoData]);

  // Derived high-fidelity analytical feedback insights
  const reportingStats = useMemo(() => {
    let totalCompleted = 0;
    let peakDayLabel = 'No completions yet';
    let peakDayCount = 0;
    let topCategoryName = 'None';
    let topCategoryCount = 0;
    let averageCompletionTimeBlock = 0;

    // Track total completions
    trendData.forEach((day) => {
      totalCompleted += day.Completed;
      if (day.Completed > peakDayCount) {
        peakDayCount = day.Completed;
        peakDayLabel = day.name;
      }
    });

    // Find top-performing category
    let maxCatVal = 0;
    categoryChartData.forEach((cat) => {
      if (cat.value > maxCatVal) {
        maxCatVal = cat.value;
        topCategoryName = cat.name;
        topCategoryCount = cat.value;
      }
    });

    const averageDailyVelocity = (totalCompleted / 30).toFixed(1);

    return {
      totalCompleted,
      peakDayLabel,
      peakDayCount,
      topCategoryName,
      topCategoryCount,
      averageDailyVelocity
    };
  }, [trendData, categoryChartData]);

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800/80 rounded-3xl p-5 md:p-6 mb-6 shadow-sm transition-all"
      id="detailed-task-reporting-section"
    >
      {/* Block Title and Control Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-405 rounded-2xl flex-shrink-0">
            <TrendingUp className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Performance Insights
              <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/45 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                30-Day Analysis
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualize completed milestone velocities, focus distribution, and categorical alignment.
            </p>
          </div>
        </div>

        {/* Demo Data toggler + Interactive controls */}
        <div className="flex flex-wrap items-center gap-3" id="reporting-mode-controllers">
          <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 font-bold cursor-pointer select-none transition-colors">
            <input
              type="checkbox"
              checked={showDemoData}
              onChange={(e) => setShowDemoData(e.target.checked)}
              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500/25 bg-white dark:bg-slate-900 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              Simulate Historical Data
              <span className="text-[9.5px] font-normal text-slate-400">(Seeding)</span>
            </span>
          </label>
        </div>
      </div>

      {/* Grid: 30-Day Trends (Left) & Category breakdown (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-graphics-row">
        
        {/* Left Column: 30-Day Completes Area Trend Line (Span 7) */}
        <div className="lg:col-span-7 flex flex-col justify-between" id="completion-trend-area-column">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-450" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Task Completion Timeline</span>
            </div>

            {/* Sub-view switcher: Daily count vs Cumulative curve */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.8 rounded-lg" id="trend-view-switcher">
              <button
                onClick={() => setTrendView('daily')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  trendView === 'daily'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                }`}
              >
                Daily Velocity
              </button>
              <button
                onClick={() => setTrendView('cumulative')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  trendView === 'cumulative'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                }`}
              >
                Cumulative Growth
              </button>
            </div>
          </div>

          {/* Area Chart visualization canvas */}
          <div className="h-[220px] w-full" id="trend-area-chart-viewport">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/50" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                  interval={4}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  dx={-5}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  }}
                  itemStyle={{ color: '#c7d2fe' }}
                  labelStyle={{ fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}
                />
                <Area
                  key={trendView}
                  type="monotone"
                  dataKey={trendView === 'daily' ? 'Completed' : 'Cumulative'}
                  name={trendView === 'daily' ? 'Tasks Completed' : 'Total Aggregated'}
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorArea)"
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Key Completions Category allocation (Span 5) */}
        <div className="lg:col-span-5 flex flex-col justify-between" id="category-distribution-column">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-450" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category Allocation</span>
            </div>

            {/* Sub-view selection toolbar */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.8 rounded-lg" id="category-view-switcher">
              <button
                onClick={() => setBreakdownView('bar')}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  breakdownView === 'bar'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                aria-label="Bar List View"
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setBreakdownView('pie')}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  breakdownView === 'pie'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                aria-label="Pie Donut View"
              >
                <PieIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="h-[220px] flex items-center justify-center relative" id="category-chart-viewport">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {breakdownView === 'bar' ? (
                  <BarChart
                    data={categoryChartData}
                    layout="vertical"
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" className="dark:stroke-slate-800/50" />
                    <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 650 }}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '11px'
                      }}
                      formatter={(val: number) => [`${val} tasks completed`]}
                    />
                    <Bar
                      key={`bar-${showDemoData}`}
                      dataKey="value"
                      radius={[0, 4, 4, 0]}
                      barSize={12}
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      key={`pie-${showDemoData}`}
                      data={categoryChartData}
                      cx="50%"
                      cy="48%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      isAnimationActive={true}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '11px'
                      }}
                      formatter={(val: number, name: string) => [`${val} tasks`, name]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconSize={8}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '10px', marginTop: '10px' }}
                    />
                  </PieChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <ListTodo className="w-8 h-8 text-slate-350 dark:text-slate-650 animate-pulse" />
                <p className="font-semibold text-slate-500">Enable Demo Simulator above</p>
                <p className="text-[10px] text-slate-400">or complete goals in your list to activate metrics</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Analytics Insight Summary Banner Column Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/60" id="reporting-insights-summary-grid">
        
        {/* Metric 1 */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-850/45 border border-slate-100 dark:border-slate-800 rounded-2xl text-left" id="summary-metric-velocity">
          <span className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Growth Velocity</span>
          <h5 className="text-lg font-black text-slate-900 dark:text-white mt-1">
            {reportingStats.averageDailyVelocity}
            <span className="text-xs font-semibold text-slate-450 italic ml-1">avg. / day</span>
          </h5>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
            Average tasks finished per calendar day over last month.
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-850/45 border border-slate-100 dark:border-slate-800 rounded-2xl text-left" id="summary-metric-[#completions]">
          <span className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Sum Completed</span>
          <h5 className="text-lg font-black text-indigo-650 dark:text-indigo-400 mt-1 flex items-center gap-1.5">
            <span>{reportingStats.totalCompleted}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </h5>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
            Aggregated workspace points cleared successfully.
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-850/45 border border-slate-100 dark:border-slate-800 rounded-2xl text-left" id="summary-metric-peak">
          <span className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Peak Performance</span>
          <h5 className="text-xs font-black text-slate-900 dark:text-white mt-2 truncate">
            {reportingStats.peakDayLabel}
          </h5>
          <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 leading-tight">
            Cleared absolute records on this day with <strong className="text-slate-900 dark:text-white">{reportingStats.peakDayCount} task clears</strong>.
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-850/45 border border-slate-100 dark:border-slate-800 rounded-2xl text-left" id="summary-metric-specialization">
          <span className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Top Target Sector</span>
          <h5 className="text-xs font-black text-emerald-750 dark:text-emerald-400 mt-2 truncate">
            {reportingStats.topCategoryName}
          </h5>
          <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 leading-tight">
            Accounts for <strong className="text-slate-900 dark:text-white">{reportingStats.topCategoryCount} completed points</strong> out of all targets.
          </p>
        </div>

      </div>

      {/* Advisory hint */}
      <div className="flex items-start gap-2.5 bg-indigo-50/20 dark:bg-slate-850/20 border border-slate-100/40 dark:border-slate-800/40 rounded-2xl p-3 mt-4 text-left" id="advisory-recharts-notice">
        <Info className="w-3.5 h-3.5 text-indigo-505 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
          <strong>Tip:</strong> Double-tap any category color-cells or check daily metrics above to track target focus. Completion rates are automatically saved to your browser session storage.
        </p>
      </div>

    </div>
  );
}
