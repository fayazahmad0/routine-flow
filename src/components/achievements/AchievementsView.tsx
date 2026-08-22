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
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Milestones & Achievements
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          Unlock badges as your consistency, habits, and daily streaks compound.
        </p>
      </div>

      {/* Gamification Level & Progress Card */}
      <div className="relative overflow-hidden bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/20">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              ROUTINE MASTER LEVEL {currentLevel}
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold">
              {unlockedCount} of {totalCount} Badges Unlocked
            </h3>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-md">
              Keep building daily streaks and logging your routines to reach the next consistency tier.
            </p>
          </div>

          {/* Trophy Icon */}
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
            <Trophy className="w-10 h-10 drop-shadow-md" />
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="mt-6 pt-4 border-t border-white/15">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-100 mb-1.5">
            <span>Progress to all badges</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-300 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((ach) => (
          <motion.div
            key={ach.id}
            whileHover={{ y: -2 }}
            className={`relative p-5 rounded-3xl border transition-all ${
              ach.unlocked
                ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800/80 shadow-sm'
                : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/50 opacity-75'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Badge Icon */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  ach.unlocked
                    ? 'bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                }`}
              >
                {ach.unlocked ? (
                  <IconRenderer name={ach.icon} className="w-6 h-6" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>

              {/* Title & Desc */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {ach.title}
                  </h4>
                  {ach.unlocked && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-1" />
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {ach.description}
                </p>

                {/* Progress bar if not unlocked */}
                {!ach.unlocked && ach.totalRequired > 1 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>
                        {ach.currentProgress} / {ach.totalRequired}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
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
