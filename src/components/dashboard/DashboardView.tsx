/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRoutine } from '../../context/RoutineContext';
import { Task } from '../../types';
import { TodayProgressCard } from './TodayProgressCard';
import { TodayTaskList } from './TodayTaskList';
import { StreakSummaryCard } from './StreakSummaryCard';
import { InsightsCard } from './InsightsCard';
import { DailyReflectionCard } from './DailyReflectionCard';
import { formatFullDate } from '../../utils/dateUtils';
import { Plus, Sparkles, Flame, CheckCircle } from 'lucide-react';

interface DashboardViewProps {
  onOpenAddTask: () => void;
  onEditTask: (task: Task) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddTask,
  onEditTask,
}) => {
  const { userProfile } = useAuth();
  const { todayDateStr, todayProgress } = useRoutine();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = userProfile?.displayName || 'there';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E3DA] dark:border-[#282725]">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#78716C] dark:text-[#A39E96]">
            {formatFullDate(todayDateStr)}
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#1A1A1A] dark:text-[#F3EFEA] tracking-tight mt-0.5">
            {getGreeting()}, {displayName}
          </h1>
        </div>

        {/* Quick Add Habit CTA */}
        <button
          id="dashboard-add-task-btn"
          onClick={onOpenAddTask}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#33312E] active:scale-95 text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] dark:hover:bg-[#E2DDD5] text-xs sm:text-sm font-medium rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Hero: Today Progress Ring Card */}
      <TodayProgressCard />

      {/* Main Grid: Left Tasks, Right Widgets (Streak, Insights, Reflection) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Tasks (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          <TodayTaskList onEditTask={onEditTask} onOpenAddTask={onOpenAddTask} />
        </div>

        {/* Right Column: Consistency, Insights, Daily Reflection */}
        <div className="space-y-6">
          <StreakSummaryCard />
          <DailyReflectionCard />
          <InsightsCard />
        </div>
      </div>
    </div>
  );
};
