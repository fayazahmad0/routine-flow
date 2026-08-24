/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRoutine } from '../../context/RoutineContext';
import { Sparkles, TrendingUp, Star, Target, Flame, Trophy } from 'lucide-react';
import { IconRenderer } from '../common/IconRenderer';

export const InsightsCard: React.FC = React.memo(() => {
  const { smartInsights } = useRoutine();

  if (smartInsights.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-5 border border-[#E8E3DA] dark:border-[#282725] shadow-xs transition-all">
        <h3 className="font-serif text-sm font-bold text-[#1A1A1A] dark:text-[#F3EFEA] tracking-tight mb-2.5 flex items-center gap-1.5 pb-2 border-b border-[#E8E3DA] dark:border-[#282725]">
          <Sparkles className="w-4 h-4 text-[#A04000] dark:text-[#E08A50]" />
          Pattern Observations
        </h3>
        <p className="text-xs text-[#78716C] dark:text-[#A39E96] leading-relaxed">
          Maintain your daily routines across several sessions to generate data-driven consistency insights.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-5 border border-[#E8E3DA] dark:border-[#282725] shadow-xs transition-all">
      <h3 className="font-serif text-sm font-bold text-[#1A1A1A] dark:text-[#F3EFEA] tracking-tight mb-3 flex items-center gap-1.5 pb-2 border-b border-[#E8E3DA] dark:border-[#282725]">
        <Sparkles className="w-4 h-4 text-[#A04000] dark:text-[#E08A50]" />
        Pattern Observations
      </h3>

      <div className="space-y-2.5">
        {smartInsights.slice(0, 3).map((insight) => (
          <div
            key={insight.id}
            className="flex items-start gap-3 p-3 bg-[#F2EDE4] dark:bg-[#22211F] rounded-xl border border-[#E2DDD5] dark:border-[#2E2C2A]"
          >
            <div className="p-1.5 rounded-lg bg-[#1A1A1A] dark:bg-[#F3EFEA] text-[#FAF8F5] dark:text-[#121212] shrink-0">
              <IconRenderer name={insight.icon} className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#1A1A1A] dark:text-[#F3EFEA]">
                {insight.title}
              </h4>
              <p className="text-[11px] text-[#78716C] dark:text-[#A39E96] mt-0.5 leading-relaxed">
                {insight.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

InsightsCard.displayName = 'InsightsCard';
