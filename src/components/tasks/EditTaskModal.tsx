/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useRoutine } from '../../context/RoutineContext';
import { Task, TaskType, ScheduleType } from '../../types';
import {
  X,
  Check,
  Clock,
  CheckSquare,
  Hash,
  Target,
  Bell,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { id: 1, label: 'M', full: 'Monday' },
  { id: 2, label: 'T', full: 'Tuesday' },
  { id: 3, label: 'W', full: 'Wednesday' },
  { id: 4, label: 'T', full: 'Thursday' },
  { id: 5, label: 'F', full: 'Friday' },
  { id: 6, label: 'S', full: 'Saturday' },
  { id: 0, label: 'S', full: 'Sunday' },
];

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, isOpen, onClose }) => {
  const { updateTask, deleteTask, categories } = useRoutine();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('checkbox');
  const [targetValue, setTargetValue] = useState<number>(1);
  const [targetUnit, setTargetUnit] = useState<string>('Hours');
  const [categoryId, setCategoryId] = useState<string>('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('everyday');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [timesPerWeek, setTimesPerWeek] = useState<number>(3);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  const [reminderTime, setReminderTime] = useState<string>('08:00');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setType(task.type || 'checkbox');
      setTargetValue(task.targetValue || 1);
      setTargetUnit(task.targetUnit || 'Hours');
      setCategoryId(task.categoryId || categories[0]?.categoryId || 'study');
      setScheduleType(task.schedule?.type || 'everyday');
      setSelectedDays(task.schedule?.days || [1, 2, 3, 4, 5]);
      setTimesPerWeek(task.schedule?.timesPerWeek || 3);
      setReminderEnabled(task.reminderEnabled || false);
      setReminderTime(task.reminderTime || '08:00');
      setIsActive(task.isActive ?? true);
      setFormError(null);
      setIsSubmitting(false);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [task, categories, isOpen]);

  if (!isOpen || !task) return null;

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setFormError('Please enter a task title.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      updateTask(task.taskId, {
        title: cleanTitle,
        description: description.trim() ? description.trim() : '',
        type,
        targetValue: type !== 'checkbox' ? Number(targetValue) : undefined,
        targetUnit: type !== 'checkbox' ? (targetUnit.trim() || 'Units') : undefined,
        categoryId: categoryId || categories[0]?.categoryId || 'study',
        schedule: {
          type: scheduleType,
          days: scheduleType === 'specific_days' || scheduleType === 'custom' ? selectedDays : [0, 1, 2, 3, 4, 5, 6],
          timesPerWeek: scheduleType === 'weekly' ? Number(timesPerWeek) : 7,
        },
        reminderEnabled: Boolean(reminderEnabled),
        reminderTime: reminderEnabled ? (reminderTime || '08:00') : '',
        isActive,
      }).catch((err) => {
        console.error('[RoutineFlow] Error updating task:', err);
      });

      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error('[RoutineFlow] Error updating task:', err);
      setIsSubmitting(false);
      setFormError(err?.message || 'Could not save changes. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="relative w-full max-w-lg max-h-[88dvh] sm:max-h-[90dvh] bg-[#FAF8F5] dark:bg-[#1A1918] rounded-2xl shadow-2xl border border-[#E4DFD7] dark:border-[#2C2A28] flex flex-col z-10 overflow-hidden text-[#1A1A1A] dark:text-[#F3EFEA]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-[#E8E3DA] dark:border-[#282725] bg-white/80 dark:bg-[#1C1B1A]/80 backdrop-blur-xs">
          <div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#1A1A1A] dark:text-[#F3EFEA]">
              Edit Habit / Task
            </h3>
            <p className="text-[11px] text-[#78716C] dark:text-[#A39E96]">
              Modify parameters, schedule & status
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#78716C] hover:text-[#1A1A1A] dark:text-[#A39E96] dark:hover:text-[#F3EFEA] rounded-lg hover:bg-[#EAE5DC] dark:hover:bg-[#252422] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span>{formError}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#44403C] dark:text-[#D6D1CA] mb-1.5">
              Task Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#22211F] border border-[#D0C9BE] dark:border-[#383633] rounded-xl text-sm font-semibold text-[#1A1A1A] dark:text-[#F3EFEA] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#F3EFEA] focus:ring-1 focus:ring-[#1A1A1A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#44403C] dark:text-[#D6D1CA] mb-1.5">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#22211F] border border-[#D0C9BE] dark:border-[#383633] rounded-xl text-sm font-semibold text-[#1A1A1A] dark:text-[#F3EFEA] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#F3EFEA]"
            >
              {categories.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type & Target */}
          {type !== 'checkbox' && (
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-white dark:bg-[#22211F] rounded-xl border border-[#D0C9BE] dark:border-[#383633]">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#44403C] dark:text-[#D6D1CA] mb-1">
                  Target Value
                </label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1A1918] border border-[#D0C9BE] dark:border-[#383633] rounded-lg text-sm font-bold text-[#1A1A1A] dark:text-[#F3EFEA]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#44403C] dark:text-[#D6D1CA] mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={targetUnit}
                  onChange={(e) => setTargetUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1A1918] border border-[#D0C9BE] dark:border-[#383633] rounded-lg text-sm font-bold text-[#1A1A1A] dark:text-[#F3EFEA]"
                />
              </div>
            </div>
          )}

          {/* Schedule */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#44403C] dark:text-[#D6D1CA] mb-1.5">
              Schedule
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[
                { id: 'everyday' as ScheduleType, label: 'Every Day' },
                { id: 'specific_days' as ScheduleType, label: 'Specific Days' },
                { id: 'weekly' as ScheduleType, label: 'Weekly' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScheduleType(s.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    scheduleType === s.id
                      ? 'bg-[#1A1A1A] text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] border-[#1A1A1A] dark:border-[#F3EFEA] shadow-xs'
                      : 'bg-white dark:bg-[#22211F] border-[#D0C9BE] dark:border-[#383633] text-[#44403C] dark:text-[#D6D1CA]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {scheduleType === 'specific_days' && (
              <div className="flex items-center justify-between gap-1 p-2.5 bg-white dark:bg-[#22211F] rounded-xl border border-[#D0C9BE] dark:border-[#383633]">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`w-8 sm:w-9 h-8 sm:h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                      selectedDays.includes(day.id)
                        ? 'bg-[#1A1A1A] text-white dark:bg-[#F3EFEA] dark:text-[#121212]'
                        : 'bg-[#FAF8F5] dark:bg-[#1A1918] text-[#78716C] dark:text-[#A39E96] border border-[#D0C9BE] dark:border-[#383633]'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Active / Pause */}
          <div className="flex items-center justify-between p-3.5 bg-white dark:bg-[#22211F] rounded-xl border border-[#D0C9BE] dark:border-[#383633]">
            <div>
              <span className="text-xs font-bold text-[#1A1A1A] dark:text-[#F3EFEA] block">Active Status</span>
              <p className="text-[11px] font-medium text-[#78716C] dark:text-[#A39E96]">
                {isActive ? 'Habit is active and scheduled' : 'Habit is currently paused'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-[#EAE5DC] dark:bg-[#2C2A28] text-[#78716C] dark:text-[#A39E96]'
              }`}
            >
              {isActive ? 'Active' : 'Paused'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                deleteTask(task.taskId);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Habit</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#1A1A1A] hover:bg-[#33312E] text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] dark:hover:bg-[#E2DDD5] text-xs font-mono font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save Changes</span>
                  <Check className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
