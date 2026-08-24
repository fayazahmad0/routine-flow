/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRoutine } from '../../context/RoutineContext';
import { TaskType, ScheduleType } from '../../types';
import {
  X,
  Plus,
  Check,
  Clock,
  CheckSquare,
  Hash,
  Target,
  Calendar,
  Bell,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { IconRenderer } from '../common/IconRenderer';

interface AddTaskModalProps {
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

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose }) => {
  const { addTask, categories, addCategory } = useRoutine();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('checkbox');
  const [targetValue, setTargetValue] = useState<number>(1);
  const [targetUnit, setTargetUnit] = useState<string>('Hours');
  const [categoryId, setCategoryId] = useState<string>('');
  const [icon, setIcon] = useState<string>('CheckSquare');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('everyday');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [timesPerWeek, setTimesPerWeek] = useState<number>(3);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  const [reminderTime, setReminderTime] = useState<string>('08:00');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync categoryId if not set
  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].categoryId);
    }
  }, [categories, categoryId]);

  // Reset form error when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      setIsSubmitting(false);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  // New Category creator mini-form
  const [isCreatingCategory, setIsCreatingCategory] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatColor, setNewCatColor] = useState<string>('#6366f1');

  if (!isOpen) return null;

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const catId = await addCategory({
        name: newCatName.trim(),
        icon: 'CheckSquare',
        color: newCatColor,
      });
      setCategoryId(catId);
      setNewCatName('');
      setIsCreatingCategory(false);
    } catch (err: any) {
      setFormError(err?.message || 'Could not create category.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFormError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setFormError('Please enter a habit / task title.');
      return;
    }

    if (type !== 'checkbox') {
      const num = Number(targetValue);
      if (isNaN(num) || num <= 0) {
        setFormError('Please enter a valid positive target number.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      addTask({
        title: cleanTitle,
        description: description.trim() ? description.trim() : '',
        type,
        targetValue: type !== 'checkbox' ? Number(targetValue) : undefined,
        targetUnit: type !== 'checkbox' ? (targetUnit.trim() || 'Units') : undefined,
        categoryId: categoryId || categories[0]?.categoryId || 'study',
        icon,
        schedule: {
          type: scheduleType,
          days: scheduleType === 'specific_days' || scheduleType === 'custom' ? selectedDays : [0, 1, 2, 3, 4, 5, 6],
          timesPerWeek: scheduleType === 'weekly' ? Number(timesPerWeek) : 7,
        },
        reminderEnabled: Boolean(reminderEnabled),
        reminderTime: reminderEnabled ? (reminderTime || '08:00') : '',
        isActive: true,
        isArchived: false,
      }).catch((err) => {
        console.error('[RoutineFlow] Error adding task in modal:', err);
      });

      // 0ms instant close & form reset
      setTitle('');
      setDescription('');
      setFormError(null);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error('[RoutineFlow] Error adding task in modal:', err);
      setIsSubmitting(false);
      setFormError(
        err?.message || 'Failed to save habit. Please check your connection and try again.'
      );
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] text-white dark:bg-[#F3EFEA] dark:text-[#121212] flex items-center justify-center shadow-xs">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#1A1A1A] dark:text-[#F3EFEA]">
                Add New Habit / Task
              </h3>
              <p className="text-[11px] text-[#78716C] dark:text-[#A39E96]">
                Define schedule, metrics & daily focus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#78716C] hover:text-[#1A1A1A] dark:text-[#A39E96] dark:hover:text-[#F3EFEA] rounded-lg hover:bg-[#EAE5DC] dark:hover:bg-[#252422] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5">
          {/* Error Banner */}
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span>{formError}</span>
              </div>
            </div>
          )}

          {/* Task Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#44403C] dark:text-[#D6D1CA] mb-1.5">
              Habit / Task Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="add-task-name-input"
              type="text"
              required
              autoFocus
              placeholder="e.g., Morning Run, Read 20 Pages, Deep Coding"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formError) setFormError(null);
              }}
              className="w-full px-3.5 py-2.5 sm:py-3 bg-white dark:bg-[#22211F] border border-[#D0C9BE] dark:border-[#383633] rounded-xl text-sm font-semibold text-[#1A1A1A] dark:text-[#F3EFEA] placeholder-[#8C827A] dark:placeholder-[#78716C] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#F3EFEA] focus:ring-1 focus:ring-[#1A1A1A] dark:focus:ring-[#F3EFEA] transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#44403C] dark:text-[#D6D1CA] mb-1.5">
              Description / Intention (Optional)
            </label>
            <textarea
              id="add-task-description-input"
              rows={2}
              placeholder="Set your intention, cues, or target environment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-[#22211F] border border-[#D0C9BE] dark:border-[#383633] rounded-xl text-xs font-medium text-[#1A1A1A] dark:text-[#F3EFEA] placeholder-[#8C827A] dark:placeholder-[#78716C] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#F3EFEA] focus:ring-1 focus:ring-[#1A1A1A] dark:focus:ring-[#F3EFEA] resize-none transition-all"
            />
          </div>

          {/* Tracking Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#44403C] dark:text-[#D6D1CA] mb-1.5">
              Tracking Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'checkbox' as TaskType, label: 'Checkbox', icon: CheckSquare },
                { id: 'duration' as TaskType, label: 'Duration', icon: Clock },
                { id: 'quantity' as TaskType, label: 'Quantity', icon: Hash },
                { id: 'target' as TaskType, label: 'Target', icon: Target },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setType(t.id);
                      if (t.id === 'duration' && targetUnit !== 'Minutes') setTargetUnit('Hours');
                      if (t.id === 'quantity') setTargetUnit('Litres');
                      if (t.id === 'target') setTargetUnit('Steps');
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1A1A1A] text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] border-[#1A1A1A] dark:border-[#F3EFEA] shadow-xs'
                        : 'bg-white dark:bg-[#22211F] border-[#D0C9BE] dark:border-[#383633] text-[#44403C] dark:text-[#D6D1CA] hover:border-[#1A1A1A] dark:hover:border-[#F3EFEA]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Value & Unit (if not checkbox) */}
          {type !== 'checkbox' && (
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-white dark:bg-[#22211F] rounded-xl border border-[#D0C9BE] dark:border-[#383633]">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#44403C] dark:text-[#D6D1CA] mb-1">
                  Target Value
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="any"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1A1918] border border-[#D0C9BE] dark:border-[#383633] rounded-lg text-sm font-bold text-[#1A1A1A] dark:text-[#F3EFEA]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#44403C] dark:text-[#D6D1CA] mb-1">
                  Unit
                </label>
                {type === 'duration' ? (
                  <select
                    value={targetUnit}
                    onChange={(e) => setTargetUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1A1918] border border-[#D0C9BE] dark:border-[#383633] rounded-lg text-sm font-bold text-[#1A1A1A] dark:text-[#F3EFEA]"
                  >
                    <option value="Hours">Hours</option>
                    <option value="Minutes">Minutes</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Litres, Pages, Steps"
                    value={targetUnit}
                    onChange={(e) => setTargetUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] dark:bg-[#1A1918] border border-[#D0C9BE] dark:border-[#383633] rounded-lg text-sm font-bold text-[#1A1A1A] dark:text-[#F3EFEA]"
                  />
                )}
              </div>
            </div>
          )}

          {/* Category Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#44403C] dark:text-[#D6D1CA]">
                Category
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                className="text-xs font-bold text-[#1A1A1A] dark:text-[#F3EFEA] underline underline-offset-2 hover:opacity-80"
              >
                {isCreatingCategory ? 'Cancel' : '+ New Category'}
              </button>
            </div>

            {isCreatingCategory ? (
              <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-[#22211F] rounded-xl border border-[#D0C9BE] dark:border-[#383633]">
                <input
                  type="text"
                  placeholder="Category Name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#FAF8F5] dark:bg-[#1A1918] border border-[#D0C9BE] dark:border-[#383633] rounded-lg text-xs font-bold text-[#1A1A1A] dark:text-[#F3EFEA]"
                />
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border-0 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="px-3 py-1.5 bg-[#1A1A1A] dark:bg-[#F3EFEA] text-white dark:text-[#121212] rounded-lg text-xs font-bold"
                >
                  Create
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {categories.map((cat) => {
                  const isSelected = (categoryId || categories[0]?.categoryId) === cat.categoryId;
                  return (
                    <button
                      key={cat.categoryId}
                      type="button"
                      onClick={() => {
                        setCategoryId(cat.categoryId);
                        setIcon(cat.icon || 'CheckSquare');
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all truncate cursor-pointer ${
                        isSelected
                          ? 'bg-[#1A1A1A] text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] border-[#1A1A1A] dark:border-[#F3EFEA] shadow-xs'
                          : 'bg-white dark:bg-[#22211F] border-[#D0C9BE] dark:border-[#383633] text-[#44403C] dark:text-[#D6D1CA] hover:border-[#1A1A1A] dark:hover:border-[#F3EFEA]'
                      }`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || '#6366f1' }}
                      />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Schedule Frequency */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#44403C] dark:text-[#D6D1CA] mb-1.5">
              Frequency & Schedule
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2.5">
              {[
                { id: 'everyday' as ScheduleType, label: 'Every Day' },
                { id: 'specific_days' as ScheduleType, label: 'Specific Days' },
                { id: 'weekly' as ScheduleType, label: 'Times / Week' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScheduleType(s.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    scheduleType === s.id
                      ? 'bg-[#1A1A1A] text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] border-[#1A1A1A] dark:border-[#F3EFEA] shadow-xs'
                      : 'bg-white dark:bg-[#22211F] border-[#D0C9BE] dark:border-[#383633] text-[#44403C] dark:text-[#D6D1CA] hover:border-[#1A1A1A] dark:hover:border-[#F3EFEA]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Specific Days Picker */}
            {scheduleType === 'specific_days' && (
              <div className="flex items-center justify-between gap-1 p-2.5 bg-white dark:bg-[#22211F] rounded-xl border border-[#D0C9BE] dark:border-[#383633]">
                {DAYS_OF_WEEK.map((day) => {
                  const isDaySelected = selectedDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`w-8 sm:w-9 h-8 sm:h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                        isDaySelected
                          ? 'bg-[#1A1A1A] text-white dark:bg-[#F3EFEA] dark:text-[#121212] shadow-xs'
                          : 'bg-[#FAF8F5] dark:bg-[#1A1918] text-[#78716C] dark:text-[#A39E96] border border-[#D0C9BE] dark:border-[#383633]'
                      }`}
                      title={day.full}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Times per week */}
            {scheduleType === 'weekly' && (
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#22211F] rounded-xl border border-[#D0C9BE] dark:border-[#383633]">
                <span className="text-xs font-bold text-[#44403C] dark:text-[#D6D1CA]">
                  Goal Target:
                </span>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={timesPerWeek}
                  onChange={(e) => setTimesPerWeek(Number(e.target.value))}
                  className="w-16 px-3 py-1.5 bg-[#FAF8F5] dark:bg-[#1A1918] border border-[#D0C9BE] dark:border-[#383633] rounded-lg text-xs font-bold text-[#1A1A1A] dark:text-[#F3EFEA]"
                />
                <span className="text-xs font-medium text-[#78716C] dark:text-[#A39E96]">
                  days per week
                </span>
              </div>
            )}
          </div>

          {/* Daily Reminder - HIGH CONTRAST & CLEAR READABILITY */}
          <div className="p-3.5 sm:p-4 bg-[#F2EDE4] dark:bg-[#252422] rounded-xl border border-[#D0C9BE] dark:border-[#3E3C38] space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#1A1A1A] text-white dark:bg-[#F3EFEA] dark:text-[#121212]">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1A1A1A] dark:text-[#F3EFEA] block">
                    Daily Reminder
                  </span>
                  <span className="text-[11px] font-medium text-[#78716C] dark:text-[#A39E96]">
                    Notify at scheduled hour
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#D0C9BE] dark:bg-[#383633] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#D0C9BE] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A1A1A] dark:peer-checked:bg-[#F3EFEA] dark:peer-checked:after:bg-[#121212]"></div>
              </label>
            </div>

            {reminderEnabled && (
              <div className="flex items-center gap-2 pt-1 border-t border-[#D0C9BE]/60 dark:border-[#383633]">
                <Clock className="w-4 h-4 text-[#1A1A1A] dark:text-[#F3EFEA]" />
                <span className="text-xs font-bold text-[#44403C] dark:text-[#D6D1CA]">Set Time:</span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-[#1A1918] border border-[#D0C9BE] dark:border-[#383633] rounded-lg text-xs font-bold font-mono text-[#1A1A1A] dark:text-[#F3EFEA] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2 pb-1">
            <button
              id="add-task-submit-btn"
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="w-full py-3.5 px-6 bg-[#1A1A1A] hover:bg-[#33312E] active:scale-[0.98] text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] dark:hover:bg-[#E2DDD5] font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Habit...</span>
                </>
              ) : (
                <>
                  <span>Create Habit</span>
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
