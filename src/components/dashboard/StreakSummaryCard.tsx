/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRoutine } from '../../context/RoutineContext';
import { Flame, Trophy, Award, Sparkles } from 'lucide-react';

export const StreakSummaryCard: React.FC = () => {
  const { streakStats } = useRoutine();
  const { currentStreak, longestStreak, perfectDaysCount } = streakStats;

  return (
    <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-5 border border-[#E8E3DA] dark:border-[#282725] shadow-xs transition-all">
      <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-[#E8E3DA] dark:border-[#282725]">
        <h3 className="font-serif text-sm font-bold text-[#1A1A1A] dark:text-[#F3EFEA] tracking-tight flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-[#A04000] dark:text-[#E08A50] fill-current" />
          Consistency Ledger
        </h3>
        {currentStreak >= 7 && (
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#A04000] dark:text-[#E08A50] bg-[#F2EDE4] dark:bg-[#252422] px-2 py-0.5 rounded-full border border-[#E2DDD5] dark:border-[#353330]">
            Steady Cadence
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2.5 text-center">
        {/* Current Streak */}
        <div className="p-3 bg-[#F2EDE4] dark:bg-[#22211F] rounded-xl border border-[#E2DDD5] dark:border-[#2E2C2A]">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] dark:text-[#A39E96]">Current</p>
          <p className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A1A] dark:text-[#F3EFEA] mt-0.5">
            {currentStreak}
            <span className="text-xs font-mono text-[#78716C] ml-0.5">d</span>
          </p>
        </div>

        {/* Best Streak */}
        <div className="p-3 bg-[#F2EDE4] dark:bg-[#22211F] rounded-xl border border-[#E2DDD5] dark:border-[#2E2C2A]">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] dark:text-[#A39E96]">Best</p>
          <p className="font-serif text-xl sm:text-2xl font-bold text-[#A04000] dark:text-[#E08A50] mt-0.5">
            {longestStreak}
            <span className="text-xs font-mono text-[#78716C] ml-0.5">d</span>
          </p>
        </div>

        {/* Perfect Days */}
        <div className="p-3 bg-[#F2EDE4] dark:bg-[#22211F] rounded-xl border border-[#E2DDD5] dark:border-[#2E2C2A]">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] dark:text-[#A39E96]">Perfect</p>
          <p className="font-serif text-xl sm:text-2xl font-bold text-[#2D5A43] dark:text-[#68B087] mt-0.5">
            {perfectDaysCount}
          </p>
        </div>
      </div>
    </div>
  );
};
