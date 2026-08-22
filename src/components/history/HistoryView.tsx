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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Activity History
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Browse through your daily records, reflection notes, and past completions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            id="export-json-btn"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Backup JSON
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes or dates (e.g. 2026-08)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0">
          {(['all', 'perfect', 'incomplete'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
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
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer ${
                  isToday
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                {/* Left: Date & Mood */}
                <div className="flex items-center gap-3.5 mb-2 sm:mb-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-bold ${
                      perf.isPerfect
                        ? 'bg-emerald-500 text-white'
                        : perf.completionRate >= 50
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs uppercase leading-none">
                      {formatDayName(new Date(dateStr + 'T00:00:00'))}
                    </span>
                    <span className="text-sm font-black mt-0.5">
                      {new Date(dateStr + 'T00:00:00').getDate()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatFullDate(dateStr)}
                      </h4>
                      {isToday && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-indigo-600 text-white rounded-full">
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
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1 italic">
                        "{perf.record.note}"
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {perf.completedCount} of {perf.totalScheduled} habits completed
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Completion Percentage & Mini bar */}
                <div className="flex items-center gap-4 sm:justify-end">
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {perf.completionRate}%
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {perf.completedCount}/{perf.totalScheduled} done
                    </p>
                  </div>

                  <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        perf.isPerfect
                          ? 'bg-emerald-500'
                          : perf.completionRate >= 50
                          ? 'bg-amber-500'
                          : 'bg-rose-400'
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
