import React from 'react';
import { FilterOptions, FilterStatus, Task } from '../types';
import { CATEGORIES } from '../data';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface TaskFiltersProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  tasks: Task[];
}

export function TaskFilters({ filters, setFilters, tasks }: TaskFiltersProps) {
  // Counts of tasks for status tabs
  const todayStr = new Date().toISOString().split('T')[0];
  const countAll = tasks.length;
  const countActive = tasks.filter((t) => !t.completed).length;
  const countCompleted = tasks.filter((t) => t.completed).length;
  const countOverdue = tasks.filter((t) => !t.completed && t.deadline && t.deadline < todayStr).length;

  const handleStatusChange = (status: FilterStatus) => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, category: e.target.value }));
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, priority: e.target.value }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }));
  };

  const toggleSortOrder = () => {
    setFilters((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: 'all',
      category: '',
      priority: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.category !== '' ||
    filters.priority !== '' ||
    filters.search !== '';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm mb-6" id="filters-container">
      {/* Row 1: Search & Status Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Search */}
        <div className="relative lg:col-span-5" id="search-input-wrapper">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search tasks by title or description..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-850 rounded-xl text-sm placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            id="search-input"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Clear search"
              id="clear-search-btn"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Buttons */}
        <div className="flex flex-wrap gap-1.5 lg:col-span-7" id="status-filters-row">
          {(['all', 'active', 'completed', 'overdue'] as FilterStatus[]).map((status) => {
            const isActive = filters.status === status;
            let count = countAll;
            let activeStyle = '';
            let label = 'All';

            if (status === 'all') {
              count = countAll;
              label = 'All';
              activeStyle = 'bg-slate-900 text-white dark:bg-white dark:text-slate-900';
            } else if (status === 'active') {
              count = countActive;
              label = 'Active';
              activeStyle = 'bg-indigo-600 text-white dark:bg-indigo-500';
            } else if (status === 'completed') {
              count = countCompleted;
              label = 'Completed';
              activeStyle = 'bg-emerald-600 text-white dark:bg-emerald-500';
            } else if (status === 'overdue') {
              count = countOverdue;
              label = 'Overdue';
              activeStyle = 'bg-rose-600 text-white dark:bg-rose-500';
            }

            return (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                  isActive
                    ? activeStyle + ' shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350'
                }`}
                id={`status-tab-${status}`}
              >
                <span>{label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-black/10 dark:text-slate-900'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-slate-50 dark:bg-slate-800/60 my-4" />

      {/* Row 2: Secondary Dropdowns & Sorts */}
      <div className="flex flex-wrap items-center justify-between gap-4" id="filters-dropdowns-row">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium" id="filter-controls-icon">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Refine:</span>
          </div>

          {/* Category Selector */}
          <select
            value={filters.category}
            onChange={handleCategoryChange}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-transparent rounded-lg text-slate-700 dark:text-slate-200 outline-none hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer focus:ring-1 focus:ring-indigo-500"
            id="filter-category"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Priority Selector */}
          <select
            value={filters.priority}
            onChange={handlePriorityChange}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-transparent rounded-lg text-slate-700 dark:text-slate-200 outline-none hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer focus:ring-1 focus:ring-indigo-500"
            id="filter-priority"
          >
            <option value="">All Priorities</option>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟡 Low</option>
          </select>

          {/* Sort By Selector */}
          <div className="flex items-center gap-1" id="sort-controls-wrapper">
            <select
              value={filters.sortBy}
              onChange={handleSortByChange}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-transparent rounded-lg text-slate-700 dark:text-slate-200 outline-none hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer focus:ring-1 focus:ring-indigo-500"
              id="filter-sort-by"
            >
              <option value="createdAt">Date Created</option>
              <option value="deadline">Due Date</option>
              <option value="priority">Priority Tier</option>
              <option value="alphabetical">Alphabetical</option>
            </select>

            <button
              onClick={toggleSortOrder}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg text-slate-600 dark:text-slate-300 cursor-pointer"
              title={`Sorting: ${filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              id="sort-order-toggle-btn"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Clear Trigger */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 cursor-pointer"
            id="clear-filters-btn"
          >
            <X className="w-3 h-3" />
            Clear Active Filters
          </button>
        )}
      </div>
    </div>
  );
}
