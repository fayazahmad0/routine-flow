/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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

const ICONS = [
  'BookOpen',
  'Dumbbell',
  'Heart',
  'Moon',
  'Droplets',
  'Briefcase',
  'BookMarked',
  'Sparkles',
  'Code',
  'Footprints',
  'Coffee',
  'Flame',
  'Smile',
  'Activity',
  'CheckSquare',
];

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
  const [icon, setIcon] = useState<string>('BookOpen');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('everyday');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [timesPerWeek, setTimesPerWeek] = useState<number>(3);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  const [reminderTime, setReminderTime] = useState<string>('08:00');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

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
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    try {
      setIsSubmitting(true);
      await addTask({
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
      });

      // Reset and close only on success
      setTitle('');
      setDescription('');
      setFormError(null);
      onClose();
    } catch (err: any) {
      console.error('Error adding task in modal:', err);
      setFormError(
        err?.message || 'Failed to create task. Please verify your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Add New Habit / Task
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Error Banner */}
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1">
                <span>{formError}</span>
              </div>
            </div>
          )}

          {/* Task Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Task / Habit Name *
            </label>
            <input
              id="add-task-name-input"
              type="text"
              required
              autoFocus
              placeholder="e.g. Study Coding, Gym Workout, Read Book"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formError) setFormError(null);
              }}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Optional Notes / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              id="add-task-description-input"
              rows={2}
              placeholder="Add cues, intentions, or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Value & Unit (if not checkbox) */}
          {type !== 'checkbox' && (
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Value
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="any"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unit
                </label>
                {type === 'duration' ? (
                  <select
                    value={targetUnit}
                    onChange={(e) => setTargetUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
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
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
                  />
                )}
              </div>
            </div>
          )}

          {/* Category Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Category
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {isCreatingCategory ? 'Cancel' : '+ New Category'}
              </button>
            </div>

            {isCreatingCategory ? (
              <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
                <input
                  type="text"
                  placeholder="Category Name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
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
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
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
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all truncate cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Frequency & Schedule
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { id: 'everyday' as ScheduleType, label: 'Every Day' },
                { id: 'specific_days' as ScheduleType, label: 'Specific Days' },
                { id: 'weekly' as ScheduleType, label: 'Times / Week' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScheduleType(s.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-center cursor-pointer ${
                    scheduleType === s.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Specific Days Picker */}
            {scheduleType === 'specific_days' && (
              <div className="flex items-center justify-between gap-1.5 p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
                {DAYS_OF_WEEK.map((day) => {
                  const isDaySelected = selectedDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                        isDaySelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
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
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Goal:
                </span>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={timesPerWeek}
                  onChange={(e) => setTimesPerWeek(Number(e.target.value))}
                  className="w-16 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  days per week
                </span>
              </div>
            )}
          </div>

          {/* Reminder */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Daily Reminder
                </span>
              </div>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {reminderEnabled && (
              <div className="flex items-center gap-2 pt-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="add-task-submit-btn"
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-sm rounded-2xl shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
