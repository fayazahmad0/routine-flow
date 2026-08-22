/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRoutine } from '../../context/RoutineContext';
import { ProgressRing } from '../common/ProgressRing';
import { CheckCircle2, Clock, Flame, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const TodayProgressCard: React.FC = () => {
  const { todayProgress, streakStats } = useRoutine();
  const { percentage, completedCount, totalCount, remainingCount } = todayProgress;

  const getStatusMessage = () => {
    if (totalCount === 0) {
      return 'No tasks scheduled for today. Take a rest or add a task!';
    }
    if (percentage === 100) {
      return '🏆 Perfect day! You completed all scheduled habits.';
    }
    if (percentage >= 70) {
      return `Almost there! Just ${remainingCount} ${remainingCount === 1 ? 'task' : 'tasks'} remaining.`;
    }
    if (percentage >= 30) {
      return 'Great progress! Keep the momentum going today.';
    }
    if (completedCount > 0) {
      return 'Good start! Complete your remaining habits step by step.';
    }
    return 'Start your daily routine to keep your streak alive!';
  };

  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#1A1918] rounded-2xl p-6 sm:p-7 border border-[#E8E3DA] dark:border-[#282725] shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
        {/* Left Stats */}
        <div className="flex-1 text-center sm:text-left space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F2EDE4] dark:bg-[#242220] border border-[#E2DDD5] dark:border-[#353330] text-[#1A1A1A] dark:text-[#F3EFEA] rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#A04000] dark:text-[#E08A50]" />
            Today's Dispatch
          </div>

          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] dark:text-[#F3EFEA] tracking-tight">
              {completedCount} of {totalCount} {totalCount === 1 ? 'task' : 'tasks'} completed
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#78716C] dark:text-[#A39E96] leading-relaxed">
              {getStatusMessage()}
            </p>
          </div>

          {/* Sub counters */}
          <div className="pt-2 flex items-center justify-center sm:justify-start gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F2EDE4] dark:bg-[#22211F] text-[#2D5A43] dark:text-[#68B087] rounded-xl border border-[#E2DDD5] dark:border-[#2E2C2A]">
              <span className="w-2 h-2 rounded-full bg-[#2D5A43] dark:bg-[#68B087]" />
              <span>Fulfilled: {completedCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F2EDE4] dark:bg-[#22211F] text-[#8A4A28] dark:text-[#D4A373] rounded-xl border border-[#E2DDD5] dark:border-[#2E2C2A]">
              <span className="w-2 h-2 rounded-full bg-[#8A4A28] dark:bg-[#D4A373]" />
              <span>Pending: {remainingCount}</span>
            </div>
          </div>
        </div>

        {/* Right Progress Ring */}
        <div className="shrink-0 flex flex-col items-center">
          <ProgressRing percentage={percentage} size={130} strokeWidth={10} subText="today" />
        </div>
      </div>
    </div>
  );
};
