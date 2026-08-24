/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useRoutine } from '../../context/RoutineContext';
import { MoodType, Category, Task } from '../../types';
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

interface DailyDetailTaskRowProps {
  task: Task;
  completed: boolean;
  actualValue?: number;
  dateStr: string;
  isFuture: boolean;
  category?: Category;
  onToggle: (taskId: string, dateStr: string, nextCompleted: boolean) => void;
}

const DailyDetailTaskRow: React.FC<DailyDetailTaskRowProps> = ({
  task,
  completed,
  actualValue,
  dateStr,
  isFuture,
  category,
  onToggle,
}) => {
  const [localCompleted, setLocalCompleted] = useState<boolean>(completed);

  useEffect(() => {
    setLocalCompleted(completed);
  }, [completed]);

  const handleClick = () => {
    if (isFuture) return;
    const nextCompleted = !localCompleted;
    setLocalCompleted(nextCompleted);
    onToggle(task.taskId, dateStr, nextCompleted);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center justify-between p-3 rounded-xl border transition-all touch-manipulation active:scale-[0.99] ${
        isFuture ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      } ${
        localCompleted
          ? 'bg-[#EBF5EE] dark:bg-[#1E2E24] border-[#CDE5D5] dark:border-[#2A4434]'
          : 'bg-white dark:bg-[#1A1918] border-[#E8E3DA] dark:border-[#282725]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
            localCompleted
              ? 'bg-[#2D5A43] dark:bg-[#68B087] text-white dark:text-[#121212]'
              : 'border-2 border-[#D0C9BE] dark:border-[#4A4744]'
          }`}
        >
          {localCompleted && <Check className="w-4 h-4 stroke-[3]" />}
        </div>

        <div>
          <p className={`text-sm font-semibold ${localCompleted ? 'line-through text-[#78716C]' : 'text-[#1A1A1A] dark:text-[#F3EFEA]'}`}>
            {task.title}
          </p>
          <p className="text-[11px] font-mono text-[#78716C] dark:text-[#A39E96]">
            {category?.name} {task.targetValue ? `• Target: ${task.targetValue} ${task.targetUnit || ''}` : ''}
          </p>
        </div>
      </div>

      <span
        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
          localCompleted
            ? 'bg-[#D6EBE0] dark:bg-[#253D30] text-[#2D5A43] dark:text-[#68B087]'
            : 'bg-[#F2EDE4] dark:bg-[#22211F] text-[#78716C] dark:text-[#A39E96]'
        }`}
      >
        {localCompleted ? 'Fulfilled' : 'Pending'}
      </span>
    </div>
  );
};

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
        className="fixed inset-0 bg-[#1A1A1A]/60 dark:bg-black/80 backdrop-blur-xs"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg max-h-[90vh] bg-[#FAF8F5] dark:bg-[#161616] rounded-2xl shadow-2xl border border-[#E8E3DA] dark:border-[#282725] flex flex-col z-10 overflow-hidden"
      >
        {/* Header with Prev/Next Navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E3DA] dark:border-[#282725] bg-white dark:bg-[#1A1918]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectDate(addDaysToDateString(dateStr, -1))}
              className="p-1 text-[#78716C] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA] rounded-lg hover:bg-[#F2EDE4] dark:hover:bg-[#252422] cursor-pointer"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-serif text-base font-bold text-[#1A1A1A] dark:text-[#F3EFEA]">
                {fullDateLabel}
              </h3>
              <span className="text-[11px] font-mono font-bold text-[#A04000] dark:text-[#E08A50]">
                {dateStr === todayDateStr ? "Today's Dispatch" : dateStr}
              </span>
            </div>

            <button
              onClick={() => onSelectDate(addDaysToDateString(dateStr, 1))}
              className="p-1 text-[#78716C] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA] rounded-lg hover:bg-[#F2EDE4] dark:hover:bg-[#252422] cursor-pointer"
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#78716C] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA] rounded-xl hover:bg-[#F2EDE4] dark:hover:bg-[#252422] cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Progress Overview Card */}
          <div className="p-4 bg-white dark:bg-[#1A1918] rounded-xl border border-[#E8E3DA] dark:border-[#282725] flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-mono font-semibold text-[#78716C] dark:text-[#A39E96] uppercase tracking-wider">
                Completion Rate
              </p>
              <h4 className="font-serif text-2xl font-bold text-[#1A1A1A] dark:text-[#F3EFEA] mt-0.5">
                {performance.completionRate}%
              </h4>
              <p className="text-xs text-[#78716C] dark:text-[#A39E96] mt-0.5 font-mono">
                {performance.completedCount} of {performance.totalScheduled} completed
              </p>
            </div>

            <div className="w-14 h-14 rounded-full flex items-center justify-center font-mono font-bold text-base border-4 border-[#1A1A1A] dark:border-[#F3EFEA] text-[#1A1A1A] dark:text-[#F3EFEA]">
              {performance.completionRate}%
            </div>
          </div>

          {/* Scheduled Tasks for this date */}
          <div>
            <h4 className="text-[11px] font-mono font-bold text-[#78716C] dark:text-[#A39E96] uppercase tracking-wider mb-2.5">
              Scheduled Habits ({performance.tasks.length})
            </h4>

            {performance.tasks.length === 0 ? (
              <p className="text-xs text-[#78716C] dark:text-[#A39E96] italic p-4 text-center bg-white dark:bg-[#1A1918] rounded-xl border border-[#E8E3DA] dark:border-[#282725]">
                No active habits were scheduled for this date.
              </p>
            ) : (
              <div className="space-y-2">
                {performance.tasks.map(({ task, completed, actualValue }) => (
                  <DailyDetailTaskRow
                    key={task.taskId}
                    task={task}
                    completed={completed}
                    actualValue={actualValue}
                    dateStr={dateStr}
                    isFuture={isFuture}
                    category={getCategory(task.categoryId)}
                    onToggle={toggleTaskCompletion}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Daily Reflection & Mood for this date */}
          <div className="p-4 bg-white dark:bg-[#1A1918] rounded-xl border border-[#E8E3DA] dark:border-[#282725] space-y-3 shadow-xs">
            <h4 className="text-[11px] font-mono font-bold text-[#78716C] dark:text-[#A39E96] uppercase tracking-wider flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-[#A04000] dark:text-[#E08A50]" />
              Evening Journal Entry
            </h4>

            {/* Mood selector */}
            <div className="grid grid-cols-4 gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleMoodSelect(m.id)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    mood === m.id
                      ? 'border-[#1A1A1A] dark:border-[#F3EFEA] bg-[#F2EDE4] dark:bg-[#252422] text-[#1A1A1A] dark:text-[#F3EFEA] ring-1 ring-[#1A1A1A] dark:ring-[#F3EFEA]'
                      : 'border-[#E8E3DA] dark:border-[#282725] hover:bg-[#F2EDE4] dark:hover:bg-[#252422] text-[#78716C] dark:text-[#A39E96]'
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
              className="w-full p-3 bg-[#FAF8F5] dark:bg-[#161616] border border-[#E8E3DA] dark:border-[#33302D] rounded-xl text-xs font-medium text-[#1A1A1A] dark:text-[#F3EFEA] placeholder-[#78716C] dark:placeholder-[#8C8780] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#F3EFEA] resize-none"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveReflection}
                disabled={isSaving}
                className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-[#33312E] dark:bg-[#F3EFEA] dark:text-[#121212] dark:hover:bg-[#E2DDD5] text-[#FAF8F5] text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
