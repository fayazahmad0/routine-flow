/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useRoutine } from '../../context/RoutineContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Award,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';
import { formatDayName, addDaysToDateString } from '../../utils/dateUtils';
import { IconRenderer } from '../common/IconRenderer';

export const AnalyticsView: React.FC = () => {
  const {
    tasks,
    completions,
    categories,
    streakStats,
    todayDateStr,
    getDayPerformance,
  } = useRoutine();

  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('14d');

  // Daily Trend Data for selected time range
  const trendData = useMemo(() => {
    const daysCount = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const result = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const dateStr = addDaysToDateString(todayDateStr, -i);
      const perf = getDayPerformance(dateStr);
      const d = new Date(dateStr + 'T00:00:00');

      result.push({
        date: dateStr,
        day: daysCount <= 14 ? formatDayName(d) : `${d.getMonth() + 1}/${d.getDate()}`,
        completionRate: perf.completionRate,
        completed: perf.completedCount,
        total: perf.totalScheduled,
      });
    }

    return result;
  }, [timeRange, todayDateStr, getDayPerformance]);

  // Overall Stats
  const statsOverview = useMemo(() => {
    const totalRates = trendData.reduce((acc, curr) => acc + curr.completionRate, 0);
    const avgRate = trendData.length > 0 ? Math.round(totalRates / trendData.length) : 0;
    const totalDone = trendData.reduce((acc, curr) => acc + curr.completed, 0);

    return {
      avgRate,
      totalDone,
      currentStreak: streakStats.currentStreak,
      longestStreak: streakStats.longestStreak,
      perfectDays: streakStats.perfectDaysCount,
    };
  }, [trendData, streakStats]);

  // Habit Consistency Ranking
  const habitConsistencyList = useMemo(() => {
    return tasks
      .filter((t) => !t.isArchived)
      .map((task) => {
        const streak = streakStats.taskStreaks[task.taskId];
        const taskCompletions = completions.filter((c) => c.taskId === task.taskId && c.completed);
        const category = categories.find((c) => c.categoryId === task.categoryId);

        // Approximate 30-day rate
        const rate = streak?.rate ?? (taskCompletions.length > 0 ? 80 : 0);

        return {
          taskId: task.taskId,
          title: task.title,
          categoryName: category?.name || 'Habit',
          color: category?.color || '#6366f1',
          icon: task.icon || category?.icon || 'CheckSquare',
          currentStreak: streak?.current || 0,
          rate,
          totalCompleted: taskCompletions.length,
        };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [tasks, completions, streakStats, categories]);

  // Category Distribution Data
  const categoryData = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {};

    categories.forEach((cat) => {
      map[cat.categoryId] = { name: cat.name, value: 0, color: cat.color || '#6366f1' };
    });

    completions.forEach((c) => {
      if (c.completed) {
        const task = tasks.find((t) => t.taskId === c.taskId);
        if (task && map[task.categoryId]) {
          map[task.categoryId].value += 1;
        }
      }
    });

    const list = Object.values(map).filter((item) => item.value > 0);
    if (list.length === 0) {
      return [{ name: 'General Habits', value: 1, color: '#6366f1' }];
    }
    return list;
  }, [categories, completions, tasks]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Analytics & Insights
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Deep dive into your consistency trends, completion rates, and habit strengths.
          </p>
        </div>

        {/* Time range switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0">
          {(['7d', '14d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeRange === range
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Last {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Rate</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {statsOverview.avgRate}%
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Over past {timeRange}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Habits Done</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {statsOverview.totalDone}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Completed tasks
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Current Streak</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {statsOverview.currentStreak} <span className="text-xs font-medium text-slate-500">days</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Best: {statsOverview.longestStreak} days
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Perfect Days</span>
            <Award className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-violet-600 dark:text-violet-400">
            {statsOverview.perfectDays}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            100% completed
          </p>
        </div>
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Daily Completion Trend (%)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Your day-by-day consistency rate
            </p>
          </div>
          <BarChart3 className="w-5 h-5 text-indigo-500" />
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '16px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
                formatter={(value: any) => [`${value}%`, 'Completion Rate']}
              />
              <Bar dataKey="completionRate" radius={[8, 8, 0, 0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid: Habit Breakdown & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habit Consistency Ranking */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Habit Performance
            </h3>
            <span className="text-xs font-semibold text-slate-500">Consistency %</span>
          </div>

          <div className="space-y-4">
            {habitConsistencyList.slice(0, 5).map((habit) => (
              <div key={habit.taskId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                      style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                    >
                      <IconRenderer name={habit.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {habit.title}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{habit.rate}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${habit.rate}%`,
                      backgroundColor: habit.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown (Donut Chart) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Category Distribution
            </h3>
            <PieIcon className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '16px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {categoryData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
