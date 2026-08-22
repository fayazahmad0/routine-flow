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
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] dark:text-[#F3EFEA] tracking-tight">
            Analytics & Insights
          </h2>
          <p className="text-xs sm:text-sm font-mono text-[#78716C] dark:text-[#A39E96] mt-1">
            Deep dive into your consistency trends, completion rates, and habit strengths.
          </p>
        </div>

        {/* Time range switcher */}
        <div className="flex items-center p-1 bg-[#F2EDE4] dark:bg-[#22211F] rounded-xl shrink-0 border border-[#E2DDD5] dark:border-[#2E2C2A]">
          {(['7d', '14d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                timeRange === range
                  ? 'bg-white dark:bg-[#1A1918] text-[#1A1A1A] dark:text-[#F3EFEA] shadow-xs'
                  : 'text-[#78716C] dark:text-[#A39E96] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA]'
              }`}
            >
              Last {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-4 sm:p-5 border border-[#E8E3DA] dark:border-[#282725] shadow-xs">
          <div className="flex items-center justify-between text-[#78716C] dark:text-[#A39E96] mb-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider">Avg Rate</span>
            <TrendingUp className="w-4 h-4 text-[#A04000] dark:text-[#E08A50]" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] dark:text-[#F3EFEA]">
            {statsOverview.avgRate}%
          </p>
          <p className="text-[11px] font-mono text-[#78716C] dark:text-[#A39E96] mt-1">
            Over past {timeRange}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-4 sm:p-5 border border-[#E8E3DA] dark:border-[#282725] shadow-xs">
          <div className="flex items-center justify-between text-[#78716C] dark:text-[#A39E96] mb-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider">Fulfilled</span>
            <CheckCircle2 className="w-4 h-4 text-[#2D5A43] dark:text-[#68B087]" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] dark:text-[#F3EFEA]">
            {statsOverview.totalDone}
          </p>
          <p className="text-[11px] font-mono text-[#78716C] dark:text-[#A39E96] mt-1">
            Completed tasks
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-4 sm:p-5 border border-[#E8E3DA] dark:border-[#282725] shadow-xs">
          <div className="flex items-center justify-between text-[#78716C] dark:text-[#A39E96] mb-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider">Streak</span>
            <Flame className="w-4 h-4 text-[#A04000] dark:text-[#E08A50] fill-current" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#A04000] dark:text-[#E08A50]">
            {statsOverview.currentStreak} <span className="text-xs font-mono text-[#78716C]">d</span>
          </p>
          <p className="text-[11px] font-mono text-[#78716C] dark:text-[#A39E96] mt-1">
            Best: {statsOverview.longestStreak}d
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-4 sm:p-5 border border-[#E8E3DA] dark:border-[#282725] shadow-xs">
          <div className="flex items-center justify-between text-[#78716C] dark:text-[#A39E96] mb-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider">Perfect Days</span>
            <Award className="w-4 h-4 text-[#2D5A43] dark:text-[#68B087]" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#2D5A43] dark:text-[#68B087]">
            {statsOverview.perfectDays}
          </p>
          <p className="text-[11px] font-mono text-[#78716C] dark:text-[#A39E96] mt-1">
            100% completed
          </p>
        </div>
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-4 sm:p-6 border border-[#E8E3DA] dark:border-[#282725] shadow-xs">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-[#F3EFEA]">
              Daily Completion Trend (%)
            </h3>
            <p className="text-xs font-mono text-[#78716C] dark:text-[#A39E96] mt-0.5">
              Your day-by-day consistency cadence
            </p>
          </div>
          <BarChart3 className="w-5 h-5 text-[#A04000] dark:text-[#E08A50]" />
        </div>

        <div className="h-60 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" stroke="#78716c" fontSize={11} tickLine={false} />
              <YAxis stroke="#78716c" fontSize={11} domain={[0, 100]} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1A1A',
                  borderRadius: '12px',
                  border: '1px solid #33312E',
                  color: '#FAF8F5',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
                formatter={(value: any) => [`${value}%`, 'Completion Rate']}
              />
              <Bar dataKey="completionRate" radius={[6, 6, 0, 0]} fill="#1A1A1A" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid: Habit Breakdown & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Habit Consistency Ranking */}
        <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-4 sm:p-6 border border-[#E8E3DA] dark:border-[#282725] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-[#F3EFEA]">
              Habit Performance
            </h3>
            <span className="text-[11px] font-mono font-semibold text-[#78716C] dark:text-[#A39E96]">Consistency %</span>
          </div>

          <div className="space-y-3.5">
            {habitConsistencyList.slice(0, 5).map((habit) => (
              <div key={habit.taskId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0"
                      style={{ backgroundColor: `${habit.color}18`, color: habit.color }}
                    >
                      <IconRenderer name={habit.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-[#1A1A1A] dark:text-[#F3EFEA] truncate">
                      {habit.title}
                    </span>
                  </div>
                  <span className="font-bold text-[#1A1A1A] dark:text-[#F3EFEA] shrink-0 ml-2">{habit.rate}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-[#F2EDE4] dark:bg-[#22211F] rounded-full overflow-hidden">
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
        <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-4 sm:p-6 border border-[#E8E3DA] dark:border-[#282725] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#1A1A1A] dark:text-[#F3EFEA]">
              Category Distribution
            </h3>
            <PieIcon className="w-5 h-5 text-[#A04000] dark:text-[#E08A50]" />
          </div>

          <div className="h-48 sm:h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    borderRadius: '12px',
                    border: '1px solid #33312E',
                    color: '#FAF8F5',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {categoryData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#57534E] dark:text-[#A39E96]">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
