export type Priority = 'high' | 'medium' | 'low';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: Priority;
  deadline?: string;
  completed: boolean;
  subTasks: SubTask[];
  pinned: boolean;
  createdAt: string;
  estimatedMinutes?: number; // Estimated duration for High-End tier-1 time blocking
  actualMinutesSpent?: number; // Real-time session focus tracked minutes
  completedAt?: string; // Record timestamp when marked complete for reporting
}

export interface ScratchpadNote {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  updatedAt: string;
}

export type FilterStatus = 'all' | 'active' | 'completed' | 'overdue';

export interface FilterOptions {
  status: FilterStatus;
  category: string;
  priority: string;
  search: string;
  sortBy: 'createdAt' | 'deadline' | 'priority' | 'alphabetical';
  sortOrder: 'asc' | 'desc';
}

export interface CategoryInfo {
  id: string;
  name: string;
  color: string; // Tailwind class background
  textColor: string; // Tailwind class text color
  iconName: string; // name of Lucide icon
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
