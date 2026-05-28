import React, { useState, useEffect, useMemo } from 'react';
import { Task, FilterOptions, ToastMessage } from './types';
import { DEFAULT_TASKS, CATEGORIES } from './data';
import { StatsDashboard } from './components/StatsDashboard';
import { FocusCoach } from './components/FocusCoach';
import { QuickScratchpad } from './components/QuickScratchpad';
import { AnalyticsReports } from './components/AnalyticsReports';
import { QuickTaskAdder } from './components/QuickTaskAdder';
import { NotificationScheduler } from './components/NotificationScheduler';
import { TaskFilters } from './components/TaskFilters';
import { TaskItem } from './components/TaskItem';
import { TaskForm } from './components/TaskForm';
import { ImportExportModal } from './components/ImportExportModal';
import { ToastContainer } from './components/Toast';
import { Plus, Download, Moon, Sun, ClipboardCheck, Sparkles, PlusCircle, Trash2, Check, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  // Theme dark mode resolution
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('todo_dark_mode');
    if (saved) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Active tasks databases
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('todo_tasks_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_TASKS;
      }
    }
    return DEFAULT_TASKS;
  });

  // Filter configurations
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    category: '',
    priority: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Toast stacks
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Dialog triggers
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  // Selected tasks for bulk operations
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('todo_tasks_data', JSON.stringify(tasks));
  }, [tasks]);

  // Sync dark theme DOM rules
  useEffect(() => {
    localStorage.setItem('todo_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Toast dispatch interface
  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Toggle check/uncheck status
  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          addToast(
            nextCompleted
              ? `Congratulations! Task Completed: "${t.title}"`
              : `Task reset to active status: "${t.title}"`,
            nextCompleted ? 'success' : 'info'
          );

          // If completed, we can also check all sub-tasks!
          const nextSubTasks = t.subTasks.map((sub) => ({
            ...sub,
            completed: nextCompleted ? true : sub.completed,
          }));

          return {
            ...t,
            completed: nextCompleted,
            subTasks: nextSubTasks,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  // Toggle Pinned status
  const handleTogglePin = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextPin = !t.pinned;
          addToast(
            nextPin ? `Pinned "${t.title}" to top!` : `Unpinned "${t.title}"`,
            'info'
          );
          return { ...t, pinned: nextPin };
        }
        return t;
      })
    );
  };

  // Toggle inline checklist status
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextSubTasks = t.subTasks.map((sub) => {
            if (sub.id === subtaskId) {
              return { ...sub, completed: !sub.completed };
            }
            return sub;
          });

          // Check if all subtasks are completed now
          const allCompleted = nextSubTasks.length > 0 && nextSubTasks.every((sub) => sub.completed);
          let nextCompleted = t.completed;
          let completedAt = t.completedAt;

          // Auto-mark parent complete if all subtasks completed (if parent was incomplete)
          if (allCompleted && !t.completed) {
            nextCompleted = true;
            completedAt = new Date().toISOString();
            addToast(`Checklist complete! Auto-completed parent: "${t.title}"`, 'success');
          } else if (!allCompleted && t.completed && t.subTasks.some((st) => st.id === subtaskId && st.completed)) {
            // If parent was complete, but a subtask gets unchecked, optional logic. Let's keep parent complete or uncheck.
            // Let's keep it complete for flexibility, but update subtask checks.
          }

          return { ...t, subTasks: nextSubTasks, completed: nextCompleted, completedAt };
        }
        return t;
      })
    );
  };

  const handleAddSubtask = (taskId: string, title: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newSub = {
            id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: title.trim(),
            completed: false,
          };
          return {
            ...t,
            subTasks: [...t.subTasks, newSub],
            completed: false, // reset parent completed since there is a new pending subtask
          };
        }
        return t;
      })
    );
    addToast(`Added checklist item: "${title}"`, 'success');
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const filteredSubs = t.subTasks.filter((sub) => sub.id !== subtaskId);
          
          // Re-evaluate parent completion if all remaining subtasks are completed (if any)
          const allCompleted = filteredSubs.length > 0 && filteredSubs.every((sub) => sub.completed);
          let nextCompleted = t.completed;
          let completedAt = t.completed; // fallback
          if (allCompleted && !t.completed) {
            nextCompleted = true;
            completedAt = new Date().toISOString();
          }

          return {
            ...t,
            subTasks: filteredSubs,
            completed: nextCompleted,
            completedAt,
          };
        }
        return t;
      })
    );
    addToast('Removed checklist item.', 'info');
  };

  // Save changes block (Inserting / Updating)
  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => {
    if (taskData.id) {
      // Editing
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskData.id) {
            return {
              ...t,
              ...taskData,
            } as Task;
          }
          return t;
        })
      );
      addToast(`Changes saved successfully for "${taskData.title}"`, 'success');
      setEditTask(null);
    } else {
      // Adding
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString(),
      } as Task;

      setTasks((prev) => [newTask, ...prev]);
      addToast(`Successfully created task "${newTask.title}"`, 'success');
    }
  };

  // Batch insertion function for task extractor from quick notepad
  const handleAddBatchTasks = (titles: string[]) => {
    const newTasksList = titles.map((title, idx) => {
      return {
        id: `task-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        title,
        description: 'Extracted directly from Quick Workspace Scratchpad notes',
        category: 'General',
        priority: 'medium',
        completed: false,
        subTasks: [],
        pinned: false,
        createdAt: new Date().toISOString(),
        estimatedMinutes: 30
      } as Task;
    });

    setTasks((prev) => [...newTasksList, ...prev]);
  };

  const handleUpdateTimeSpent = (taskId: string, minutes: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            actualMinutesSpent: minutes,
          };
        }
        return t;
      })
    );
  };

  // Deletion block
  const handleDeleteTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    addToast(target ? `Deleted task "${target.title}"` : 'Task removed successfully.', 'info');
  };

  // JSON importer
  const handleImportTasks = (importedTasks: Task[]) => {
    setTasks((prev) => {
      // We can append or completely overwrite. Overwriting ensures pristine backups but appending keeps user safety!
      // Let's merge them by avoiding ID collisions. We prepend them to make them immediate!
      const existingIds = new Set(prev.map((t) => t.id));
      const cleanImports = importedTasks.map((t) => {
        if (existingIds.has(t.id)) {
          return { ...t, id: `imported-task-collision-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` };
        }
        return t;
      });
      return [...cleanImports, ...prev];
    });
    addToast(`Successfully restored ${importedTasks.length} tasks!`, 'success');
  };

  // Multi-selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTaskIds((prev) => {
        const next = new Set([...prev, ...processedTasks.map((t) => t.id)]);
        return Array.from(next);
      });
    } else {
      const visibleIds = new Set(processedTasks.map((t) => t.id));
      setSelectedTaskIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    }
  };

  const handleBulkComplete = () => {
    if (selectedTaskIds.length === 0) return;
    const count = selectedTaskIds.length;
    setTasks((prev) =>
      prev.map((t) => {
        if (selectedTaskIds.includes(t.id)) {
          const nextSubTasks = t.subTasks.map((sub) => ({ ...sub, completed: true }));
          return { ...t, completed: true, subTasks: nextSubTasks };
        }
        return t;
      })
    );
    setSelectedTaskIds([]);
    addToast(`Successfully completed ${count} selected tasks!`, 'success');
  };

  const handleBulkDelete = () => {
    if (selectedTaskIds.length === 0) return;
    const count = selectedTaskIds.length;
    setTasks((prev) => prev.filter((t) => !selectedTaskIds.includes(t.id)));
    setSelectedTaskIds([]);
    addToast(`Successfully deleted ${count} selected tasks!`, 'success');
  };

  const handleClearSelection = () => {
    setSelectedTaskIds([]);
  };

  // Filter and Sort Processing
  const processedTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. FILTERING
    const filtered = tasks.filter((t) => {
      // Status
      if (filters.status === 'completed' && !t.completed) return false;
      if (filters.status === 'active' && t.completed) return false;
      if (filters.status === 'overdue' && (t.completed || !t.deadline || t.deadline >= todayStr)) return false;

      // Category
      if (filters.category && t.category !== filters.category) return false;

      // Priority
      if (filters.priority && t.priority !== filters.priority) return false;

      // Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = t.description?.toLowerCase().includes(query) || false;
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });

    // 2. SORTING
    return filtered.sort((a, b) => {
      let comparison = 0;

      // Primary criteria
      if (filters.sortBy === 'createdAt') {
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (filters.sortBy === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        comparison = a.deadline.localeCompare(b.deadline);
      } else if (filters.sortBy === 'priority') {
        const priorityWeights = { high: 3, medium: 2, low: 1 };
        comparison = priorityWeights[b.priority] - priorityWeights[a.priority];
      } else if (filters.sortBy === 'alphabetical') {
        comparison = a.title.localeCompare(b.title);
      }

      // Reversing for order direction
      return filters.sortOrder === 'asc' ? comparison * -1 : comparison;
    });
  }, [tasks, filters]);

  // Split processed tasks into Favorites/Pinned and General list to always render Pinned at the absolute top!
  // This is highly appreciated for senior workflow organizing.
  const { pinnedTasks, generalTasks } = useMemo(() => {
    const pinned = processedTasks.filter((t) => t.pinned);
    const general = processedTasks.filter((t) => !t.pinned);
    return { pinnedTasks: pinned, generalTasks: general };
  }, [processedTasks]);

  // Dynamic extraction of categories found inside active tasks (including custom user entries)
  const allUsedCategories = useMemo(() => {
    const activeStats: Record<string, number> = {};
    const totalStats: Record<string, number> = {};
    
    tasks.forEach((t) => {
      const catKey = (t.category || 'other').trim().toLowerCase();
      totalStats[catKey] = (totalStats[catKey] || 0) + 1;
      if (!t.completed) {
        activeStats[catKey] = (activeStats[catKey] || 0) + 1;
      }
    });

    const categoriesList = CATEGORIES.map((c) => {
      const key = c.id.toLowerCase();
      return {
        id: c.id,
        name: c.name,
        activeCount: activeStats[key] || 0,
        totalCount: totalStats[key] || 0,
        isCustom: false,
      };
    });

    // Capture dynamic custom categories
    tasks.forEach((t) => {
      if (t.category) {
        const key = t.category.trim().toLowerCase();
        const exists = CATEGORIES.some((c) => c.id.toLowerCase() === key);
        if (!exists) {
          const titleCase = t.category.trim().charAt(0).toUpperCase() + t.category.trim().slice(1);
          // Prevent duplicates
          if (!categoriesList.some((c) => c.id.toLowerCase() === key)) {
            categoriesList.push({
              id: key,
              name: titleCase,
              activeCount: activeStats[key] || 0,
              totalCount: totalStats[key] || 0,
              isCustom: true,
            });
          }
        }
      }
    });

    return categoriesList;
  }, [tasks]);

  // Premium dynamic welcome title based on user time-of-day
  const greetingText = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Bulk selection calculated values
  const isAllSelected = useMemo(() => {
    if (processedTasks.length === 0) return false;
    return processedTasks.every((t) => selectedTaskIds.includes(t.id));
  }, [processedTasks, selectedTaskIds]);

  const isSomeSelected = useMemo(() => {
    if (processedTasks.length === 0) return false;
    const selectedCount = processedTasks.filter((t) => selectedTaskIds.includes(t.id)).length;
    return selectedCount > 0 && selectedCount < processedTasks.length;
  }, [processedTasks, selectedTaskIds]);

  const selectAllRef = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  const handleEditClick = (task: Task) => {
    setEditTask(task);
    setIsFormOpen(true);
  };

  const handleCreateNewClick = () => {
    setEditTask(null);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-all duration-250" id="main-app-viewport">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 transition-all" id="app-header">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5" id="header-brand-box">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/10">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-md font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-display">PriorityFlow</h1>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold tracking-widest uppercase">Global Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3" id="header-controls-wrapper">
            {/* Quick backup trigger */}
            <button
              onClick={() => setIsExportOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-850 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Cloud Backups Import/Export"
              id="header-backup-trigger-btn"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Backup</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-slate-50 border border-slate-100 hover:bg-slate-100 dark:bg-slate-850 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
              title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle visual theme palette"
              id="header-theme-toggle-btn"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6" id="welcome-action-row">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2 font-display">
              {greetingText}
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            </h2>
            <p className="text-sm text-slate-550 dark:text-slate-400 mt-0.5">
              Refine your daily objectives, create checklists, and track milestones.
            </p>
          </div>

          {/* Core Wide Add Action */}
          <button
            onClick={handleCreateNewClick}
            className="w-full md:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 dark:shadow-none hover:translate-y-[-1px] transition-all cursor-pointer"
            id="workspace-add-task-btn"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create New Task</span>
          </button>
        </div>

        {/* Dashboard Panels */}
        <StatsDashboard tasks={tasks} />

        {/* Local Task Deadline Alarm & Notification Scheduler */}
        <NotificationScheduler tasks={tasks} addToast={addToast} />

        {/* Quick Instant Task Adder */}
        <QuickTaskAdder onAddTask={handleSaveTask} addToast={addToast} />

        {/* Executive 30-Day Performance Visualizer */}
        <AnalyticsReports tasks={tasks} />

        {/* Executive GenAI Advisory Assistant */}
        <FocusCoach tasks={tasks} />

        {/* Quick Notepad & Workspace Notes */}
        <QuickScratchpad onAddTasks={handleAddBatchTasks} addToast={addToast} />

        {/* Sleek Horizontal Quick Category Badge Slider */}
        <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm" id="quick-category-tabs-container">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-0.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-505" />
              Quick Category Filter
            </span>
            {filters.category && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, category: '' }))}
                className="text-[11px] text-indigo-600 hover:text-indigo-805 dark:text-indigo-400 dark:hover:text-indigo-300 font-extrabold cursor-pointer hover:underline"
              >
                Reset Filter
              </button>
            )}
          </div>
          <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar scroll-smooth snap-x">
            {/* "All" category pill */}
            <button
              onClick={() => setFilters((prev) => ({ ...prev, category: '' }))}
              className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold cursor-pointer select-none transition-all duration-200 shadow-sm flex-shrink-0 snap-start ${
                !filters.category
                  ? 'bg-indigo-600 text-white dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 scale-102 font-extrabold shadow-md shadow-indigo-600/10'
                  : 'bg-slate-50 dark:bg-slate-850 border-slate-100 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-[13px]">🌐</span>
              <span>All Workspace</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                !filters.category
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-750 text-slate-600 dark:text-slate-400'
              }`}>
                {tasks.length}
              </span>
            </button>

            {/* Predefined & Custom Categories */}
            {allUsedCategories.map((cat) => {
              const isActive = filters.category.toLowerCase() === cat.id.toLowerCase();
              
              // Map Emojis dynamically
              const emojiMap: Record<string, string> = {
                work: '💼',
                personal: '👤',
                health: '🏃',
                finance: '💳',
                shopping: '🛒',
                creative: '🎨',
              };
              const emojiValue = emojiMap[cat.id.toLowerCase()] || '🏷️';

              return (
                <button
                  key={cat.id}
                  onClick={() => setFilters((prev) => ({ ...prev, category: isActive ? '' : cat.id }))}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold cursor-pointer select-none transition-all duration-200 shadow-sm flex-shrink-0 snap-start ${
                    isActive
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 scale-102 font-bold shadow-md shadow-indigo-600/10'
                      : 'bg-slate-50 dark:bg-slate-850 border-slate-100 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-[13px]">{emojiValue}</span>
                  <span>{cat.name}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-750 text-slate-600 dark:text-slate-400'
                  }`}>
                    {cat.totalCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters and Refiner Toolbars */}
        <TaskFilters filters={filters} setFilters={setFilters} tasks={tasks} />

        {/* Dynamic Select All checkbox banner */}
        {processedTasks.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl mb-4 text-xs font-semibold text-slate-600 dark:text-slate-400 shadow-sm transition-all animate-fade-in" id="select-all-banner-bar">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={selectAllRef}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/25 cursor-pointer bg-slate-50 dark:bg-slate-850"
                id="select-all-checkbox"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Select All shown ({processedTasks.length})</span>
            </label>
            {selectedTaskIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-md text-[10px]">
                  {selectedTaskIds.length} Selected
                </span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-slate-450 hover:text-slate-600 dark:hover:text-slate-200 text-[11px] underline cursor-pointer font-semibold"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dynamic task stack render list */}
        <div className="space-y-4" id="task-card-stream-container">
          <AnimatePresence mode="popLayout">
            {/* Pinned / Starred Focus Section */}
            {pinnedTasks.length > 0 && (
              <div className="space-y-3" id="pinned-tasks-section-wrapper" key="section-pinned">
                <div className="flex items-center gap-1.5 px-1 py-0.5" id="section-pinned-banner">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Pinned Priorities ({pinnedTasks.length})
                  </span>
                </div>
                {pinnedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    isSelected={selectedTaskIds.includes(task.id)}
                    onToggleSelect={handleToggleSelect}
                    onToggleComplete={handleToggleComplete}
                    onTogglePin={handleTogglePin}
                    onToggleSubtask={handleToggleSubtask}
                    onAddSubtask={handleAddSubtask}
                    onDeleteSubtask={handleDeleteSubtask}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteTask}
                    onUpdateTimeSpent={handleUpdateTimeSpent}
                  />
                ))}
                {generalTasks.length > 0 && <div className="h-1 bg-slate-100 dark:bg-slate-900/60 rounded-full my-4" />}
              </div>
            )}

            {/* General Action items */}
            {generalTasks.length > 0 && (
              <div className="space-y-3" id="general-tasks-section-wrapper" key="section-general">
                {pinnedTasks.length > 0 && (
                  <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1 py-0.5">
                    General Objectives ({generalTasks.length})
                  </span>
                )}
                {generalTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    isSelected={selectedTaskIds.includes(task.id)}
                    onToggleSelect={handleToggleSelect}
                    onToggleComplete={handleToggleComplete}
                    onTogglePin={handleTogglePin}
                    onToggleSubtask={handleToggleSubtask}
                    onAddSubtask={handleAddSubtask}
                    onDeleteSubtask={handleDeleteSubtask}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteTask}
                    onUpdateTimeSpent={handleUpdateTimeSpent}
                  />
                ))}
              </div>
            )}

            {/* Pristine Empty placeholder */}
            {processedTasks.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-12 text-center rounded-3xl"
                id="empty-task-placeholder"
                key="section-empty"
              >
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-900/10">
                  <ClipboardCheck className="w-7 h-7" />
                </div>
                <h3 className="text-md font-bold text-slate-905 dark:text-slate-100">No active tasks match current parameters</h3>
                <p className="text-xs text-slate-450 dark:text-slate-400 mt-1.5 max-w-sm mx-auto">
                  {tasks.length === 0
                    ? 'Your schedule is currently blank. Generate a brand new objective to begin planning your workspace.'
                    : 'Try clearing active refinements or searching different titles to locate your tasks.'}
                </p>
                {tasks.length > 0 && (
                  <button
                    onClick={() =>
                      setFilters({
                        status: 'all',
                        category: '',
                        priority: '',
                        search: '',
                        sortBy: 'createdAt',
                        sortOrder: 'desc',
                      })
                    }
                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    id="empty-state-clear-btn"
                  >
                    Reset All Refinement Queries
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-6 text-center border-t border-slate-100 dark:border-slate-900 text-xs text-slate-400 dark:text-slate-500 font-medium" id="app-footer">
        <p>© 2026 Todo List • Designed with workspace refinement tools.</p>
      </footer>

      {/* Form creation drawer */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditTask(null);
        }}
        onSave={handleSaveTask}
        editTask={editTask}
      />

      {/* Cloud JSON Backup Drawer */}
      <ImportExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        tasks={tasks}
        onImport={handleImportTasks}
        addToast={addToast}
      />

      {/* Custom Toast micro overlays */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Floating Bulk Actions Toolbar */}
      <AnimatePresence>
        {selectedTaskIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-slate-100 dark:bg-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl border border-slate-800 dark:border-slate-205 flex items-center gap-4 max-w-md w-[calc(100%-2rem)] md:w-auto"
            id="bulk-actions-toolbar"
          >
            <div className="text-xs font-bold leading-none select-none flex-shrink-0 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white dark:bg-indigo-600 font-extrabold text-[10px]">
                {selectedTaskIds.length}
              </span>
              <span>selected</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-700 dark:bg-slate-350 self-center flex-shrink-0" />
            <div className="flex items-center gap-1.5 flex-1 justify-end">
              <button
                onClick={handleBulkComplete}
                className="px-3.5 py-1.8 bg-slate-800 hover:bg-slate-750 dark:bg-slate-100 dark:hover:bg-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                title="Mark Selected as Complete"
                id="bulk-complete-btn"
              >
                <Check className="w-3.5 h-3.5 text-emerald-450 dark:text-emerald-600" />
                <span>Complete</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3.5 py-1.8 bg-rose-600/90 hover:bg-rose-600 text-xs font-bold text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-650/10"
                title="Delete Selected Tasks"
                id="bulk-delete-btn"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
              <button
                onClick={handleClearSelection}
                className="p-1.5 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg text-slate-400 dark:text-slate-500 cursor-pointer transition-colors"
                title="Deselect All"
                id="bulk-deselect-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
