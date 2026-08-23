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
 * Calculates global streaks and individual task streaks with a single-pass indexed scan
 */
export function calculateOverallStreaks(
  tasks: Task[],
  completions: TaskCompletion[],
  todayStr: string
): StreakStats {
  const activeTasks = tasks.filter((t) => t.isActive && !t.isArchived);
  
  if (activeTasks.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      perfectDaysCount: 0,
      totalCompletions: 0,
      taskStreaks: {},
    };
  }

  // Fast completion set & count
  const completedTaskDates = new Set<string>();
  const completionsByDate = new Map<string, Set<string>>();
  let totalCompletions = 0;

  for (let i = 0; i < completions.length; i++) {
    const c = completions[i];
    if (c.completed) {
      totalCompletions++;
      completedTaskDates.add(`${c.taskId}_${c.localDate}`);
      let dateSet = completionsByDate.get(c.localDate);
      if (!dateSet) {
        dateSet = new Set();
        completionsByDate.set(c.localDate, dateSet);
      }
      dateSet.add(c.taskId);
    }
  }

  // 1. Calculate overall current streak (go back from todayStr)
  let currentStreak = 0;
  let checkDate = todayStr;

  const todayCompletedSet = completionsByDate.get(todayStr) || new Set();
  const todayScheduledTasks = activeTasks.filter((t) => isTaskScheduledOnDate(t, todayStr));
  let hasTodayActivity = false;

  if (todayScheduledTasks.length > 0) {
    const todayCompletedCount = todayScheduledTasks.filter((t) => todayCompletedSet.has(t.taskId)).length;
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
  while (safety < 120) {
    safety++;
    const scheduled = activeTasks.filter((t) => isTaskScheduledOnDate(t, checkDate));
    if (scheduled.length === 0) {
      checkDate = addDaysToDateString(checkDate, -1);
      continue;
    }

    const completedSet = completionsByDate.get(checkDate) || new Set();
    const completedCount = scheduled.filter((t) => completedSet.has(t.taskId)).length;

    if (completedCount > 0) {
      currentStreak++;
      checkDate = addDaysToDateString(checkDate, -1);
    } else {
      break;
    }
  }

  // 2. Single-pass historic scan (past 90 days) for perfect days and per-task longest streaks
  let perfectDaysCount = 0;
  let longestStreak = currentStreak;
  let rollingStreak = 0;

  // Track task streaks
  const taskCurrentStreaks: Record<string, number> = {};
  const taskLongestStreaks: Record<string, number> = {};
  const taskRunningStreaks: Record<string, number> = {};

  activeTasks.forEach((t) => {
    taskCurrentStreaks[t.taskId] = 0;
    taskLongestStreaks[t.taskId] = 0;
    taskRunningStreaks[t.taskId] = 0;
  });

  const scanDays = 90;
  let scanDate = addDaysToDateString(todayStr, -scanDays);

  while (scanDate <= todayStr) {
    const isToday = scanDate === todayStr;
    const scheduled = activeTasks.filter((t) => isTaskScheduledOnDate(t, scanDate));
    const completedSet = completionsByDate.get(scanDate) || new Set();

    if (scheduled.length > 0) {
      const completedCount = scheduled.filter((t) => completedSet.has(t.taskId)).length;

      if (completedCount === scheduled.length && completedCount > 0) {
        perfectDaysCount++;
      }

      if (completedCount > 0) {
        rollingStreak++;
        if (rollingStreak > longestStreak) longestStreak = rollingStreak;
      } else if (!isToday) {
        rollingStreak = 0;
      }
    }

    // Per-task running streak
    for (let i = 0; i < activeTasks.length; i++) {
      const task = activeTasks[i];
      if (isTaskScheduledOnDate(task, scanDate)) {
        if (completedSet.has(task.taskId)) {
          taskRunningStreaks[task.taskId] = (taskRunningStreaks[task.taskId] || 0) + 1;
          if (taskRunningStreaks[task.taskId] > (taskLongestStreaks[task.taskId] || 0)) {
            taskLongestStreaks[task.taskId] = taskRunningStreaks[task.taskId];
          }
        } else if (!isToday) {
          taskRunningStreaks[task.taskId] = 0;
        }
      }
    }

    scanDate = addDaysToDateString(scanDate, 1);
  }

  // 3. Compute per-task current streak going backward from today
  const taskStreaks: Record<string, { current: number; longest: number }> = {};
  for (let i = 0; i < activeTasks.length; i++) {
    const task = activeTasks[i];
    let tStreak = 0;
    let tDate = todayStr;
    const isTodaySched = isTaskScheduledOnDate(task, todayStr);
    const isTodayDone = completedTaskDates.has(`${task.taskId}_${todayStr}`);

    if (isTodaySched && isTodayDone) {
      tStreak++;
      tDate = addDaysToDateString(todayStr, -1);
    } else {
      tDate = addDaysToDateString(todayStr, -1);
    }

    let tSafety = 0;
    while (tSafety < 60) {
      tSafety++;
      if (isTaskScheduledOnDate(task, tDate)) {
        if (completedTaskDates.has(`${task.taskId}_${tDate}`)) {
          tStreak++;
        } else {
          break;
        }
      }
      tDate = addDaysToDateString(tDate, -1);
    }

    taskStreaks[task.taskId] = {
      current: tStreak,
      longest: Math.max(taskLongestStreaks[task.taskId] || 0, tStreak),
    };
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
