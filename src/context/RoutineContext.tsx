/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeForFirestore } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  Task,
  TaskCompletion,
  DailyRecord,
  Category,
  Achievement,
  StreakStats,
  SmartInsight,
  DayPerformance,
  MoodType,
} from '../types';
import {
  getLocalDateString,
  isTaskScheduledOnDate,
  addDaysToDateString,
  getDayOfWeek,
} from '../utils/dateUtils';
import {
  calculateOverallStreaks,
  generateSmartInsights,
} from '../utils/streakUtils';
import {
  evaluateAchievements,
  ALL_ACHIEVEMENTS,
} from '../utils/achievementUtils';

const DEFAULT_CATEGORIES: Omit<Category, 'categoryId' | 'uid' | 'createdAt'>[] = [
  { name: 'Study', icon: 'BookOpen', color: '#3b82f6', isDefault: true },
  { name: 'Fitness', icon: 'Dumbbell', color: '#ef4444', isDefault: true },
  { name: 'Health', icon: 'Heart', color: '#10b981', isDefault: true },
  { name: 'Sleep', icon: 'Moon', color: '#6366f1', isDefault: true },
  { name: 'Work', icon: 'Briefcase', color: '#f59e0b', isDefault: true },
  { name: 'Reading', icon: 'BookMarked', color: '#8b5cf6', isDefault: true },
  { name: 'Personal Growth', icon: 'Sparkles', color: '#ec4899', isDefault: true },
  { name: 'Finance', icon: 'Wallet', color: '#14b8a6', isDefault: true },
  { name: 'Other', icon: 'CheckSquare', color: '#64748b', isDefault: true },
];

export interface ToastInfo {
  message: { text: string; type?: 'success' | 'info' | 'error' };
  type?: 'success' | 'info' | 'error';
}

interface RoutineContextType {
  tasks: Task[];
  activeTasks: Task[];
  completions: TaskCompletion[];
  categories: Category[];
  dailyRecords: DailyRecord[];
  achievements: Achievement[];
  loading: boolean;
  isOnline: boolean;
  todayDateStr: string;
  selectedDateStr: string;
  setSelectedDateStr: (date: string) => void;
  // Operations
  addTask: (task: Omit<Task, 'taskId' | 'uid' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  archiveTask: (taskId: string) => Promise<void>;
  unarchiveTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string, dateStr: string, completed?: boolean, actualValue?: number) => Promise<void>;
  updateTaskActualValue: (taskId: string, dateStr: string, actualValue: number) => Promise<void>;
  saveDailyRecord: (dateStr: string, note: string, mood?: MoodType) => Promise<void>;
  addCategory: (category: Omit<Category, 'categoryId' | 'uid' | 'createdAt'>) => Promise<string>;
  deleteCategory: (categoryId: string) => Promise<void>;
  createStarterRoutine: (selectedGoalNames?: string[]) => Promise<void>;
  // Derived state
  todayTasks: { task: Task; completed: boolean; actualValue?: number }[];
  todayProgress: { percentage: number; completedCount: number; totalCount: number; remainingCount: number };
  streakStats: StreakStats;
  smartInsights: SmartInsight[];
  getDayPerformance: (dateStr: string) => DayPerformance;
  exportDataAsJson: () => void;
  exportDataAsCsv: () => void;
  toast: { text: string; type?: 'success' | 'info' | 'error' } | null;
  toastMessage: { text: string; type?: 'success' | 'info' | 'error' } | null;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  hideToast: () => void;
}

const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

