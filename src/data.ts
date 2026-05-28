import { CategoryInfo, Task } from './types';

export const CATEGORIES: CategoryInfo[] = [
  { id: 'work', name: 'Work', color: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/60', textColor: 'text-indigo-700 dark:text-indigo-300', iconName: 'Briefcase' },
  { id: 'personal', name: 'Personal', color: 'bg-teal-50 dark:bg-teal-950/40 border-teal-100 dark:border-teal-900/60', textColor: 'text-teal-700 dark:text-teal-300', iconName: 'User' },
  { id: 'health', name: 'Health & Workout', color: 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/60', textColor: 'text-rose-700 dark:text-rose-300', iconName: 'Activity' },
  { id: 'finance', name: 'Finance', color: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/60', textColor: 'text-emerald-700 dark:text-emerald-300', iconName: 'DollarSign' },
  { id: 'shopping', name: 'Shopping', color: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/60', textColor: 'text-amber-700 dark:text-amber-300', iconName: 'ShoppingCart' },
  { id: 'creative', name: 'Creative / Learn', color: 'bg-violet-50 dark:bg-violet-950/40 border-violet-100 dark:border-violet-900/60', textColor: 'text-violet-700 dark:text-violet-300', iconName: 'Sparkles' },
];

export const DEFAULT_TASKS: Task[] = [
  {
    id: 'default-task-1',
    title: 'Design interactive dashboard components',
    description: 'Sketch layout and visual cards for the user statistics widget and progress rings.',
    category: 'work',
    priority: 'high',
    deadline: '2026-06-02',
    completed: false,
    pinned: true,
    createdAt: '2026-05-28T09:00:00Z',
    estimatedMinutes: 120,
    subTasks: [
      { id: 'sub-1-1', title: 'Outline core parameters and analytics goals', completed: true },
      { id: 'sub-1-2', title: 'Review typographic sizing on smaller grid viewports', completed: false },
      { id: 'sub-1-3', title: 'Test dark mode contrast scales', completed: false }
    ]
  },
  {
    id: 'default-task-2',
    title: 'Weekly market nutrition & protein prep',
    description: 'Visit local market to purchase seasonal organic produce and portion containers.',
    category: 'health',
    priority: 'medium',
    deadline: '2026-05-29',
    completed: false,
    pinned: false,
    createdAt: '2026-05-27T14:30:00Z',
    estimatedMinutes: 90,
    subTasks: [
      { id: 'sub-2-1', title: 'Draft visual catalog shopping checklist', completed: true },
      { id: 'sub-2-2', title: 'Clean and prep storage glass bowls', completed: false }
    ]
  },
  {
    id: 'default-task-3',
    title: 'Update monthly automatic capital transfers',
    description: 'Verify router status on personal savings vault and commit current update limits.',
    category: 'finance',
    priority: 'low',
    deadline: '2026-05-28', // due today!
    completed: true,
    pinned: false,
    createdAt: '2026-05-25T11:00:00Z',
    estimatedMinutes: 30,
    subTasks: [
      { id: 'sub-3-1', title: 'Authenticate routing on investment client', completed: true },
      { id: 'sub-3-2', title: 'Confirm ledger updates succeed', completed: true }
    ]
  }
];
