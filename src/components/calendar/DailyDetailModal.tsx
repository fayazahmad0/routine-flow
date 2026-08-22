/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useRoutine } from '../../context/RoutineContext';
import { MoodType, Category } from '../../types';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
  Sparkles,
  Edit3,
} from 'lucide-react';
import {
  formatFullDate,
  addDaysToDateString,
} from '../../utils/dateUtils';
import { IconRenderer } from '../common/IconRenderer';

interface DailyDetailModalProps {
  dateStr: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
}

const MOODS: { id: MoodType; label: string; emoji: string }[] = [
  { id: 'great', label: 'Great', emoji: '😄' },
  { id: 'good', label: 'Good', emoji: '🙂' },
  { id: 'okay', label: 'Okay', emoji: '😐' },
  { id: 'bad', label: 'Rough', emoji: '😔' },
];

export const DailyDetailModal: React.FC<DailyDetailModalProps> = ({
  dateStr,
  isOpen,
  onClose,
  onSelectDate,
}) => {
  const {
    getDayPerformance,
    toggleTaskCompletion,
    saveDailyRecord,
    categories,
    todayDateStr,
  } = useRoutine();

  const [note, setNote] = useState('');
  const [mood, setMood] = useState<MoodType>('none');
  const [isSaving, setIsSaving] = useState(false);

  const performance = dateStr ? getDayPerformance(dateStr) : null;

  useEffect(() => {
    if (performance?.record) {
      setNote(performance.record.note || '');
      setMood(performance.record.mood || 'none');
    } else {
      setNote('');
      setMood('none');
    }
  }, [performance?.record, dateStr]);

  if (!isOpen || !dateStr || !performance) return null;

  const isFuture = dateStr > todayDateStr;
  const fullDateLabel = formatFullDate(dateStr);

  const getCategory = (catId: string): Category | undefined => {
    return categories.find((c) => c.categoryId === catId);
  };

  const handleSaveReflection = async () => {
    try {
      setIsSaving(true);
      await saveDailyRecord(dateStr, note, mood);
    } catch (err) {
      console.error('Error saving reflection:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoodSelect = async (m: MoodType) => {
    setMood(m);
    await saveDailyRecord(dateStr, note, m);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-10 overflow-hidden"
      >
        {/* Header with Prev/Next Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectDate(addDaysToDateString(dateStr, -1))}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Previous Day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {fullDateLabel}
              </h3>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {dateStr === todayDateStr ? 'Today' : dateStr}
              </span>
            </div>

            <button
              onClick={() => onSelectDate(addDaysToDateString(dateStr, 1))}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Next Day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Progress Overview Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Completion Rate
              </p>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {performance.completionRate}%
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                {performance.completedCount} of {performance.totalScheduled} completed
              </p>
            </div>

            <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg border-4 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400">
              {performance.completionRate}%
            </div>
          </div>

          {/* Scheduled Tasks for this date */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Scheduled Habits ({performance.tasks.length})
            </h4>

            {performance.tasks.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic p-4 text-center bg-slate-50 dark:bg-slate-850 rounded-2xl">
                No active habits were scheduled for this date.
              </p>
            ) : (
              <div className="space-y-2.5">
                {performance.tasks.map(({ task, completed, actualValue }) => {
                  const category = getCategory(task.categoryId);

                  return (
                    <div
                      key={task.taskId}
                      onClick={() => !isFuture && toggleTaskCompletion(task.taskId, dateStr, !completed)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        completed
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            completed
                              ? 'bg-emerald-500 text-white'
                              : 'border-2 border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {completed && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>

                        <div>
                          <p className={`text-sm font-semibold ${completed ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {category?.name} {task.targetValue ? `• Target: ${task.targetValue} ${task.targetUnit || ''}` : ''}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          completed
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                        }`}
                      >
                        {completed ? 'Completed' : 'Not completed'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daily Reflection & Mood for this date */}
          <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
              Daily Reflection
            </h4>

            {/* Mood selector */}
            <div className="grid grid-cols-4 gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleMoodSelect(m.id)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                    mood === m.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600'
                  }`}
                >
                  <span className="mr-1">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Note text */}
            <textarea
              rows={3}
              placeholder="Notes or reflection for this day..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveReflection}
                disabled={isSaving}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {isSaving ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
