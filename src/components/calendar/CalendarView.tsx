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
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] dark:text-[#F3EFEA] tracking-tight">
            Habit Calendar
          </h2>
          <p className="text-xs sm:text-sm font-mono text-[#78716C] dark:text-[#A39E96] mt-1">
            Visual habit tracker, daily consistency history, and monthly performance.
          </p>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleJumpToToday}
            className="px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-[#1A1918] border border-[#E8E3DA] dark:border-[#282725] text-[#1A1A1A] dark:text-[#F3EFEA] hover:bg-[#F2EDE4] dark:hover:bg-[#252422] rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Today
          </button>

          <div className="flex items-center bg-white dark:bg-[#1A1918] border border-[#E8E3DA] dark:border-[#282725] rounded-xl p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-[#78716C] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA] rounded-lg hover:bg-[#F2EDE4] dark:hover:bg-[#252422] cursor-pointer"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-mono font-bold text-[#1A1A1A] dark:text-[#F3EFEA] min-w-[110px] text-center">
              {getMonthName(month)} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-[#78716C] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA] rounded-lg hover:bg-[#F2EDE4] dark:hover:bg-[#252422] cursor-pointer"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Summary Strip */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-3.5 sm:p-5 border border-[#E8E3DA] dark:border-[#282725] shadow-xs text-center sm:text-left">
          <p className="text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-[#78716C] dark:text-[#A39E96]">Avg Rate</p>
          <p className="font-serif text-xl sm:text-2xl font-bold text-[#A04000] dark:text-[#E08A50] mt-0.5">
            {monthPerformanceSummary.avgRate}%
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-3.5 sm:p-5 border border-[#E8E3DA] dark:border-[#282725] shadow-xs text-center sm:text-left">
          <p className="text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-[#78716C] dark:text-[#A39E96]">Perfect Days</p>
          <p className="font-serif text-xl sm:text-2xl font-bold text-[#2D5A43] dark:text-[#68B087] mt-0.5">
            {monthPerformanceSummary.perfectCount}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-3.5 sm:p-5 border border-[#E8E3DA] dark:border-[#282725] shadow-xs text-center sm:text-left">
          <p className="text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-[#78716C] dark:text-[#A39E96]">Fulfilled</p>
          <p className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A1A] dark:text-[#F3EFEA] mt-0.5">
            {monthPerformanceSummary.totalCompleted}
          </p>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-3 sm:p-6 border border-[#E8E3DA] dark:border-[#282725] shadow-xs">
        {/* Day Header Row */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
          {weekDayNames.map((d) => (
            <div
              key={d}
              className="text-[11px] sm:text-xs font-mono font-bold text-[#78716C] dark:text-[#A39E96] py-1 uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {daysInMonth.map(({ date, dateStr, isCurrentMonth }) => {
            const isToday = dateStr === todayDateStr;
            const isFuture = dateStr > todayDateStr;
            const perf = getDayPerformance(dateStr);
            const hasActivity = perf.totalScheduled > 0;

            let bgColor = 'bg-[#FAF8F5] dark:bg-[#1A1918]';
            let textColor = 'text-[#1A1A1A] dark:text-[#F3EFEA]';
            let badgeColor = '';

            if (!isCurrentMonth) {
              textColor = 'text-[#D0C9BE] dark:text-[#4A4744]';
              bgColor = 'bg-[#FAF8F5]/40 dark:bg-[#161616]/40';
            } else if (isFuture) {
              textColor = 'text-[#A8A29E] dark:text-[#66625D]';
            } else if (hasActivity) {
              if (perf.completionRate === 100) {
                bgColor = 'bg-[#EBF5EE] dark:bg-[#1E2E24] border-[#CDE5D5] dark:border-[#2A4434]';
                badgeColor = 'bg-[#2D5A43] text-white';
              } else if (perf.completionRate >= 50) {
                bgColor = 'bg-[#FFF8F0] dark:bg-[#2B231B] border-[#F4E3D0] dark:border-[#423425]';
                badgeColor = 'bg-[#A04000] text-white';
              } else if (perf.completionRate > 0) {
                bgColor = 'bg-[#FFF5F5] dark:bg-[#2A1616] border-[#FCDADA] dark:border-[#4E2424]';
                badgeColor = 'bg-[#B91C1C] text-white';
              }
            }

            return (
              <motion.button
                key={dateStr}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedDateStr(dateStr)}
                id={`cal-cell-${dateStr}`}
                className={`relative min-h-[58px] sm:min-h-[84px] p-1.5 sm:p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${bgColor} ${
                  isToday
                    ? 'ring-2 ring-[#1A1A1A] dark:ring-[#F3EFEA] shadow-xs font-bold border-[#1A1A1A] dark:border-[#F3EFEA]'
                    : 'border-[#E8E3DA] dark:border-[#282725]'
                }`}
              >
                {/* Top: Day Number & Today Tag */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs sm:text-sm font-mono font-bold ${
                      isToday ? 'text-[#1A1A1A] dark:text-[#F3EFEA]' : textColor
                    }`}
                  >
                    {date.getDate()}
                  </span>

                  {isToday && (
                    <span className="hidden sm:inline-block text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 bg-[#1A1A1A] text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] rounded-md">
                      Today
                    </span>
                  )}
                </div>

                {/* Bottom: Completion progress */}
                {isCurrentMonth && !isFuture && hasActivity && (
                  <div className="mt-1">
                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono font-bold">
                      <span className={badgeColor ? 'px-1 py-0.2 rounded text-[8px] sm:text-[9px] ' + badgeColor : 'text-[#78716C]'}>
                        {perf.completedCount}/{perf.totalScheduled}
                      </span>
                      <span className="hidden sm:inline text-[#78716C] dark:text-[#A39E96] font-semibold">
                        {perf.completionRate}%
                      </span>
                    </div>

                    {/* Mini bar */}
                    <div className="w-full h-1 bg-[#E2DDD5] dark:bg-[#2E2C2A] rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          perf.completionRate === 100
                            ? 'bg-[#2D5A43] dark:bg-[#68B087]'
                            : perf.completionRate >= 50
                            ? 'bg-[#A04000] dark:text-[#E08A50]'
                            : 'bg-[#B91C1C]'
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
        <div className="mt-5 pt-3 border-t border-[#EDE7DD] dark:border-[#282725] flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] font-mono font-semibold text-[#78716C] dark:text-[#A39E96]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2D5A43]" />
            <span>100% (Perfect)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#A04000]" />
            <span>50-99% (Partial)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#B91C1C]" />
            <span>1-49% (Low)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#E2DDD5] dark:bg-[#2E2C2A]" />
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
