/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, memo, useCallback } from 'react';
import { useRoutine } from '../../context/RoutineContext';
import { Task, Category } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import {
  Check,
  MoreVertical,
  Plus,
  Minus,
  Clock,
  Edit2,
  Archive,
  Trash2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TodayTaskRowProps {
  task: Task;
  completed: boolean;
  actualValue?: number;
  category?: Category;
  isMenuOpen: boolean;
  onToggle: (taskId: string, currentCompleted: boolean) => void;
  onIncrement: (e: React.MouseEvent, task: Task, currentValue: number) => void;
  onDecrement: (e: React.MouseEvent, task: Task, currentValue: number) => void;
  onToggleMenu: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onArchiveTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const TodayTaskRow = memo<TodayTaskRowProps>(
  ({
    task,
    completed,
    actualValue,
    category,
    isMenuOpen,
    onToggle,
    onIncrement,
    onDecrement,
    onToggleMenu,
    onEditTask,
    onArchiveTask,
    onDeleteTask,
  }) => {
    const currentVal = actualValue ?? (completed ? (task.targetValue || 1) : 0);

    return (
      <div
        id={`task-row-${task.taskId}`}
        className={`relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all duration-150 ${
          completed
            ? 'bg-[#F4F0E8]/80 dark:bg-[#1E1D1B]/80 border-[#E2DDD5] dark:border-[#2E2C2A]'
            : 'bg-white dark:bg-[#1A1918] border-[#E8E3DA] dark:border-[#282725] shadow-xs hover:border-[#DCD6CD] dark:hover:border-[#3A3835]'
        }`}
      >
        {/* Left: Checkbox + Icon + Details */}
        <div className="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
          {/* Touch-optimized 44x44px Checkbox Area */}
          <button
            type="button"
            onClick={() => onToggle(task.taskId, completed)}
            id={`task-toggle-${task.taskId}`}
            className="min-w-[44px] min-h-[44px] -ml-2 p-2 flex items-center justify-center rounded-xl cursor-pointer group"
            aria-label={`Mark ${task.title} as ${completed ? 'incomplete' : 'completed'}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-100 transform active:scale-85 ${
                completed
                  ? 'bg-[#1A1A1A] dark:bg-[#F3EFEA] text-[#FAF8F5] dark:text-[#121212] shadow-xs scale-100'
                  : 'border-2 border-[#DCD6CD] dark:border-[#3E3C39] group-hover:border-[#1A1A1A] dark:group-hover:border-[#F3EFEA] text-transparent bg-transparent'
              }`}
            >
              <Check
                className={`w-4 h-4 stroke-[3] transition-opacity duration-100 ${
                  completed ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          </button>

          {/* Category icon badge */}
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-[#E8E3DA] dark:border-[#2E2C2A] transition-colors"
            style={{
              backgroundColor: category?.color ? `${category.color}15` : '#1A1A1A10',
              color: category?.color || '#1A1A1A',
            }}
          >
            <IconRenderer name={task.icon || category?.icon || 'CheckSquare'} className="w-4 h-4" />
          </div>

          {/* Task title and metadata */}
          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onToggle(task.taskId, completed)}>
            <div className="flex items-center gap-2">
              <h4
                className={`text-sm font-medium tracking-tight truncate transition-colors duration-150 ${
                  completed
                    ? 'text-[#8C8780] dark:text-[#78716C] line-through opacity-75'
                    : 'text-[#1A1A1A] dark:text-[#F3EFEA]'
                }`}
              >
                {task.title}
              </h4>
              {task.reminderEnabled && task.reminderTime && (
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#F2EDE4] dark:bg-[#252422] text-[#78716C] dark:text-[#A39E96]">
                  <Clock className="w-3 h-3" />
                  {task.reminderTime}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-xs text-[#78716C] dark:text-[#A39E96]">
              {category && (
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#78716C] dark:text-[#A39E96]">
                  {category.name}
                </span>
              )}

              {task.targetValue && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[11px] text-[#A04000] dark:text-[#E08A50]">
                    Target: {task.targetValue} {task.targetUnit || ''}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quantity/Duration stepper & Actions Menu */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {/* Stepper for duration/quantity tasks */}
          {(task.type === 'duration' || task.type === 'quantity' || task.type === 'target') && (
            <div className="flex items-center bg-[#F2EDE4] dark:bg-[#252422] border border-[#E2DDD5] dark:border-[#353330] rounded-lg p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={(e) => onDecrement(e, task, currentVal)}
                className="p-1 text-[#57534E] dark:text-[#A39E96] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA] rounded hover:bg-white dark:hover:bg-[#1A1918] transition-colors cursor-pointer"
                aria-label="Decrease value"
              >
                <Minus className="w-3 h-3" />
              </button>

              <span className="px-2 font-medium text-[#1A1A1A] dark:text-[#F3EFEA]">
                {currentVal}
                {task.targetUnit ? ` ${task.targetUnit}` : ''}
              </span>

              <button
                type="button"
                onClick={(e) => onIncrement(e, task, currentVal)}
                className="p-1 text-[#57534E] dark:text-[#A39E96] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA] rounded hover:bg-white dark:hover:bg-[#1A1918] transition-colors cursor-pointer"
                aria-label="Increase value"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* More Menu Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => onToggleMenu(task.taskId)}
              className="p-1.5 text-[#78716C] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA] rounded-lg hover:bg-[#F2EDE4] dark:hover:bg-[#252422] transition-colors cursor-pointer"
              aria-label="Task options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#1E1D1B] rounded-xl shadow-lg border border-[#E8E3DA] dark:border-[#2E2C2A] py-1.5 z-20">
                <button
                  type="button"
                  onClick={() => {
                    onToggleMenu(task.taskId);
                    onEditTask(task);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#1A1A1A] dark:text-[#F3EFEA] hover:bg-[#F2EDE4] dark:hover:bg-[#252422] text-left cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#78716C]" />
                  Edit Entry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToggleMenu(task.taskId);
                    onArchiveTask(task.taskId);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#1A1A1A] dark:text-[#F3EFEA] hover:bg-[#F2EDE4] dark:hover:bg-[#252422] text-left cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5 text-[#78716C]" />
                  Archive
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToggleMenu(task.taskId);
                    onDeleteTask(task.taskId);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#991B1B] dark:text-[#EF4444] hover:bg-[#FBEBEB] dark:hover:bg-[#351C1C] text-left cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

TodayTaskRow.displayName = 'TodayTaskRow';

interface TodayTaskListProps {
  onEditTask: (task: Task) => void;
  onOpenAddTask: () => void;
}

export const TodayTaskList: React.FC<TodayTaskListProps> = ({ onEditTask, onOpenAddTask }) => {
  const {
    todayTasks,
    todayDateStr,
    toggleTaskCompletion,
    updateTaskActualValue,
    archiveTask,
    deleteTask,
    categories,
  } = useRoutine();

  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  const getCategory = useCallback(
    (catId: string): Category | undefined => {
      return categories.find((c) => c.categoryId === catId);
    },
    [categories]
  );

  const handleToggle = useCallback(
    (taskId: string, currentCompleted: boolean) => {
      const nextCompleted = !currentCompleted;
      toggleTaskCompletion(taskId, todayDateStr, nextCompleted);

      // Trigger soft celebratory confetti asynchronously
      if (nextCompleted) {
        requestAnimationFrame(() => {
          try {
            confetti({
              particleCount: 35,
              spread: 55,
              origin: { y: 0.8 },
              colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
              disableForReducedMotion: true,
            });
          } catch (e) {
            // Safe fallback
          }
        });
      }
    },
    [toggleTaskCompletion, todayDateStr]
  );

  const handleIncrement = useCallback(
    (e: React.MouseEvent, task: Task, currentValue: number = 0) => {
      e.stopPropagation();
      const step = task.type === 'duration' && task.targetUnit?.toLowerCase().includes('min') ? 5 : 1;
      const nextVal = currentValue + step;
      updateTaskActualValue(task.taskId, todayDateStr, nextVal);
    },
    [updateTaskActualValue, todayDateStr]
  );

  const handleDecrement = useCallback(
    (e: React.MouseEvent, task: Task, currentValue: number = 0) => {
      e.stopPropagation();
      const step = task.type === 'duration' && task.targetUnit?.toLowerCase().includes('min') ? 5 : 1;
      const nextVal = Math.max(0, currentValue - step);
      updateTaskActualValue(task.taskId, todayDateStr, nextVal);
    },
    [updateTaskActualValue, todayDateStr]
  );

  const handleToggleMenu = useCallback((taskId: string) => {
    setActiveMenuTaskId((prev) => (prev === taskId ? null : taskId));
  }, []);

  if (todayTasks.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-8 sm:p-12 text-center border border-[#E8E3DA] dark:border-[#282725] shadow-xs transition-all">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F2EDE4] dark:bg-[#252422] text-[#1A1A1A] dark:text-[#F3EFEA] flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-xl font-bold text-[#1A1A1A] dark:text-[#F3EFEA]">
          Your ledger is clear
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-[#78716C] dark:text-[#A39E96] max-w-sm mx-auto leading-relaxed">
          Record your first daily habit to begin compiling your consistency chronicle.
        </p>
        <button
          id="today-empty-add-task-btn"
          onClick={onOpenAddTask}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#33312E] active:scale-95 text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] text-xs sm:text-sm font-medium rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </button>
      </div>
    );
  }

  const completedCount = todayTasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between px-1 border-b border-[#E8E3DA] dark:border-[#282725] pb-2">
        <h3 className="font-serif text-lg font-bold text-[#1A1A1A] dark:text-[#F3EFEA] tracking-tight">
          Daily Log
        </h3>
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#78716C] dark:text-[#A39E96]">
          {completedCount} / {todayTasks.length} Completed
        </span>
      </div>

      <div className="space-y-2.5">
        {todayTasks.map(({ task, completed, actualValue }) => (
          <TodayTaskRow
            key={task.taskId}
            task={task}
            completed={completed}
            actualValue={actualValue}
            category={getCategory(task.categoryId)}
            isMenuOpen={activeMenuTaskId === task.taskId}
            onToggle={handleToggle}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onToggleMenu={handleToggleMenu}
            onEditTask={onEditTask}
            onArchiveTask={archiveTask}
            onDeleteTask={deleteTask}
          />
        ))}
      </div>
    </div>
  );
};
