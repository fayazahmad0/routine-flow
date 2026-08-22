/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useRoutine } from '../../context/RoutineContext';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  getMonthDays,
  formatDateToYYYYMMDD,
  getMonthName,
} from '../../utils/dateUtils';
import { DailyDetailModal } from './DailyDetailModal';
import { motion } from 'motion/react';

export const CalendarView: React.FC = () => {
  const {
    todayDateStr,
    getDayPerformance,
  } = useRoutine();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = useMemo(() => {
    return getMonthDays(year, month);
  }, [year, month]);

  const monthPerformanceSummary = useMemo(() => {
    let perfectCount = 0;
    let totalRateSum = 0;
    let daysWithTasks = 0;
    let totalCompleted = 0;

    daysInMonth.forEach(({ dateStr, isCurrentMonth }) => {
      if (isCurrentMonth && dateStr <= todayDateStr) {
        const perf = getDayPerformance(dateStr);
        if (perf.totalScheduled > 0) {
          daysWithTasks++;
          totalRateSum += perf.completionRate;
          totalCompleted += perf.completedCount;
          if (perf.isPerfect) perfectCount++;
        }
      }
    });

    const avgRate = daysWithTasks > 0 ? Math.round(totalRateSum / daysWithTasks) : 0;
    return { perfectCount, avgRate, totalCompleted };
  }, [daysInMonth, getDayPerformance, todayDateStr]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date());
    setSelectedDateStr(todayDateStr);
  };

  const weekDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Routine Calendar
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Visual habit tracker, daily consistency history, and monthly performance.
          </p>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleJumpToToday}
            className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Today
          </button>

          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 text-xs font-bold text-slate-900 dark:text-white min-w-[120px] text-center">
              {getMonthName(month)} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Summary Strip */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Monthly Average</p>
          <p className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {monthPerformanceSummary.avgRate}%
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Perfect Days</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {monthPerformanceSummary.perfectCount}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Habits Done</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {monthPerformanceSummary.totalCompleted}
          </p>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Day Header Row */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center">
          {weekDayNames.map((d) => (
            <div
              key={d}
              className="text-xs font-bold text-slate-400 dark:text-slate-500 py-1.5 uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {daysInMonth.map(({ date, dateStr, isCurrentMonth }) => {
            const isToday = dateStr === todayDateStr;
            const isFuture = dateStr > todayDateStr;
            const perf = getDayPerformance(dateStr);
            const hasActivity = perf.totalScheduled > 0;

            let bgColor = 'bg-slate-50 dark:bg-slate-850/50';
            let textColor = 'text-slate-700 dark:text-slate-300';
            let badgeColor = '';

            if (!isCurrentMonth) {
              textColor = 'text-slate-300 dark:text-slate-600';
              bgColor = 'bg-slate-50/40 dark:bg-slate-900/30';
            } else if (isFuture) {
              textColor = 'text-slate-400 dark:text-slate-600';
            } else if (hasActivity) {
              if (perf.completionRate === 100) {
                bgColor = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60';
                badgeColor = 'bg-emerald-500 text-white';
              } else if (perf.completionRate >= 50) {
                bgColor = 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60';
                badgeColor = 'bg-amber-500 text-white';
              } else if (perf.completionRate > 0) {
                bgColor = 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40';
                badgeColor = 'bg-rose-400 text-white';
              }
            }

            return (
              <motion.button
                key={dateStr}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedDateStr(dateStr)}
                id={`cal-cell-${dateStr}`}
                className={`relative min-h-[70px] sm:min-h-[90px] p-2 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${bgColor} ${
                  isToday
                    ? 'ring-2 ring-indigo-600 dark:ring-indigo-500 shadow-md font-black'
                    : 'border-slate-200/70 dark:border-slate-800/80'
                }`}
              >
                {/* Top: Day Number & Today Tag */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      isToday ? 'text-indigo-600 dark:text-indigo-400' : textColor
                    }`}
                  >
                    {date.getDate()}
                  </span>

                  {isToday && (
                    <span className="hidden sm:inline-block text-[9px] font-black uppercase px-1.5 py-0.5 bg-indigo-600 text-white rounded-md">
                      Today
                    </span>
                  )}
                </div>

                {/* Bottom: Completion progress */}
                {isCurrentMonth && !isFuture && hasActivity && (
                  <div className="mt-1">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className={badgeColor ? 'px-1.5 py-0.5 rounded-md text-[9px] ' + badgeColor : 'text-slate-500'}>
                        {perf.completedCount}/{perf.totalScheduled}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">
                        {perf.completionRate}%
                      </span>
                    </div>

                    {/* Mini bar */}
                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          perf.completionRate === 100
                            ? 'bg-emerald-500'
                            : perf.completionRate >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-400'
                        }`}
                        style={{ width: `${perf.completionRate}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500" />
            <span>100% (Perfect)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-500" />
            <span>50-99% (Partial)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-400" />
            <span>1-49% (Low)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-700" />
            <span>No activity</span>
          </div>
        </div>
      </div>

      {/* Daily Detail Modal */}
      <DailyDetailModal
        dateStr={selectedDateStr}
        isOpen={Boolean(selectedDateStr)}
        onClose={() => setSelectedDateStr(null)}
        onSelectDate={(newDate) => setSelectedDateStr(newDate)}
      />
    </div>
  );
};
