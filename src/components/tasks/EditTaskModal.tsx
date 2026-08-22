/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Archive,
  Trash2,
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
  const { updateTask, archiveTask, deleteTask, categories } = useRoutine();

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
    }
  }, [task, categories]);

  if (!isOpen || !task) return null;

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    try {
      setIsSubmitting(true);
      await updateTask(task.taskId, {
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
      });
      onClose();
    } catch (err) {
      console.error('Error updating task:', err);
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Edit Habit / Task
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Task Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white"
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
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Value
                </label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={targetUnit}
                  onChange={(e) => setTargetUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold"
                />
              </div>
            </div>
          )}

          {/* Schedule */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                  className={`p-2 rounded-xl border text-xs font-semibold ${
                    scheduleType === s.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {scheduleType === 'specific_days' && (
              <div className="flex items-center justify-between gap-1 p-2.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold ${
                      selectedDays.includes(day.id)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Active / Pause */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">Active Status</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isActive ? 'Habit is active and scheduled' : 'Habit is paused'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                isActive
                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {isActive ? 'Active' : 'Paused'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                deleteTask(task.taskId);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl"
            >
              <Trash2 className="w-4 h-4" />
              Delete Task
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
