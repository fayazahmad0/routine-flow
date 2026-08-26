/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, memo, useCallback, startTransition, useRef, useEffect } from 'react';
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
import { fireLightweightConfetti } from '../../utils/confettiUtils';
import { mobilePerfProfiler } from '../../utils/mobilePerfProfiler';

interface TodayTaskRowProps {
  task: Task;
  completed: boolean;
  actualValue?: number;
  category?: Category;
  isMenuOpen: boolean;
  onToggle: (taskId: string, targetCompleted: boolean) => void;
  onUpdateValue: (task: Task, nextValue: number) => void;
  onToggleMenu: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onArchiveTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const areTaskRowPropsEqual = (prev: TodayTaskRowProps, next: TodayTaskRowProps): boolean => {
  return (
    prev.task.taskId === next.task.taskId &&
    prev.task.title === next.task.title &&
    prev.task.type === next.task.type &&
    prev.task.targetValue === next.task.targetValue &&
    prev.task.targetUnit === next.task.targetUnit &&
    prev.task.reminderTime === next.task.reminderTime &&
    prev.task.reminderEnabled === next.task.reminderEnabled &&
    prev.completed === next.completed &&
    prev.actualValue === next.actualValue &&
    prev.isMenuOpen === next.isMenuOpen &&
    prev.category?.categoryId === next.category?.categoryId &&
    prev.category?.color === next.category?.color &&
    prev.category?.name === next.category?.name &&
    prev.onToggle === next.onToggle &&
    prev.onUpdateValue === next.onUpdateValue &&
    prev.onToggleMenu === next.onToggleMenu
  );
};

const TodayTaskRowComponent: React.FC<TodayTaskRowProps> = ({
  task,
  completed,
  actualValue,
  category,
  isMenuOpen,
  onToggle,
  onUpdateValue,
  onToggleMenu,
  onEditTask,
  onArchiveTask,
  onDeleteTask,
}) => {
  const hasStepper = task.type === 'duration' || task.type === 'quantity' || task.type === 'target';
  const initialVal = actualValue !== undefined ? actualValue : (completed ? (task.targetValue || 1) : 0);

  // 1. ISOLATED LOCAL STATE: Drives 0ms instant UI updates without waiting for React Context or Firestore
  const [localCompleted, setLocalCompleted] = useState<boolean>(completed);
  const [localVal, setLocalVal] = useState<number>(initialVal);

  // Refs to track state synchronously during rapid taps & prevent prop clobbering
  const localValRef = useRef<number>(initialVal);
  const localCompletedRef = useRef<boolean>(completed);
  const lastTapTimeRef = useRef<number>(0);
  const syncDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const checkboxDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (syncDebounceTimerRef.current) {
        clearTimeout(syncDebounceTimerRef.current);
      }
      if (checkboxDebounceTimerRef.current) {
        clearTimeout(checkboxDebounceTimerRef.current);
      }
    };
  }, []);

  // Sync upstream prop changes only when not actively tapping (prevents jump/glitch)
  useEffect(() => {
    const timeSinceTap = Date.now() - lastTapTimeRef.current;
    if (timeSinceTap > 1000) {
      setLocalCompleted(completed);
      localCompletedRef.current = completed;
    }
  }, [completed]);

  useEffect(() => {
    const timeSinceTap = Date.now() - lastTapTimeRef.current;
    if (timeSinceTap > 1000) {
      const val = actualValue !== undefined ? actualValue : (completed ? (task.targetValue || 1) : 0);
      setLocalVal(val);
      localValRef.current = val;
    }
  }, [actualValue, completed, task.targetValue]);

  // Schedule background Firestore sync for steppers after rapid tapping settles
  const scheduleBackgroundSync = useCallback(
    (finalVal: number) => {
      if (syncDebounceTimerRef.current) {
        clearTimeout(syncDebounceTimerRef.current);
      }
      syncDebounceTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          startTransition(() => {
            onUpdateValue(task, finalVal);
          });
        }
      }, 200);
    },
    [onUpdateValue, task]
  );

  // Schedule background Firestore sync for checkboxes to coalesce rapid toggles
  const scheduleCheckboxSync = useCallback(
    (targetCompleted: boolean) => {
      if (checkboxDebounceTimerRef.current) {
        clearTimeout(checkboxDebounceTimerRef.current);
      }
      checkboxDebounceTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          startTransition(() => {
            onToggle(task.taskId, targetCompleted);
          });
        }
      }, 100);
    },
    [onToggle, task.taskId]
  );

  // ----------------------------------------------------
  // CHECKBOX TAP HANDLER: 0ms Instant Local Toggle
  // ----------------------------------------------------
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = performance.now();
    lastTapTimeRef.current = Date.now();
    const interactionId = mobilePerfProfiler.startInteraction('checkbox', task.taskId, now);

    const nextCompleted = !localCompletedRef.current;
    localCompletedRef.current = nextCompleted;

    // 1. Immediate local state change (0ms visual update)
    setLocalCompleted(nextCompleted);

    if (hasStepper) {
      const nextVal = nextCompleted ? (task.targetValue || 1) : 0;
      localValRef.current = nextVal;
      setLocalVal(nextVal);
    }

    mobilePerfProfiler.recordStateUpdate(interactionId);
    mobilePerfProfiler.finishInteraction(interactionId);

    // Light celebratory burst if completed
    if (nextCompleted) {
      fireLightweightConfetti();
    }

    // 2. Coalesced background sync
    scheduleCheckboxSync(nextCompleted);
  };

  // ----------------------------------------------------
  // STEPPER (+) INCREMENT HANDLER: 0ms Instant Local Increment
  // ----------------------------------------------------
  const handleStepIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = performance.now();
    lastTapTimeRef.current = Date.now();
    const interactionId = mobilePerfProfiler.startInteraction('plus', task.taskId, now);

    const step = task.type === 'duration' && task.targetUnit?.toLowerCase().includes('min') ? 5 : 1;
    const nextVal = localValRef.current + step;
    localValRef.current = nextVal;

    // 1. Immediate local state change (0ms visual update)
    setLocalVal(nextVal);

    const isTargetMet = task.targetValue ? nextVal >= task.targetValue : nextVal > 0;
    if (isTargetMet !== localCompletedRef.current) {
      localCompletedRef.current = isTargetMet;
      setLocalCompleted(isTargetMet);
      if (isTargetMet) {
        fireLightweightConfetti();
      }
    }

    mobilePerfProfiler.recordStateUpdate(interactionId);
    mobilePerfProfiler.finishInteraction(interactionId);

    // 2. Schedule debounced background Firestore persistence (coalesces rapid + + + + +)
    scheduleBackgroundSync(nextVal);
  };

  // ----------------------------------------------------
  // STEPPER (-) DECREMENT HANDLER: 0ms Instant Local Decrement
  // ----------------------------------------------------
  const handleStepDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = performance.now();
    lastTapTimeRef.current = Date.now();
    const interactionId = mobilePerfProfiler.startInteraction('minus', task.taskId, now);

    const step = task.type === 'duration' && task.targetUnit?.toLowerCase().includes('min') ? 5 : 1;
    const nextVal = Math.max(0, localValRef.current - step);
    localValRef.current = nextVal;

    // 1. Immediate local state change (0ms visual update)
    setLocalVal(nextVal);

    const isTargetMet = task.targetValue ? nextVal >= task.targetValue : nextVal > 0;
    if (isTargetMet !== localCompletedRef.current) {
      localCompletedRef.current = isTargetMet;
      setLocalCompleted(isTargetMet);
    }

    mobilePerfProfiler.recordStateUpdate(interactionId);
    mobilePerfProfiler.finishInteraction(interactionId);

    // 2. Schedule debounced background persistence
    scheduleBackgroundSync(nextVal);
  };

  // Calculate progress percent for target/duration tasks
  const progressPercent = task.targetValue
    ? Math.min(100, Math.round((localVal / task.targetValue) * 100))
    : localCompleted
    ? 100
    : 0;

  return (
    <div
      className={`group relative rounded-2xl p-4 sm:p-5 border transition-colors select-none ${
        localCompleted
          ? 'bg-[#F2EDE4]/60 dark:bg-[#1E1C1A]/70 border-[#DED7CD] dark:border-[#33302D]'
          : 'bg-white dark:bg-[#1A1918] border-[#E8E3DA] dark:border-[#282725] hover:border-[#D4CDBC] dark:hover:border-[#383532] shadow-xs'
      }`}
      style={{ touchAction: 'manipulation' }}
    >
      <div className="flex items-start sm:items-center justify-between gap-3">
        {/* Left: Custom Tap Checkbox & Task Information */}
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
          {/* Custom Checkbox Button (0ms Instant Toggle) */}
          <button
            type="button"
            onClick={handleCheckboxClick}
            aria-label={localCompleted ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center transition-transform cursor-pointer shrink-0 mt-0.5 sm:mt-0 active:scale-90 ${
              localCompleted
                ? 'bg-[#2D5A43] border-[#2D5A43] dark:bg-[#68B087] dark:border-[#68B087] text-white dark:text-[#121212] shadow-xs'
                : 'border-[#D4CDBC] dark:border-[#3E3B37] bg-[#FAF8F5] dark:bg-[#22201E] hover:border-[#1A1A1A] dark:hover:border-[#F3EFEA]'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            {localCompleted && <Check className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />}
          </button>

          {/* Category Icon Badge */}
          {category && (
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5"
              style={{ backgroundColor: `${category.color}15`, color: category.color }}
            >
              <IconRenderer name={category.icon} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          )}

          {/* Task Title and Context Meta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4
                className={`font-serif text-sm sm:text-base font-semibold leading-tight truncate ${
                  localCompleted
                    ? 'line-through text-[#78716C] dark:text-[#8C8780]'
                    : 'text-[#1A1A1A] dark:text-[#F3EFEA]'
                }`}
              >
                {task.title}
              </h4>
            </div>

            {/* Target, Unit, & Reminder Meta Badges */}
            <div className="flex items-center flex-wrap gap-2 mt-1">
              {category && (
                <span className="text-[10px] sm:text-[11px] font-medium text-[#78716C] dark:text-[#A39E96]">
                  {category.name}
                </span>
              )}

              {task.targetValue && (
                <span className="text-[10px] sm:text-[11px] font-mono text-[#78716C] dark:text-[#A39E96]">
                  • Goal: {task.targetValue} {task.targetUnit || ''}
                </span>
              )}

              {task.reminderEnabled && task.reminderTime && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#78716C] dark:text-[#A39E96] bg-[#F2EDE4] dark:bg-[#252422] px-1.5 py-0.5 rounded border border-[#E2DDD5] dark:border-[#353330]">
                  <Clock className="w-2.5 h-2.5" />
                  {task.reminderTime}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Stepper Controls (+ / -) & Context Options Menu */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Stepper for Quantity / Duration / Target Tasks */}
          {hasStepper && (
            <div className="flex items-center bg-[#F2EDE4] dark:bg-[#252422] rounded-xl p-1 border border-[#E2DDD5] dark:border-[#353330]">
              <button
                type="button"
                onClick={handleStepDecrement}
                disabled={localVal <= 0}
                aria-label={`Decrease ${task.title}`}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-[#1A1918] active:scale-90 text-[#1A1A1A] dark:text-[#F3EFEA] disabled:opacity-30 disabled:cursor-not-allowed transition-transform cursor-pointer"
                style={{ touchAction: 'manipulation' }}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="px-2.5 text-center min-w-[2.75rem]">
                <span className="font-mono text-xs sm:text-sm font-bold text-[#1A1A1A] dark:text-[#F3EFEA] tabular-nums">
                  {localVal}
                </span>
                {task.targetUnit && (
                  <span className="block text-[9px] font-mono text-[#78716C] dark:text-[#8C8780] leading-none">
                    {task.targetUnit}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleStepIncrement}
                aria-label={`Increase ${task.title}`}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1A1A1A] dark:bg-[#F3EFEA] text-[#FAF8F5] dark:text-[#121212] hover:opacity-90 active:scale-90 shadow-2xs transition-transform cursor-pointer"
                style={{ touchAction: 'manipulation' }}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Context Options Menu Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu(task.taskId);
              }}
              className="p-2 rounded-xl text-[#78716C] hover:text-[#1A1A1A] dark:text-[#A39E96] dark:hover:text-[#F3EFEA] hover:bg-[#F2EDE4] dark:hover:bg-[#252422] transition-colors cursor-pointer"
              aria-label="Task options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Menu Popover */}
            {isMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#1C1B19] border border-[#E8E3DA] dark:border-[#33302D] rounded-xl shadow-lg z-30 py-1 font-sans text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    onEditTask(task);
                    onToggleMenu(task.taskId);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2.5 text-[#1A1A1A] dark:text-[#F3EFEA] hover:bg-[#F2EDE4] dark:hover:bg-[#252422] transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Habit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onArchiveTask(task.taskId);
                    onToggleMenu(task.taskId);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2.5 text-[#78716C] dark:text-[#A39E96] hover:bg-[#F2EDE4] dark:hover:bg-[#252422] transition-colors cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive</span>
                </button>
                <div className="my-1 border-t border-[#E8E3DA] dark:border-[#2E2C2A]" />
                <button
                  type="button"
                  onClick={() => {
                    onDeleteTask(task.taskId);
                    onToggleMenu(task.taskId);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Habit</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Target Progress Bar (for duration / quantity habits) */}
      {task.targetValue && task.targetValue > 1 && (
        <div className="mt-3 pt-2 border-t border-[#E8E3DA]/60 dark:border-[#282725]">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#78716C] dark:text-[#A39E96] mb-1">
            <span>Progress</span>
            <span className="tabular-nums font-semibold">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#EAE4D9] dark:bg-[#282725] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                progressPercent >= 100
                  ? 'bg-[#2D5A43] dark:bg-[#68B087]'
                  : 'bg-[#A04000] dark:bg-[#E08A50]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const TodayTaskRow = memo(TodayTaskRowComponent, areTaskRowPropsEqual);

interface TodayTaskListProps {
  onEditTask: (task: Task) => void;
  onOpenAddTask: () => void;
}

export const TodayTaskList: React.FC<TodayTaskListProps> = memo(({ onEditTask, onOpenAddTask }) => {
  const {
    todayTasks,
    todayDateStr,
    loading: routineLoading,
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
    (taskId: string, targetCompleted: boolean) => {
      toggleTaskCompletion(taskId, todayDateStr, targetCompleted);
    },
    [toggleTaskCompletion, todayDateStr]
  );

  const handleUpdateValue = useCallback(
    (task: Task, nextVal: number) => {
      updateTaskActualValue(task.taskId, todayDateStr, nextVal);
    },
    [updateTaskActualValue, todayDateStr]
  );

  const handleToggleMenu = useCallback((taskId: string) => {
    setActiveMenuTaskId((prev) => (prev === taskId ? null : taskId));
  }, []);

  if (routineLoading) {
    return (
      <div className="space-y-3.5 animate-pulse">
        <div className="flex items-center justify-between px-1 border-b border-[#E8E3DA] dark:border-[#282725] pb-2">
          <div className="h-5 w-24 bg-[#EAE4D9] dark:bg-[#282725] rounded" />
          <div className="h-4 w-28 bg-[#EAE4D9] dark:bg-[#282725] rounded" />
        </div>
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-white dark:bg-[#1A1918] rounded-2xl border border-[#E8E3DA] dark:border-[#282725] p-4 flex items-center gap-3"
            >
              <div className="w-7 h-7 rounded-xl bg-[#EAE4D9] dark:bg-[#282725]" />
              <div className="w-9 h-9 rounded-xl bg-[#EAE4D9] dark:bg-[#282725]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-36 bg-[#EAE4D9] dark:bg-[#282725] rounded" />
                <div className="h-3 w-20 bg-[#EAE4D9] dark:bg-[#282725] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
            onUpdateValue={handleUpdateValue}
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
