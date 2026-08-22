/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useRoutine } from '../../context/RoutineContext';
import { MoodType } from '../../types';
import {
  History as HistoryIcon,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Calendar,
  Smile,
  Meh,
  Frown,
  Sparkles,
} from 'lucide-react';
import {
  formatFullDate,
  formatDayName,
  addDaysToDateString,
} from '../../utils/dateUtils';
import { DailyDetailModal } from '../calendar/DailyDetailModal';
import { motion, AnimatePresence } from 'motion/react';

export const HistoryView: React.FC = () => {
  const {
    tasks,
    completions,
    dailyRecords,
    todayDateStr,
    getDayPerformance,
  } = useRoutine();

  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<MoodType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'perfect' | 'incomplete'>('all');
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Generate last 60 days
  const historyDays = useMemo(() => {
    const list = [];
    for (let i = 0; i < 60; i++) {
      const dateStr = addDaysToDateString(todayDateStr, -i);
      const perf = getDayPerformance(dateStr);
      list.push({
        dateStr,
        perf,
      });
    }
    return list;
  }, [todayDateStr, getDayPerformance]);

  const filteredHistory = useMemo(() => {
    return historyDays.filter(({ dateStr, perf }) => {
      // Mood filter
      if (moodFilter !== 'all' && perf.record?.mood !== moodFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'perfect' && !perf.isPerfect) return false;
      if (statusFilter === 'incomplete' && (perf.isPerfect || perf.completedCount === 0)) return false;

      // Note search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const note = perf.record?.note?.toLowerCase() || '';
        const dateMatch = dateStr.includes(q);
        if (!note.includes(q) && !dateMatch) return false;
      }

      return true;
    });
  }, [historyDays, moodFilter, statusFilter, searchQuery]);

  const getMoodEmoji = (m?: MoodType) => {
    if (m === 'great') return '😄';
    if (m === 'good') return '🙂';
    if (m === 'okay') return '😐';
    if (m === 'bad') return '😔';
    return null;
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'CompletionRate', 'CompletedTasks', 'TotalTasks', 'Mood', 'ReflectionNote'];
    const rows = historyDays.map(({ dateStr, perf }) => [
      dateStr,
      `${perf.completionRate}%`,
      perf.completedCount,
      perf.totalScheduled,
      perf.record?.mood || 'None',
      `"${(perf.record?.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `routineflow_history_${todayDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      tasks,
      completions,
      dailyRecords,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `routineflow_backup_${todayDateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.removeChild(downloadAnchor);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header & Export CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] dark:text-[#F3EFEA] tracking-tight">
            Activity Archive
          </h2>
          <p className="text-xs sm:text-sm font-mono text-[#78716C] dark:text-[#A39E96] mt-1">
            Browse through your daily records, reflection notes, and past completions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#1A1918] border border-[#E8E3DA] dark:border-[#282725] hover:bg-[#F2EDE4] dark:hover:bg-[#252422] text-[#1A1A1A] dark:text-[#F3EFEA] text-xs font-mono font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            id="export-json-btn"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1A1A1A] hover:bg-[#33312E] dark:bg-[#F3EFEA] dark:text-[#121212] dark:hover:bg-[#E2DDD5] text-[#FAF8F5] text-xs font-mono font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Backup JSON
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes or dates (e.g. 2026-08)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1A1918] border border-[#E8E3DA] dark:border-[#282725] rounded-xl text-xs font-mono text-[#1A1A1A] dark:text-[#F3EFEA] placeholder-[#A8A29E] dark:placeholder-[#66625D] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#F3EFEA]"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center p-1 bg-[#F2EDE4] dark:bg-[#22211F] rounded-xl shrink-0 border border-[#E2DDD5] dark:border-[#2E2C2A]">
          {(['all', 'perfect', 'incomplete'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold capitalize transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-white dark:bg-[#1A1918] text-[#1A1A1A] dark:text-[#F3EFEA] shadow-xs'
                  : 'text-[#78716C] dark:text-[#A39E96] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="space-y-2.5">
        <AnimatePresence>
          {filteredHistory.map(({ dateStr, perf }) => {
            const isToday = dateStr === todayDateStr;
            const moodEmoji = getMoodEmoji(perf.record?.mood);

            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                  isToday
                    ? 'bg-white dark:bg-[#1A1918] border-[#1A1A1A] dark:border-[#F3EFEA] ring-1 ring-[#1A1A1A] dark:ring-[#F3EFEA]'
                    : 'bg-white dark:bg-[#1A1918] border-[#E8E3DA] dark:border-[#282725] hover:border-[#D0C9BE] dark:hover:border-[#383633] shadow-xs'
                }`}
              >
                {/* Left: Date & Mood */}
                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                  <div
                    className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0 font-mono font-bold ${
                      perf.isPerfect
                        ? 'bg-[#2D5A43] text-white dark:bg-[#68B087] dark:text-[#121212]'
                        : perf.completionRate >= 50
                        ? 'bg-[#A04000] text-white dark:bg-[#E08A50] dark:text-[#121212]'
                        : 'bg-[#F2EDE4] dark:bg-[#22211F] text-[#78716C] dark:text-[#A39E96]'
                    }`}
                  >
                    <span className="text-[10px] uppercase leading-none">
                      {formatDayName(new Date(dateStr + 'T00:00:00'))}
                    </span>
                    <span className="text-xs font-bold mt-0.5">
                      {new Date(dateStr + 'T00:00:00').getDate()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif text-sm font-bold text-[#1A1A1A] dark:text-[#F3EFEA]">
                        {formatFullDate(dateStr)}
                      </h4>
                      {isToday && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase bg-[#1A1A1A] text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] rounded-md">
                          Today
                        </span>
                      )}
                      {moodEmoji && (
                        <span className="text-sm" title={`Mood: ${perf.record?.mood}`}>
                          {moodEmoji}
                        </span>
                      )}
                    </div>

                    {perf.record?.note ? (
                      <p className="text-xs text-[#57534E] dark:text-[#A39E96] mt-0.5 line-clamp-1 italic">
                        "{perf.record.note}"
                      </p>
                    ) : (
                      <p className="text-[11px] font-mono text-[#78716C] dark:text-[#78716C] mt-0.5">
                        {perf.completedCount} of {perf.totalScheduled} habits fulfilled
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Completion Percentage & Mini bar */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F2EDE4] dark:border-[#22211F]">
                  <div className="sm:text-right">
                    <span className="text-xs font-mono font-bold text-[#1A1A1A] dark:text-[#F3EFEA]">
                      {perf.completionRate}%
                    </span>
                    <p className="text-[10px] font-mono text-[#78716C] dark:text-[#A39E96]">
                      {perf.completedCount}/{perf.totalScheduled}
                    </p>
                  </div>

                  <div className="w-20 sm:w-24 h-2 bg-[#F2EDE4] dark:bg-[#22211F] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        perf.isPerfect
                          ? 'bg-[#2D5A43] dark:bg-[#68B087]'
                          : perf.completionRate >= 50
                          ? 'bg-[#A04000] dark:bg-[#E08A50]'
                          : 'bg-[#B91C1C]'
                      }`}
                      style={{ width: `${perf.completionRate}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
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
