/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, TaskCompletion, StreakStats, Category } from '../types';

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'volume' | 'perfection' | 'category';
  maxProgress: number;
}

export const ALL_ACHIEVEMENTS: AchievementDef[] = [
  {
    key: 'first_step',
    title: 'First Step',
    description: 'Complete your first habit or task',
    icon: 'Footprints',
    category: 'volume',
    maxProgress: 1,
  },
  {
    key: 'streak_7',
    title: '7 Day Streak',
    description: 'Maintain a routine streak for 7 consecutive days',
    icon: 'Flame',
    category: 'streak',
    maxProgress: 7,
  },
  {
    key: 'streak_30',
    title: '30 Day Streak',
    description: 'Maintain a routine streak for 30 consecutive days',
    icon: 'Sparkles',
    category: 'streak',
    maxProgress: 30,
  },
  {
    key: 'perfect_week',
    title: 'Perfect Week',
    description: 'Achieve 7 perfect days with 100% completion',
    icon: 'Trophy',
    category: 'perfection',
    maxProgress: 7,
  },
  {
    key: 'tasks_50',
    title: '50 Tasks Mastered',
    description: 'Log 50 total completed habits and tasks',
    icon: 'CheckCircle2',
    category: 'volume',
    maxProgress: 50,
  },
  {
    key: 'tasks_100',
    title: 'Century Club',
    description: 'Log 100 total completed habits and tasks',
    icon: 'Award',
    category: 'volume',
    maxProgress: 100,
  },
  {
    key: 'study_master',
    title: 'Study Master',
    description: 'Complete 25 study-related sessions',
    icon: 'BookOpen',
    category: 'category',
    maxProgress: 25,
  },
  {
    key: 'fitness_starter',
    title: 'Fitness Starter',
    description: 'Complete 20 workout and fitness sessions',
    icon: 'Dumbbell',
    category: 'category',
    maxProgress: 20,
  },
  {
    key: 'hydration_hero',
    title: 'Hydration Hero',
    description: 'Complete 15 water or health habits',
    icon: 'Droplets',
    category: 'category',
    maxProgress: 15,
  },
];

/**
 * Checks all achievement progress
 */
export function evaluateAchievements(
  tasks: Task[],
  completions: TaskCompletion[],
  categories: Category[],
  streakStats: StreakStats
): { key: string; progress: number; isUnlocked: boolean }[] {
  const completedList = completions.filter((c) => c.completed);
  const totalCompleted = completedList.length;

  const taskMap = new Map<string, Task>();
  tasks.forEach((t) => taskMap.set(t.taskId, t));

  const categoryMap = new Map<string, Category>();
  categories.forEach((cat) => categoryMap.set(cat.categoryId, cat));

  // Count by category
  let studyCount = 0;
  let fitnessCount = 0;
  let healthCount = 0;

  completedList.forEach((c) => {
    const task = taskMap.get(c.taskId);
    if (task) {
      const cat = categoryMap.get(task.categoryId);
      const catName = (cat?.name || '').toLowerCase();
      const taskTitle = task.title.toLowerCase();

      if (catName.includes('study') || taskTitle.includes('study') || taskTitle.includes('code') || taskTitle.includes('read')) {
        studyCount++;
      }
      if (catName.includes('fit') || catName.includes('gym') || taskTitle.includes('gym') || taskTitle.includes('walk') || taskTitle.includes('run') || taskTitle.includes('workout')) {
        fitnessCount++;
      }
      if (catName.includes('health') || catName.includes('water') || taskTitle.includes('water') || taskTitle.includes('sleep') || taskTitle.includes('meditat')) {
        healthCount++;
      }
    }
  });

  return ALL_ACHIEVEMENTS.map((ach) => {
    let progress = 0;
    switch (ach.key) {
      case 'first_step':
        progress = Math.min(totalCompleted, 1);
        break;
      case 'streak_7':
        progress = Math.min(streakStats.longestStreak, 7);
        break;
      case 'streak_30':
        progress = Math.min(streakStats.longestStreak, 30);
        break;
      case 'perfect_week':
        progress = Math.min(streakStats.perfectDaysCount, 7);
        break;
      case 'tasks_50':
        progress = Math.min(totalCompleted, 50);
        break;
      case 'tasks_100':
        progress = Math.min(totalCompleted, 100);
        break;
      case 'study_master':
        progress = Math.min(studyCount, 25);
        break;
      case 'fitness_starter':
        progress = Math.min(fitnessCount, 20);
        break;
      case 'hydration_hero':
        progress = Math.min(healthCount, 15);
        break;
      default:
        progress = 0;
    }

    return {
      key: ach.key,
      progress,
      isUnlocked: progress >= ach.maxProgress,
    };
  });
}
