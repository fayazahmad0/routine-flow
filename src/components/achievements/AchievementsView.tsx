/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRoutine } from '../../context/RoutineContext';
import { Trophy, Lock, Sparkles, Star, Award, CheckCircle2 } from 'lucide-react';
import { IconRenderer } from '../common/IconRenderer';
import { motion } from 'motion/react';

export const AchievementsView: React.FC = () => {
  const { achievements } = useRoutine();

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // Level calculation (1 level per 2 unlocked badges)
  const currentLevel = Math.max(1, Math.floor(unlockedCount / 2) + 1);

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] dark:text-[#F3EFEA] tracking-tight">
          Milestones & Achievements
        </h2>
        <p className="text-xs sm:text-sm font-mono text-[#78716C] dark:text-[#A39E96] mt-1">
          Unlock badges as your consistency, habits, and daily streaks compound.
        </p>
      </div>

      {/* Gamification Level & Progress Card */}
      <div className="relative overflow-hidden bg-[#1A1A1A] dark:bg-[#161616] border border-[#33312E] dark:border-[#282725] rounded-2xl p-5 sm:p-7 text-[#FAF8F5] shadow-sm">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[11px] font-mono font-bold tracking-wider text-[#E8E3DA]">
              <Sparkles className="w-3.5 h-3.5 text-[#E08A50]" />
              ROUTINE MASTER • LEVEL {currentLevel}
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold">
              {unlockedCount} of {totalCount} Badges Unlocked
            </h3>
            <p className="text-xs sm:text-sm text-[#A8A29E] max-w-md font-mono">
              Keep building daily streaks and logging your routines to reach the next consistency tier.
            </p>
          </div>

          {/* Trophy Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#E08A50] shrink-0">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="mt-5 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-[#D0C9BE] mb-1.5">
            <span>Overall Badge Completion</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#A04000] dark:bg-[#E08A50] rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {achievements.map((ach) => (
          <motion.div
            key={ach.id}
            whileHover={{ y: -2 }}
            className={`relative p-4 sm:p-5 rounded-2xl border transition-all ${
              ach.unlocked
                ? 'bg-white dark:bg-[#1A1918] border-[#1A1A1A] dark:border-[#F3EFEA] shadow-xs'
                : 'bg-[#FAF8F5]/60 dark:bg-[#161616]/60 border-[#E8E3DA] dark:border-[#282725] opacity-75'
            }`}
          >
            <div className="flex items-start gap-3.5">
              {/* Badge Icon */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  ach.unlocked
                    ? 'bg-[#1A1A1A] dark:bg-[#F3EFEA] text-[#FAF8F5] dark:text-[#121212]'
                    : 'bg-[#F2EDE4] dark:bg-[#22211F] text-[#78716C] dark:text-[#A39E96]'
                }`}
              >
                {ach.unlocked ? (
                  <IconRenderer name={ach.icon} className="w-5 h-5" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </div>

              {/* Title & Desc */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-sm font-bold text-[#1A1A1A] dark:text-[#F3EFEA] truncate">
                    {ach.title}
                  </h4>
                  {ach.unlocked && (
                    <CheckCircle2 className="w-4 h-4 text-[#2D5A43] dark:text-[#68B087] shrink-0 ml-1" />
                  )}
                </div>

                <p className="text-xs text-[#78716C] dark:text-[#A39E96] mt-1 leading-relaxed">
                  {ach.description}
                </p>

                {/* Progress bar if not unlocked */}
                {!ach.unlocked && ach.totalRequired > 1 && (
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#78716C] dark:text-[#A39E96] mb-1">
                      <span>Progress</span>
                      <span>
                        {ach.currentProgress} / {ach.totalRequired}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#E8E3DA] dark:bg-[#282725] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1A1A1A] dark:bg-[#F3EFEA] rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (ach.currentProgress / ach.totalRequired) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
