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
  onIncrement: (e: React.MouseEvent, task: Task, nextValue: number) => void;
  onDecrement: (e: React.MouseEvent, task: Task, nextValue: number) => void;
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
    // 1. INSTANT LOCAL STATE: Ensures 0ms click-to-paint response before any context or network work
    const initialVal = actualValue !== undefined ? actualValue : (completed ? (task.targetValue || 1) : 0);
    const [localCompleted, setLocalCompleted] = useState<boolean>(completed);
    const [localVal, setLocalVal] = useState<number>(initialVal);

    // Timer ref for coalescing rapid stepper taps (+ / -) into a single background sync
    const stepperDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = React.useRef(true);

    React.useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
        if (stepperDebounceRef.current) {
          clearTimeout(stepperDebounceRef.current);
        }
      };
    }, []);

    // Keep local in sync whenever upstream props update from cloud or day change
    React.useEffect(() => {
      setLocalCompleted(completed);
    }, [completed]);

    React.useEffect(() => {
      if (actualValue !== undefined) {
        setLocalVal(actualValue);
      } else {
        setLocalVal(completed ? (task.targetValue || 1) : 0);
      }
    }, [actualValue, completed, task.targetValue]);

    const hasStepper = task.type === 'duration' || task.type === 'quantity' || task.type === 'target';

    // Immediate synchronous checkbox tap handler
    const handleCheckboxClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const nextCompleted = !localCompleted;
      
      // 0ms Synchronous local state update (React paints in current frame)
      setLocalCompleted(nextCompleted);
      if (hasStepper) {
        setLocalVal(nextCompleted ? (task.targetValue || 1) : 0);
      }

      // Background synchronization
      onToggle(task.taskId, localCompleted);
    };

    // Immediate synchronous stepper increment handler with debounced background sync
    const handleStepIncrement = (e: React.MouseEvent) => {
      e.stopPropagation();
      const step = task.type === 'duration' && task.targetUnit?.toLowerCase().includes('min') ? 5 : 1;
      const nextVal = localVal + step;

      // 0ms Synchronous local state update - user sees new number instantly
      setLocalVal(nextVal);
      const isTargetMet = task.targetValue ? nextVal >= task.targetValue : nextVal > 0;
      if (isTargetMet !== localCompleted) {
        setLocalCompleted(isTargetMet);
      }

      // Coalesce rapid clicks into single background persistence call
      if (stepperDebounceRef.current) {
        clearTimeout(stepperDebounceRef.current);
      }
      stepperDebounceRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          onIncrement(e, task, nextVal);
        }
      }, 150);
    };

    // Immediate synchronous stepper decrement handler with debounced background sync
    const handleStepDecrement = (e: React.MouseEvent) => {
      e.stopPropagation();
      const step = task.type === 'duration' && task.targetUnit?.toLowerCase().includes('min') ? 5 : 1;
      const nextVal = Math.max(0, localVal - step);

      // 0ms Synchronous local state update - user sees new number instantly
      setLocalVal(nextVal);
      const isTargetMet = task.targetValue ? nextVal >= task.targetValue : nextVal > 0;
      if (isTargetMet !== localCompleted) {
        setLocalCompleted(isTargetMet);
      }

      // Coalesce rapid clicks into single background persistence call
      if (stepperDebounceRef.current) {
        clearTimeout(stepperDebounceRef.current);
      }
      stepperDebounceRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          onDecrement(e, task, nextVal);
        }
      }, 150);
    };

    return (
      <div
        id={`task-row-${task.taskId}`}
        className={`relative rounded-2xl border transition-all duration-150 p-3.5 sm:p-4 touch-manipulation ${
          localCompleted
            ? 'bg-[#F4F0E8]/85 dark:bg-[#1E1D1B]/90 border-[#DDD7CD] dark:border-[#33302D]'
            : 'bg-white dark:bg-[#1A1918] border-[#E8E3DA] dark:border-[#282725] shadow-xs hover:border-[#D0C9BE] dark:hover:border-[#3A3835]'
        }`}
      >
        {/* Main Row: Checkbox + Category Icon + Title + Menu */}
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          {/* Left Group: Checkbox + Category Icon + Title */}
          <div className="flex items-start gap-2.5 sm:gap-3.5 flex-1 min-w-0">
            {/* Touch-optimized 44x44px Checkbox Area with instant visual feedback */}
            <button
              type="button"
              onClick={handleCheckboxClick}
              id={`task-toggle-${task.taskId}`}
              className="min-w-[44px] min-h-[44px] -ml-2 -mt-1 p-2 flex items-center justify-center rounded-xl cursor-pointer group shrink-0 touch-manipulation"
              aria-label={`Mark ${task.title} as ${localCompleted ? 'incomplete' : 'completed'}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-75 transform active:scale-80 ${
                  localCompleted
                    ? 'bg-[#1A1A1A] dark:bg-[#F3EFEA] text-[#FAF8F5] dark:text-[#121212] shadow-xs scale-100 ring-2 ring-[#1A1A1A] dark:ring-[#F3EFEA]'
                    : 'border-2 border-[#C8C2B7] dark:border-[#4A4744] group-hover:border-[#1A1A1A] dark:group-hover:border-[#F3EFEA] text-transparent bg-transparent'
                }`}
              >
                <Check
                  className={`w-4 h-4 stroke-[3] transition-opacity duration-75 ${
                    localCompleted ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
            </button>

            {/* Category icon badge */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-[#E8E3DA] dark:border-[#2E2C2A] mt-0.5"
              style={{
                backgroundColor: category?.color ? `${category.color}18` : '#1A1A1A10',
                color: category?.color || '#1A1A1A',
              }}
            >
              <IconRenderer name={task.icon || category?.icon || 'CheckSquare'} className="w-4 h-4" />
            </div>

            {/* Task Title & Reminder */}
            <div
              className="min-w-0 flex-1 cursor-pointer pt-0.5 touch-manipulation"
              onClick={handleCheckboxClick}
            >
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h4
                  className={`text-sm sm:text-base font-semibold tracking-tight transition-colors duration-100 leading-snug break-words ${
                    localCompleted
                      ? 'text-[#8C8780] dark:text-[#78716C] line-through opacity-80'
                      : 'text-[#1A1A1A] dark:text-[#F3EFEA]'
                  }`}
                >
                  {task.title}
                </h4>

                {task.reminderEnabled && task.reminderTime && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-medium bg-[#F2EDE4] dark:bg-[#252422] text-[#57534E] dark:text-[#A39E96] shrink-0 border border-[#E2DDD5] dark:border-[#353330]">
                    <Clock className="w-3 h-3 text-[#A04000] dark:text-[#E08A50]" />
                    {task.reminderTime}
                  </span>
                )}
              </div>

              {task.description && (
                <p className="text-xs text-[#78716C] dark:text-[#A39E96] mt-0.5 line-clamp-1">
                  {task.description}
                </p>
              )}
            </div>
          </div>

          {/* Right: 3-Dots Menu with touch target */}
          <div className="relative shrink-0 -mr-1 -mt-1">
            <button
              type="button"
              onClick={() => onToggleMenu(task.taskId)}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 text-[#78716C] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA] rounded-xl hover:bg-[#F2EDE4] dark:hover:bg-[#252422] active:scale-90 transition-all cursor-pointer touch-manipulation"
              aria-label="Task options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#1E1D1B] rounded-2xl shadow-xl border border-[#E8E3DA] dark:border-[#2E2C2A] py-1.5 z-30">
                <button
                  type="button"
                  onClick={() => {
                    onToggleMenu(task.taskId);
                    onEditTask(task);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-[#1A1A1A] dark:text-[#F3EFEA] hover:bg-[#F2EDE4] dark:hover:bg-[#252422] text-left cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#78716C]" />
                  Edit Routine
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToggleMenu(task.taskId);
                    onArchiveTask(task.taskId);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-[#1A1A1A] dark:text-[#F3EFEA] hover:bg-[#F2EDE4] dark:hover:bg-[#252422] text-left cursor-pointer"
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
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-[#B91C1C] dark:text-[#F87171] hover:bg-[#FEE2E2] dark:hover:bg-[#3E1A1A] text-left cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sub-row: Category Chip + Target Badge + Mobile-Friendly Stepper */}
        <div className="mt-2.5 pt-2 border-t border-[#EDE7DD] dark:border-[#282725] flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Left Metadata Chips */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {category && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono uppercase tracking-wider font-semibold border"
                style={{
                  backgroundColor: category.color ? `${category.color}15` : '#1A1A1A10',
                  color: category.color || '#1A1A1A',
                  borderColor: category.color ? `${category.color}35` : '#1A1A1A25',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: category.color || '#1A1A1A' }}
                />
                {category.name}
              </span>
            )}

            {task.targetValue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F2EDE4] dark:bg-[#242220] border border-[#E2DDD5] dark:border-[#353330] rounded-lg text-[11px] font-mono text-[#8A4A28] dark:text-[#E08A50] font-semibold">
                🎯 Target: {task.targetValue} {task.targetUnit || ''}
              </span>
            )}
          </div>

          {/* Right Stepper (for duration/quantity/target tasks) with 0ms tactile response */}
          {hasStepper && (
            <div className="flex items-center bg-[#F2EDE4] dark:bg-[#252422] border border-[#DDD7CD] dark:border-[#353330] rounded-xl p-0.5 text-xs font-mono shadow-2xs shrink-0 ml-auto touch-manipulation">
              <button
                type="button"
                onClick={handleStepDecrement}
                className="w-8 h-8 flex items-center justify-center text-[#57534E] dark:text-[#A39E96] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA] rounded-lg hover:bg-white dark:hover:bg-[#1A1918] active:scale-80 active:bg-white/80 transition-transform cursor-pointer touch-manipulation select-none"
                aria-label="Decrease value"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <span className="px-2.5 font-bold text-[#1A1A1A] dark:text-[#F3EFEA] min-w-[50px] text-center select-none">
                {localVal}
                {task.targetUnit ? ` ${task.targetUnit}` : ''}
              </span>

              <button
                type="button"
                onClick={handleStepIncrement}
                className="w-8 h-8 flex items-center justify-center text-[#57534E] dark:text-[#A39E96] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA] rounded-lg hover:bg-white dark:hover:bg-[#1A1918] active:scale-80 active:bg-white/80 transition-transform cursor-pointer touch-manipulation select-none"
                aria-label="Increase value"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          )}
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

export const TodayTaskList: React.FC<TodayTaskListProps> = React.memo(({ onEditTask, onOpenAddTask }) => {
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
    (e: React.MouseEvent, task: Task, nextVal: number) => {
      updateTaskActualValue(task.taskId, todayDateStr, nextVal);
    },
    [updateTaskActualValue, todayDateStr]
  );

  const handleDecrement = useCallback(
    (e: React.MouseEvent, task: Task, nextVal: number) => {
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
});

TodayTaskList.displayName = 'TodayTaskList';