export const RoutineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'info' | 'error' } | null>(null);

  // In-flight write queue tracking to eliminate race conditions
  const pendingWritesRef = useRef<Map<string, { record: TaskCompletion; timestamp: number; timeoutId?: NodeJS.Timeout }>>(new Map());

  // Online / Offline tracking
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.text === text ? null : cur));
    }, 3500);
  }, []);

  const hideToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const todayDateStr = useMemo(() => {
    return getLocalDateString(new Date(), userProfile?.timezone);
  }, [userProfile?.timezone]);

  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayDateStr);

  useEffect(() => {
    setSelectedDateStr(todayDateStr);
  }, [todayDateStr]);

  // Real-time synchronization
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setCompletions([]);
      setCategories([]);
      setDailyRecords([]);
      setAchievements([]);
      setLoading(false);
      pendingWritesRef.current.clear();
      return;
    }

    setLoading(true);
    const uid = user.uid;

    // 1. Categories
    const categoriesRef = collection(db, `users/${uid}/categories`);
    const unsubCategories = onSnapshot(
      categoriesRef,
      async (snap) => {
        if (snap.empty) {
          // Seed default categories
          const seeded: Category[] = [];
          for (const def of DEFAULT_CATEGORIES) {
            const catId = def.name.toLowerCase().replace(/\s+/g, '_');
            const newCat: Category = {
              categoryId: catId,
              uid,
              name: def.name,
              icon: def.icon,
              color: def.color,
              isDefault: true,
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, `users/${uid}/categories`, catId), newCat);
            seeded.push(newCat);
          }
          setCategories(seeded);
        } else {
          setCategories(snap.docs.map((d) => d.data() as Category));
        }
      },
      (err) => {
        console.warn('Categories sync notice:', err);
      }
    );

    // 2. Tasks
    const tasksRef = collection(db, `users/${uid}/tasks`);
    const unsubTasks = onSnapshot(
      tasksRef,
      (snap) => {
        setTasks(snap.docs.map((d) => d.data() as Task));
        setLoading(false);
      },
      (err) => {
        console.warn('Tasks sync notice:', err);
        setLoading(false);
      }
    );

    // 3. Completions (with pending write protection)
    const completionsRef = collection(db, `users/${uid}/taskCompletions`);
    const unsubCompletions = onSnapshot(
      completionsRef,
      (snap) => {
        const serverCompletions = snap.docs.map((d) => d.data() as TaskCompletion);
        
        // Merge with pending optimistic updates that have not settled yet
        setCompletions((prev) => {
          const map = new Map<string, TaskCompletion>();
          serverCompletions.forEach((c) => map.set(c.completionId, c));

          // Retain pending in-flight updates if local is more recent
          pendingWritesRef.current.forEach((pending, completionId) => {
            const serverDoc = map.get(completionId);
            if (!serverDoc || new Date(pending.record.updatedAt).getTime() > new Date(serverDoc.updatedAt || 0).getTime()) {
              map.set(completionId, pending.record);
            }
          });

          return Array.from(map.values());
        });
      },
      (err) => {
        console.warn('Completions sync notice:', err);
      }
    );

    // 4. Daily Records
    const dailyRef = collection(db, `users/${uid}/dailyRecords`);
    const unsubDaily = onSnapshot(
      dailyRef,
      (snap) => {
        setDailyRecords(snap.docs.map((d) => d.data() as DailyRecord));
      },
      (err) => {
        console.warn('Daily records sync notice:', err);
      }
    );

    // 5. Achievements
    const achRef = collection(db, `users/${uid}/achievements`);
    const unsubAch = onSnapshot(
      achRef,
      (snap) => {
        setAchievements(snap.docs.map((d) => d.data() as Achievement));
      },
      (err) => {
        console.warn('Achievements sync notice:', err);
      }
    );

    return () => {
      unsubCategories();
      unsubTasks();
      unsubCompletions();
      unsubDaily();
      unsubAch();
    };
  }, [user]);

  // Active tasks
  const activeTasks = useMemo(() => {
    return tasks.filter((t) => t.isActive && !t.isArchived);
  }, [tasks]);

  // Fast Completion Map by completionId
  const completionMap = useMemo(() => {
    const map = new Map<string, TaskCompletion>();
    for (let i = 0; i < completions.length; i++) {
      const c = completions[i];
      map.set(c.completionId, c);
    }
    return map;
  }, [completions]);

  // Calculate Streaks
  const streakStats = useMemo(() => {
    return calculateOverallStreaks(tasks, completions, todayDateStr);
  }, [tasks, completions, todayDateStr]);

  // Smart insights
  const smartInsights = useMemo(() => {
    return generateSmartInsights(tasks, completions, todayDateStr, streakStats);
  }, [tasks, completions, todayDateStr, streakStats]);

  // Check achievements automatically (debounced so it never blocks UI tick)
  useEffect(() => {
    if (!user || tasks.length === 0) return;
    const timeoutId = setTimeout(() => {
      const evaluated = evaluateAchievements(tasks, completions, categories, streakStats);
      const existingKeys = new Set(achievements.map((a) => a.key));

      evaluated.forEach(async (ev) => {
        if (ev.isUnlocked && !existingKeys.has(ev.key)) {
          const def = ALL_ACHIEVEMENTS.find((a) => a.key === ev.key);
          if (def) {
            const achId = ev.key;
            const newAch: Achievement = {
              achievementId: achId,
              uid: user.uid,
              key: ev.key,
              title: def.title,
              description: def.description,
              icon: def.icon,
              unlockedAt: new Date().toISOString(),
              progress: ev.progress,
            };
            try {
              await setDoc(doc(db, `users/${user.uid}/achievements`, achId), newAch);
              showToast(`🏆 Achievement Unlocked: ${def.title}!`, 'info');
            } catch (err) {
              console.warn('Error saving achievement:', err);
            }
          }
        }
      });
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [tasks, completions, categories, streakStats, user, achievements, showToast]);

  // Day performance helper with high-speed Map lookup
  const getDayPerformance = useCallback(
    (dateStr: string): DayPerformance => {
      const scheduledTasks = activeTasks.filter((t) => isTaskScheduledOnDate(t, dateStr));

      const taskItems = scheduledTasks.map((task) => {
        const comp = completionMap.get(`${task.taskId}_${dateStr}`);
        return {
          task,
          completed: comp?.completed ?? false,
          actualValue: comp?.actualValue,
        };
      });

      const totalScheduled = scheduledTasks.length;
      const completedCount = taskItems.filter((i) => i.completed).length;
      const completionRate = totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0;

      let status: 'excellent' | 'partial' | 'low' | 'none' | 'future' = 'none';
      if (dateStr > todayDateStr) {
        status = 'future';
      } else if (totalScheduled === 0) {
        status = 'none';
      } else if (completionRate === 100) {
        status = 'excellent';
      } else if (completionRate >= 50) {
        status = 'partial';
      } else if (completedCount > 0) {
        status = 'low';
      } else {
        status = 'none';
      }

      const record = dailyRecords.find((r) => r.localDate === dateStr);

      return {
        date: dateStr,
        dayOfWeek: getDayOfWeek(dateStr),
        totalScheduled,
        completedCount,
        completionRate,
        status,
        tasks: taskItems,
        record,
      };
    },
    [activeTasks, completionMap, dailyRecords, todayDateStr]
  );

  // Today tasks & progress
  const todayPerformance = useMemo(() => {
    return getDayPerformance(todayDateStr);
  }, [getDayPerformance, todayDateStr]);

  const todayTasks = todayPerformance.tasks;
  const todayProgress = useMemo(() => {
    return {
      percentage: todayPerformance.completionRate,
      completedCount: todayPerformance.completedCount,
      totalCount: todayPerformance.totalScheduled,
      remainingCount: Math.max(0, todayPerformance.totalScheduled - todayPerformance.completedCount),
    };
  }, [todayPerformance]);

  // Operations
  const addTask = async (
    taskData: Omit<Task, 'taskId' | 'uid' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!user) {
      const msg = 'Please sign in before creating a task.';
      showToast(msg, 'error');
      throw new Error(msg);
    }

    const title = taskData.title?.trim();
    if (!title) {
      const msg = 'Task title cannot be empty.';
      showToast(msg, 'error');
      throw new Error(msg);
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      title,
      description: taskData.description?.trim() ? taskData.description.trim() : '',
      taskId,
      uid: user.uid,
      categoryId: taskData.categoryId || categories[0]?.categoryId || 'study',
      icon: taskData.icon || 'CheckSquare',
      isActive: taskData.isActive ?? true,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    const sanitizedTask = sanitizeForFirestore(newTask);

    try {
      await setDoc(doc(db, `users/${user.uid}/tasks`, taskId), sanitizedTask);
      
      // Update local state immediately (with deduping safeguard)
      setTasks((prev) => {
        if (prev.some((t) => t.taskId === taskId)) return prev;
        return [newTask, ...prev];
      });

      showToast(`Task "${newTask.title}" added successfully ✓`, 'success');
      return taskId;
    } catch (err: any) {
      console.error('Firestore addTask write error:', err);
      let errorMsg = "Couldn't create the task. Please check your connection.";
      if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
        errorMsg = "Missing or insufficient permissions to create task.";
      }
      showToast(errorMsg, 'error');
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/tasks/${taskId}`);
      throw err;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<void> => {
    if (!user) return;
    const taskRef = doc(db, `users/${user.uid}/tasks`, taskId);
    const now = new Date().toISOString();
    const cleanUpdates = sanitizeForFirestore({ ...updates, updatedAt: now });

    // Optimistic local update
    setTasks((prev) =>
      prev.map((t) => (t.taskId === taskId ? { ...t, ...updates, updatedAt: now } : t))
    );

    try {
      await updateDoc(taskRef, cleanUpdates);
      showToast('Task updated successfully ✓', 'success');
    } catch (err) {
      console.error('Firestore updateTask write error:', err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/tasks/${taskId}`);
    }
  };

  const archiveTask = async (taskId: string): Promise<void> => {
    if (!user) return;
    const taskRef = doc(db, `users/${user.uid}/tasks`, taskId);
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => (t.taskId === taskId ? { ...t, isArchived: true, updatedAt: now } : t))
    );
    try {
      await updateDoc(taskRef, { isArchived: true, updatedAt: now });
      showToast('Task archived');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/tasks/${taskId}`);
    }
  };

  const unarchiveTask = async (taskId: string): Promise<void> => {
    if (!user) return;
    const taskRef = doc(db, `users/${user.uid}/tasks`, taskId);
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => (t.taskId === taskId ? { ...t, isArchived: false, updatedAt: now } : t))
    );
    try {
      await updateDoc(taskRef, { isArchived: false, updatedAt: now });
      showToast('Task restored');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/tasks/${taskId}`);
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    if (!user) return;
    const taskRef = doc(db, `users/${user.uid}/tasks`, taskId);
    setTasks((prev) => prev.filter((t) => t.taskId !== taskId));
    try {
      await deleteDoc(taskRef);
      showToast('Task deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/tasks/${taskId}`);
    }
  };

  // Ultra-responsive Toggle Completion with 0ms Optimistic UI, in-flight debounce, & reliable Firestore sync
  const toggleTaskCompletion = async (
    taskId: string,
    dateStr: string,
    completed?: boolean,
    actualValue?: number
  ): Promise<void> => {
    if (!user) return;

    const completionId = `${taskId}_${dateStr}`;
    const compRef = doc(db, `users/${user.uid}/taskCompletions`, completionId);

    // Current state from fast lookup
    const existing = completionMap.get(completionId);
    const targetCompleted = completed !== undefined ? completed : !(existing?.completed ?? false);
    const task = tasks.find((t) => t.taskId === taskId);

    const defaultVal = actualValue !== undefined 
      ? actualValue 
      : (targetCompleted ? (task?.targetValue || 1) : 0);

    const nowIso = new Date().toISOString();
    const updatedRecord: TaskCompletion = {
      completionId,
      taskId,
      uid: user.uid,
      localDate: dateStr,
      completed: targetCompleted,
      actualValue: defaultVal,
      completedAt: nowIso,
      updatedAt: nowIso,
    };

    // 1. INSTANT OPTIMISTIC LOCAL STATE UPDATE (0ms)
    setCompletions((prev) => {
      const idx = prev.findIndex((c) => c.completionId === completionId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedRecord;
        return copy;
      }
      return [...prev, updatedRecord];
    });

    // 2. Track in-flight state & clear any previous pending timeout for this item
    const existingPending = pendingWritesRef.current.get(completionId);
    if (existingPending?.timeoutId) {
      clearTimeout(existingPending.timeoutId);
    }

    // Debounce the network write by 150ms so rapid clicks consolidate to single write
    const timeoutId = setTimeout(async () => {
      try {
        await setDoc(compRef, updatedRecord);
        pendingWritesRef.current.delete(completionId);
      } catch (err) {
        console.error('Firestore completion sync failed:', err);
        pendingWritesRef.current.delete(completionId);

        // Rollback to previous known state
        setCompletions((prev) => {
          if (existing) {
            const copy = [...prev];
            const idx = copy.findIndex((c) => c.completionId === completionId);
            if (idx >= 0) copy[idx] = existing;
            return copy;
          }
          return prev.filter((c) => c.completionId !== completionId);
        });
        showToast('Could not save completion to cloud. Please check connection.', 'error');
      }
    }, 150);

    pendingWritesRef.current.set(completionId, {
      record: updatedRecord,
      timestamp: Date.now(),
      timeoutId,
    });
  };

  // Update actual value (duration / quantity)
  const updateTaskActualValue = async (
    taskId: string,
    dateStr: string,
    actualValue: number
  ): Promise<void> => {
    if (!user) return;
    const task = tasks.find((t) => t.taskId === taskId);
    const isTargetMet = task?.targetValue ? actualValue >= task.targetValue : actualValue > 0;
    await toggleTaskCompletion(taskId, dateStr, isTargetMet, actualValue);
  };

  // Save daily reflection note & mood
  const saveDailyRecord = async (dateStr: string, note: string, mood?: MoodType): Promise<void> => {
    if (!user) return;
    const recordId = dateStr;
    const recordRef = doc(db, `users/${user.uid}/dailyRecords`, recordId);
    const record: DailyRecord = {
      dateId: recordId,
      uid: user.uid,
      localDate: dateStr,
      note: note || '',
      mood: mood || 'none',
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(recordRef, sanitizeForFirestore(record));
      showToast('Daily reflection saved');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/dailyRecords/${recordId}`);
    }
  };

  // Category management
  const addCategory = async (
    categoryData: Omit<Category, 'categoryId' | 'uid' | 'createdAt'>
  ): Promise<string> => {
    if (!user) throw new Error('Must be signed in');
    const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCategory: Category = {
      ...categoryData,
      categoryId,
      uid: user.uid,
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, `users/${user.uid}/categories`, categoryId), sanitizeForFirestore(newCategory));
      setCategories((prev) => [...prev, newCategory]);
      showToast(`Category "${newCategory.name}" created`);
      return categoryId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/categories/${categoryId}`);
      throw err;
    }
  };

  const deleteCategory = async (categoryId: string): Promise<void> => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/categories`, categoryId));
      showToast('Category deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/categories/${categoryId}`);
    }
  };

  // Starter routine generator for onboarding
  const createStarterRoutine = async (selectedGoalNames?: string[]): Promise<void> => {
    if (!user) return;
    const goals = selectedGoalNames || ['Productivity', 'Health', 'Fitness'];

    const starterTasks: Omit<Task, 'taskId' | 'uid' | 'createdAt' | 'updatedAt'>[] = [];

    // Study
    if (goals.includes('Study') || goals.includes('Productivity') || goals.includes('Work')) {
      starterTasks.push({
        title: 'Study & Focused Work',
        description: 'Deep work and study session',
        type: 'duration',
        targetValue: 2,
        targetUnit: 'Hours',
        categoryId: 'study',
        icon: 'BookOpen',
        schedule: { type: 'everyday' },
        reminderTime: '19:00',
        reminderEnabled: true,
        isActive: true,
        isArchived: false,
      });
    }

    // Gym / Fitness
    if (goals.includes('Fitness') || goals.includes('Health')) {
      starterTasks.push({
        title: 'Gym & Workout',
        description: 'Daily training session',
        type: 'duration',
        targetValue: 1,
        targetUnit: 'Hours',
        categoryId: 'fitness',
        icon: 'Dumbbell',
        schedule: { type: 'specific_days', days: [1, 2, 3, 4, 5] },
        reminderTime: '07:00',
        reminderEnabled: true,
        isActive: true,
        isArchived: false,
      });
    }

    // Sleep
    starterTasks.push({
      title: 'Sleep 8 Hours',
      description: 'Restful recovery and consistent bedtime',
      type: 'duration',
      targetValue: 8,
      targetUnit: 'Hours',
      categoryId: 'sleep',
      icon: 'Moon',
      schedule: { type: 'everyday' },
      reminderTime: '22:30',
      reminderEnabled: true,
      isActive: true,
      isArchived: false,
    });

    // Reading
    starterTasks.push({
      title: 'Read Book',
      description: 'Expand knowledge through reading',
      type: 'duration',
      targetValue: 30,
      targetUnit: 'Minutes',
      categoryId: 'reading',
      icon: 'BookMarked',
      schedule: { type: 'everyday' },
      reminderTime: '21:30',
      reminderEnabled: true,
      isActive: true,
      isArchived: false,
    });

    // Water
    starterTasks.push({
      title: 'Drink Water',
      description: 'Stay hydrated throughout the day',
      type: 'quantity',
      targetValue: 3,
      targetUnit: 'Litres',
      categoryId: 'health',
      icon: 'Droplets',
      schedule: { type: 'everyday' },
      isActive: true,
      isArchived: false,
    });

    const now = new Date().toISOString();
    const createdTasks: Task[] = [];

    for (const st of starterTasks) {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newTask: Task = {
        ...st,
        taskId,
        uid: user.uid,
        icon: st.icon || 'CheckSquare',
        isActive: st.isActive ?? true,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };
      createdTasks.push(newTask);
    }

    // 1. Update local state immediately
    setTasks((prev) => [...createdTasks, ...prev]);

    // 2. Persist to Firestore concurrently
    Promise.allSettled(
      createdTasks.map((task) =>
        setDoc(doc(db, `users/${user.uid}/tasks`, task.taskId), sanitizeForFirestore(task))
      )
    ).catch((err) => {
      console.warn('Starter tasks firestore batch write notice:', err);
    });
  };

  // Export Data JSON
  const exportDataAsJson = () => {
    if (!user) return;
    const data = {
      exportDate: new Date().toISOString(),
      user: {
        uid: user.uid,
        email: user.email,
        displayName: userProfile?.displayName,
      },
      tasks,
      completions,
      dailyRecords,
      categories,
      achievements,
      streakStats,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `routineflow_export_${todayDateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported as JSON');
  };

  // Export Data CSV
  const exportDataAsCsv = () => {
    if (!user) return;
    const headers = ['Date', 'Task ID', 'Task Title', 'Type', 'Target', 'Status', 'Actual Value'];
    const rows = completions.map((c) => {
      const task = tasks.find((t) => t.taskId === c.taskId);
      return [
        c.localDate,
        c.taskId,
        `"${(task?.title || 'Unknown Task').replace(/"/g, '""')}"`,
        task?.type || 'checkbox',
        task?.targetValue ? `${task.targetValue} ${task.targetUnit || ''}` : '-',
        c.completed ? 'Completed' : 'Missed',
        c.actualValue !== undefined ? c.actualValue : '-',
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `routineflow_history_${todayDateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported as CSV');
  };

  return (
    <RoutineContext.Provider
      value={{
        tasks,
        activeTasks,
        completions,
        categories,
        dailyRecords,
        achievements,
        loading,
        isOnline,
        todayDateStr,
        selectedDateStr,
        setSelectedDateStr,
        addTask,
        updateTask,
        archiveTask,
        unarchiveTask,
        deleteTask,
        toggleTaskCompletion,
        updateTaskActualValue,
        saveDailyRecord,
        addCategory,
        deleteCategory,
        createStarterRoutine,
        todayTasks,
        todayProgress,
        streakStats,
        smartInsights,
        getDayPerformance,
        exportDataAsJson,
        exportDataAsCsv,
        toast: toastMessage,
        toastMessage,
        showToast,
        hideToast,
      }}
    >
      {children}
    </RoutineContext.Provider>
  );
};

export function useRoutine() {
  const context = useContext(RoutineContext);
  if (!context) {
    throw new Error('useRoutine must be used within a RoutineProvider');
  }
  return context;
}
