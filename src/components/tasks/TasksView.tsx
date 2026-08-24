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
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] dark:text-[#F3EFEA] tracking-tight">
            Habits & Routines
          </h2>
          <p className="text-xs sm:text-sm font-mono text-[#78716C] dark:text-[#A39E96] mt-1">
            Manage your daily tasks, targets, schedules, and active status.
          </p>
        </div>

        <button
          id="tasks-add-task-btn"
          onClick={onOpenAddTask}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#33312E] active:scale-95 text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] dark:hover:bg-[#E2DDD5] font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Routine</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#78716C] dark:text-[#A39E96] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="tasks-search-input"
              type="text"
              placeholder="Search habits and routines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1A1918] border border-[#E8E3DA] dark:border-[#282725] rounded-xl text-xs sm:text-sm font-medium text-[#1A1A1A] dark:text-[#F3EFEA] placeholder-[#78716C] dark:placeholder-[#8C8780] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#F3EFEA]"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center p-1 bg-[#F2EDE4] dark:bg-[#22211F] rounded-xl shrink-0 border border-[#E2DDD5] dark:border-[#2E2C2A]">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-[#1A1918] text-[#1A1A1A] dark:text-[#F3EFEA] shadow-xs'
                  : 'text-[#78716C] dark:text-[#A39E96] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA]'
              }`}
            >
              Active ({tasks.filter((t) => !t.isArchived).length})
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'archived'
                  ? 'bg-white dark:bg-[#1A1918] text-[#1A1A1A] dark:text-[#F3EFEA] shadow-xs'
                  : 'text-[#78716C] dark:text-[#A39E96] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA]'
              }`}
            >
              Archived ({tasks.filter((t) => t.isArchived).length})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#1A1A1A] text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] shadow-xs'
                : 'bg-white dark:bg-[#1A1918] text-[#57534E] dark:text-[#A39E96] border border-[#E8E3DA] dark:border-[#282725] hover:bg-[#F2EDE4] dark:hover:bg-[#252422]'
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
                  ? 'bg-[#1A1A1A] text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] shadow-xs'
                  : 'bg-white dark:bg-[#1A1918] text-[#57534E] dark:text-[#A39E96] border border-[#E8E3DA] dark:border-[#282725] hover:bg-[#F2EDE4] dark:hover:bg-[#252422]'
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
        <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-10 sm:p-14 text-center border border-[#E8E3DA] dark:border-[#282725] shadow-xs">
          <CheckSquare className="w-12 h-12 text-[#A8A29E] dark:text-[#57534E] mx-auto mb-3" />
          <h4 className="font-serif text-lg font-bold text-[#1A1A1A] dark:text-[#F3EFEA]">
            No habits found
          </h4>
          <p className="text-xs sm:text-sm font-mono text-[#78716C] dark:text-[#A39E96] mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try clearing your search or category filters.'
              : 'Add your first routine to start building healthy habits.'}
          </p>
          <button
            onClick={onOpenAddTask}
            className="mt-5 px-4 py-2 bg-[#1A1A1A] text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] text-xs font-bold rounded-xl shadow-xs"
          >
            Add Habit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
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
                  className="bg-white dark:bg-[#1A1918] rounded-2xl p-4 sm:p-5 border border-[#E8E3DA] dark:border-[#282725] shadow-xs flex flex-col justify-between transition-all hover:border-[#D0C9BE] dark:hover:border-[#3A3835]"
                >
                  <div>
                    {/* Top Row: Icon + Category + Streak Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[#E8E3DA] dark:border-[#2E2C2A]"
                          style={{
                            backgroundColor: category?.color ? `${category.color}15` : '#1A1A1A10',
                            color: category?.color || '#1A1A1A',
                          }}
                        >
                          <IconRenderer
                            name={task.icon || category?.icon || 'CheckSquare'}
                            className="w-5 h-5"
                          />
                        </div>
                        <div>
                          <span
                            className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                            style={{
                              backgroundColor: category?.color ? `${category.color}12` : '#1A1A1A10',
                              color: category?.color || '#1A1A1A',
                              borderColor: category?.color ? `${category.color}30` : '#1A1A1A20',
                            }}
                          >
                            {category?.name || 'Habit'}
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-[#1A1A1A] dark:text-[#F3EFEA] mt-0.5 break-words">
                            {task.title}
                          </h3>
                        </div>
                      </div>

                      {streak && streak.current > 0 && (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-[#F2EDE4] dark:bg-[#252422] text-[#A04000] dark:text-[#E08A50] rounded-full text-xs font-mono font-bold border border-[#E2DDD5] dark:border-[#353330] shrink-0">
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          <span>{streak.current}d</span>
                        </div>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-[#78716C] dark:text-[#A39E96] mb-3 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Meta info: Target & Schedule */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono font-semibold text-[#57534E] dark:text-[#A39E96] mb-4">
                      {task.targetValue && (
                        <span className="px-2 py-0.5 bg-[#F2EDE4] dark:bg-[#22211F] rounded-lg border border-[#E2DDD5] dark:border-[#2E2C2A] text-[#8A4A28] dark:text-[#E08A50]">
                          🎯 {task.targetValue} {task.targetUnit || ''}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-[#F2EDE4] dark:bg-[#22211F] rounded-lg border border-[#E2DDD5] dark:border-[#2E2C2A]">
                        🗓️ {getScheduleLabel(task)}
                      </span>
                      {task.reminderEnabled && task.reminderTime && (
                        <span className="px-2 py-0.5 bg-[#F2EDE4] dark:bg-[#22211F] rounded-lg border border-[#E2DDD5] dark:border-[#2E2C2A] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#A04000] dark:text-[#E08A50]" />
                          {task.reminderTime}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-3 border-t border-[#EDE7DD] dark:border-[#282725] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateTask(task.taskId, { isActive: !task.isActive })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          task.isActive
                            ? 'bg-[#EBF5EE] dark:bg-[#1E2E24] text-[#2D5A43] dark:text-[#68B087] border border-[#CDE5D5] dark:border-[#2A4434]'
                            : 'bg-[#F2EDE4] dark:bg-[#22211F] text-[#78716C] dark:text-[#A39E96] border border-[#E2DDD5] dark:border-[#2E2C2A]'
                        }`}
                        title={task.isActive ? 'Pause Habit' : 'Resume Habit'}
                      >
                        {task.isActive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A43] dark:bg-[#68B087] animate-pulse" />
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
                        className="p-2 text-[#78716C] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA] rounded-lg hover:bg-[#F2EDE4] dark:hover:bg-[#252422] transition-colors cursor-pointer"
                        title="Edit Habit"
                        aria-label="Edit Habit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {task.isArchived ? (
                        <button
                          type="button"
                          onClick={() => unarchiveTask(task.taskId)}
                          className="p-2 text-[#78716C] hover:text-[#2D5A43] rounded-lg hover:bg-[#EBF5EE] dark:hover:bg-[#1E2E24] transition-colors cursor-pointer"
                          title="Restore"
                          aria-label="Restore"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => archiveTask(task.taskId)}
                          className="p-2 text-[#78716C] hover:text-[#8A4A28] rounded-lg hover:bg-[#F2EDE4] dark:hover:bg-[#252422] transition-colors cursor-pointer"
                          title="Archive"
                          aria-label="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteTask(task.taskId)}
                        className="p-2 text-[#78716C] hover:text-[#B91C1C] dark:hover:text-[#F87171] rounded-lg hover:bg-[#FEE2E2] dark:hover:bg-[#3E1A1A] transition-colors cursor-pointer"
                        title="Delete"
                        aria-label="Delete"
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
