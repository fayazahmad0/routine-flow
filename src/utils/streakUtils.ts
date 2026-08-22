/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, TaskCompletion, StreakStats, SmartInsight } from '../types';
import {
  isTaskScheduledOnDate,
  addDaysToDateString,
  getLocalDateString,
  getDayOfWeek,
} from './dateUtils';

/**
 * Calculates task-specific current and longest streak with O(1) lookups
 */
export function calculateTaskStreak(
  task: Task,
  completions: TaskCompletion[],
  todayStr: string,
  prebuiltMap?: Map<string, boolean>
): { current: number; longest: number } {
  const completionMap = prebuiltMap || new Map<string, boolean>();
  if (!prebuiltMap) {
    completions
      .filter((c) => c.taskId === task.taskId)
      .forEach((c) => {
        completionMap.set(`${c.taskId}_${c.localDate}`, c.completed);
      });
  }

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = todayStr;
  const isTodayScheduled = isTaskScheduledOnDate(task, todayStr);
  const isTodayCompleted = completionMap.get(`${task.taskId}_${todayStr}`) === true;

  if (isTodayScheduled && isTodayCompleted) {
    currentStreak++;
    checkDate = addDaysToDateString(todayStr, -1);
  } else if (!isTodayScheduled) {
    checkDate = addDaysToDateString(todayStr, -1);
  } else {
    checkDate = addDaysToDateString(todayStr, -1);
  }

  // Go back up to 180 days for current streak
  let safetyCounter = 0;
  while (safetyCounter < 180) {
    safetyCounter++;
    const isScheduled = isTaskScheduledOnDate(task, checkDate);
    if (isScheduled) {
      const isCompleted = completionMap.get(`${task.taskId}_${checkDate}`) === true;
      if (isCompleted) {
        currentStreak++;
      } else {
        break;
      }
    }
    checkDate = addDaysToDateString(checkDate, -1);
  }

  // Calculate longest streak across past 180 days
  let longest = currentStreak;
  let tempStreak = 0;
  let scanDate = addDaysToDateString(todayStr, -180);

  while (scanDate <= todayStr) {
    if (isTaskScheduledOnDate(task, scanDate)) {
      if (completionMap.get(`${task.taskId}_${scanDate}`) === true) {
        tempStreak++;
        if (tempStreak > longest) longest = tempStreak;
      } else {
        tempStreak = 0;
      }
    }
    scanDate = addDaysToDateString(scanDate, 1);
  }

  return { current: currentStreak, longest: Math.max(longest, currentStreak) };
}

/**
 * Calculates global streaks across all habits with high-speed indexing
 */
export function calculateOverallStreaks(
  tasks: Task[],
  completions: TaskCompletion[],
  todayStr: string
): StreakStats {
  const activeTasks = tasks.filter((t) => t.isActive && !t.isArchived);
  
  // Fast index maps
  const taskDateCompletionMap = new Map<string, boolean>();
  const completionsByDate = new Map<string, Set<string>>();
  let totalCompletions = 0;

  for (let i = 0; i < completions.length; i++) {
    const c = completions[i];
    if (c.completed) {
      totalCompletions++;
      taskDateCompletionMap.set(`${c.taskId}_${c.localDate}`, true);
      let dateSet = completionsByDate.get(c.localDate);
      if (!dateSet) {
        dateSet = new Set();
        completionsByDate.set(c.localDate, dateSet);
      }
      dateSet.add(c.taskId);
    }
  }

  // Calculate day-by-day stats
  const taskStreaks: Record<string, { current: number; longest: number }> = {};
  for (let i = 0; i < activeTasks.length; i++) {
    const task = activeTasks[i];
    taskStreaks[task.taskId] = calculateTaskStreak(task, completions, todayStr, taskDateCompletionMap);
  }

  // Calculate overall consecutive days with activity
  let currentStreak = 0;
  let checkDate = todayStr;

  const todayCompletedSet = completionsByDate.get(todayStr) || new Set();
  const todayScheduledTasks = activeTasks.filter((t) =>
    isTaskScheduledOnDate(t, todayStr)
  );

  let hasTodayActivity = false;
  if (todayScheduledTasks.length > 0) {
    const todayCompletedCount = todayScheduledTasks.filter((t) =>
      todayCompletedSet.has(t.taskId)
    ).length;
    if (todayCompletedCount > 0) {
      hasTodayActivity = true;
    }
  }

  if (hasTodayActivity) {
    currentStreak++;
    checkDate = addDaysToDateString(todayStr, -1);
  } else {
    checkDate = addDaysToDateString(todayStr, -1);
  }

  let safety = 0;
  while (safety < 180) {
    safety++;
    const scheduled = activeTasks.filter((t) =>
      isTaskScheduledOnDate(t, checkDate)
    );
    if (scheduled.length === 0) {
      checkDate = addDaysToDateString(checkDate, -1);
      continue;
    }

    const completedSet = completionsByDate.get(checkDate) || new Set();
    const completedCount = scheduled.filter((t) =>
      completedSet.has(t.taskId)
    ).length;

    if (completedCount > 0) {
      currentStreak++;
      checkDate = addDaysToDateString(checkDate, -1);
    } else {
      break;
    }
  }

  // Count perfect days (past 90 days)
  let perfectDaysCount = 0;
  let longestStreak = currentStreak;
  let rollingStreak = 0;
  let scanDate = addDaysToDateString(todayStr, -90);

  while (scanDate <= todayStr) {
    const scheduled = activeTasks.filter((t) =>
      isTaskScheduledOnDate(t, scanDate)
    );
    if (scheduled.length > 0) {
      const completedSet = completionsByDate.get(scanDate) || new Set();
      const completedCount = scheduled.filter((t) =>
        completedSet.has(t.taskId)
      ).length;

      if (completedCount === scheduled.length) {
        perfectDaysCount++;
      }

      if (completedCount > 0) {
        rollingStreak++;
        if (rollingStreak > longestStreak) longestStreak = rollingStreak;
      } else {
        rollingStreak = 0;
      }
    }
    scanDate = addDaysToDateString(scanDate, 1);
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    perfectDaysCount,
    totalCompletions,
    taskStreaks,
  };
}

