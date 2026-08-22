/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TaskType = 'checkbox' | 'duration' | 'quantity' | 'target';

export type ScheduleType = 'everyday' | 'specific_days' | 'weekly' | 'custom';

export interface TaskSchedule {
  type: ScheduleType;
  /** 0 = Sunday, 1 = Monday, ... 6 = Saturday */
  days?: number[];
  /** For weekly frequency, e.g. 3 times per week */
  timesPerWeek?: number;
}

export interface Task {
  taskId: string;
  uid: string;
  title: string;
  description?: string;
  type: TaskType;
  targetValue?: number;
  targetUnit?: string;
  categoryId: string;
  icon: string;
  schedule: TaskSchedule;
  reminderTime?: string; // e.g. "08:00", "19:30"
  reminderEnabled?: boolean;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCompletion {
  completionId: string;
  taskId: string;
  uid: string;
  localDate: string; // "YYYY-MM-DD"
  completed: boolean;
  actualValue?: number;
  completedAt: string;
  updatedAt: string;
}

export type MoodType = 'great' | 'good' | 'okay' | 'bad' | 'none';

export interface DailyRecord {
  dateId: string; // "YYYY-MM-DD"
  uid: string;
  localDate: string; // "YYYY-MM-DD"
  note?: string;
  mood?: MoodType;
  updatedAt: string;
}

export interface Category {
  categoryId: string;
  uid: string;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface Achievement {
  achievementId: string;
  uid: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  progress?: number;
}

export type ThemePreference = 'light' | 'dark' | 'system';
export type WeekStartDay = 'sunday' | 'monday';

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
  createdAt: string;
  timezone: string;
  theme: ThemePreference;
  weekStartsOn: WeekStartDay;
  onboardingCompleted: boolean;
  selectedGoals?: string[];
  notificationsEnabled?: boolean;
  settings?: {
    firstDayOfWeek?: WeekStartDay;
    timezone?: string;
    [key: string]: any;
  };
}

export interface DayPerformance {
  date: string; // "YYYY-MM-DD"
  dayOfWeek: number; // 0-6
  totalScheduled: number;
  completedCount: number;
  completionRate: number; // 0 - 100
  status: 'excellent' | 'partial' | 'low' | 'none' | 'future';
  tasks: {
    task: Task;
    completed: boolean;
    actualValue?: number;
  }[];
  record?: DailyRecord;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  perfectDaysCount: number;
  totalCompletions: number;
  taskStreaks: Record<string, { current: number; longest: number }>;
}

export interface SmartInsight {
  id: string;
  title: string;
  description: string;
  type: 'streak' | 'improvement' | 'strength' | 'weakness' | 'achievement';
  icon: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'tasks'
  | 'calendar'
  | 'analytics'
  | 'history'
  | 'achievements'
  | 'settings'
  | 'profile';
