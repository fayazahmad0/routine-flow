/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useRoutine } from '../../context/RoutineContext';
import { Task, Category } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  Clock,
  Play,
  Pause,
  Flame,
  CheckSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TasksViewProps {
  onOpenAddTask: () => void;
  onEditTask: (task: Task) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onOpenAddTask, onEditTask }) => {
  const {
    tasks,
    categories,
    archiveTask,
    unarchiveTask,
    deleteTask,
    updateTask,
    streakStats,
  } = useRoutine();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active');

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (statusFilter === 'active' && task.isArchived) return false;
      if (statusFilter === 'archived' && !task.isArchived) return false;

      // Category filter
      if (selectedCategory !== 'all' && task.categoryId !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [tasks, statusFilter, selectedCategory, searchQuery]);

  const getCategory = (catId: string): Category | undefined => {
    return categories.find((c) => c.categoryId === catId);
  };

  const getScheduleLabel = (task: Task) => {
    const s = task.schedule;
    if (!s || s.type === 'everyday') return 'Every day';
    if (s.type === 'specific_days') {
      const map: Record<number, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 0: 'Sun' };
      return (s.days || []).map((d) => map[d]).join(', ');
    }
    if (s.type === 'weekly') return `${s.timesPerWeek || 3}x / week`;
    return 'Custom';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Habits & Routines
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Manage your daily tasks, targets, schedules, and active status.
          </p>
        </div>

        <button
          id="tasks-add-task-btn"
          onClick={onOpenAddTask}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-sm rounded-2xl shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Habit
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="tasks-search-input"
              type="text"
              placeholder="Search habits and routines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl shrink-0">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Active ({tasks.filter((t) => !t.isArchived).length})
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'archived'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Archived ({tasks.filter((t) => t.isArchived).length})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.categoryId}
              onClick={() => setSelectedCategory(cat.categoryId)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedCategory === cat.categoryId
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color || '#6366f1' }}
              />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Task Cards List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CheckSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">
            No habits found
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try clearing your search or category filters.'
              : 'Add your first routine to start building healthy habits.'}
          </p>
          <button
            onClick={onOpenAddTask}
            className="mt-5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Add Habit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredTasks.map((task) => {
              const category = getCategory(task.categoryId);
              const streak = streakStats.taskStreaks[task.taskId];

              return (
                <motion.div
                  key={task.taskId}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-all hover:border-indigo-200 dark:hover:border-indigo-800"
                >
                  <div>
                    {/* Top Row: Icon + Category + Streak Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: category?.color ? `${category.color}15` : '#6366f115',
                            color: category?.color || '#6366f1',
                          }}
                        >
                          <IconRenderer
                            name={task.icon || category?.icon || 'CheckSquare'}
                            className="w-6 h-6"
                          />
                        </div>
                        <div>
                          <span
                            className="inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: category?.color ? `${category.color}12` : '#6366f112',
                              color: category?.color || '#6366f1',
                            }}
                          >
                            {category?.name || 'Habit'}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                            {task.title}
                          </h3>
                        </div>
                      </div>

                      {streak && streak.current > 0 && (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-500/20">
                          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{streak.current}d</span>
                        </div>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Meta info: Target & Schedule */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-4">
                      {task.targetValue && (
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          🎯 {task.targetValue} {task.targetUnit || ''}
                        </span>
                      )}
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        🗓️ {getScheduleLabel(task)}
                      </span>
                      {task.reminderEnabled && task.reminderTime && (
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {task.reminderTime}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateTask(task.taskId, { isActive: !task.isActive })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          task.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                        title={task.isActive ? 'Pause Habit' : 'Resume Habit'}
                      >
                        {task.isActive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </>
                        ) : (
                          <>
                            <Pause className="w-3 h-3" />
                            Paused
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        title="Edit Habit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {task.isArchived ? (
                        <button
                          type="button"
                          onClick={() => unarchiveTask(task.taskId)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          title="Restore"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => archiveTask(task.taskId)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteTask(task.taskId)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