/**
 * Generates smart data-driven insights with O(1) indexed lookups
 */
export function generateSmartInsights(
  tasks: Task[],
  completions: TaskCompletion[],
  todayStr: string,
  streakStats: StreakStats
): SmartInsight[] {
  const insights: SmartInsight[] = [];
  const activeTasks = tasks.filter((t) => t.isActive && !t.isArchived);
  if (activeTasks.length === 0) return insights;

  // Build quick completion lookup set
  const completedKeys = new Set<string>();
  for (let i = 0; i < completions.length; i++) {
    const c = completions[i];
    if (c.completed) {
      completedKeys.add(`${c.taskId}_${c.localDate}`);
    }
  }

  // Streak insight
  if (streakStats.currentStreak >= 3) {
    insights.push({
      id: 'streak-insight',
      title: `${streakStats.currentStreak}-Day Streak Active`,
      description: `You've maintained your routine for ${streakStats.currentStreak} consecutive days. Keep the momentum going!`,
      type: 'streak',
      icon: 'Flame',
    });
  }

  // Perfect days insight
  if (streakStats.perfectDaysCount > 0) {
    insights.push({
      id: 'perfect-days',
      title: `${streakStats.perfectDaysCount} Perfect Days Logged`,
      description: `You achieved 100% completion on ${streakStats.perfectDaysCount} scheduled days.`,
      type: 'achievement',
      icon: 'Trophy',
    });
  }

  // Calculate completion percentage over last 7 days vs previous 7 days
  const last7Days: string[] = [];
  const prev7Days: string[] = [];
  for (let i = 0; i < 7; i++) {
    last7Days.push(addDaysToDateString(todayStr, -i));
    prev7Days.push(addDaysToDateString(todayStr, -(i + 7)));
  }

  const getWeekStats = (dateList: string[]) => {
    let scheduled = 0;
    let completed = 0;
    for (let d = 0; d < dateList.length; d++) {
      const dateStr = dateList[d];
      for (let t = 0; t < activeTasks.length; t++) {
        const task = activeTasks[t];
        if (isTaskScheduledOnDate(task, dateStr)) {
          scheduled++;
          if (completedKeys.has(`${task.taskId}_${dateStr}`)) {
            completed++;
          }
        }
      }
    }
    return { scheduled, completed, rate: scheduled > 0 ? (completed / scheduled) * 100 : 0 };
  };

  const currentWeek = getWeekStats(last7Days);
  const previousWeek = getWeekStats(prev7Days);

  if (previousWeek.scheduled > 0 && currentWeek.scheduled > 0) {
    const diff = Math.round(currentWeek.rate - previousWeek.rate);
    if (diff > 0) {
      insights.push({
        id: 'weekly-diff-up',
        title: 'Weekly Progress Rising',
        description: `You completed ${diff}% more tasks this week compared to last week.`,
        type: 'improvement',
        icon: 'TrendingUp',
      });
    }
  }

  // Task consistency rankings (past 30 days)
  const taskPerformance: { task: Task; rate: number; total: number }[] = [];
  const last30Days: string[] = [];
  for (let i = 0; i < 30; i++) {
    last30Days.push(addDaysToDateString(todayStr, -i));
  }

  for (let t = 0; t < activeTasks.length; t++) {
    const task = activeTasks[t];
    let scheduledCount = 0;
    let completedCount = 0;
    for (let d = 0; d < last30Days.length; d++) {
      const dateStr = last30Days[d];
      if (isTaskScheduledOnDate(task, dateStr)) {
        scheduledCount++;
        if (completedKeys.has(`${task.taskId}_${dateStr}`)) {
          completedCount++;
        }
      }
    }

    if (scheduledCount >= 3) {
      taskPerformance.push({
        task,
        rate: Math.round((completedCount / scheduledCount) * 100),
        total: completedCount,
      });
    }
  }

  taskPerformance.sort((a, b) => b.rate - a.rate);

  if (taskPerformance.length > 0) {
    const strongest = taskPerformance[0];
    if (strongest.rate >= 75) {
      insights.push({
        id: 'strongest-habit',
        title: `Strongest Habit: ${strongest.task.title}`,
        description: `${strongest.task.title} has a ${strongest.rate}% consistency over the past 30 days.`,
        type: 'strength',
        icon: 'Star',
      });
    }

    const weakest = taskPerformance[taskPerformance.length - 1];
    if (weakest.rate < 60 && weakest.task.taskId !== strongest.task.taskId) {
      insights.push({
        id: 'focus-habit',
        title: `Habit to Focus On: ${weakest.task.title}`,
        description: `${weakest.task.title} is at ${weakest.rate}% completion. Try setting a reminder for it.`,
        type: 'weakness',
        icon: 'Target',
      });
    }
  }

  return insights;
}
