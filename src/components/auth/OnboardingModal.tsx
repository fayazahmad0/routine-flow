/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useRoutine } from '../../context/RoutineContext';
import {
  Check,
  ArrowRight,
  Sparkles,
  BookOpen,
  Dumbbell,
  Heart,
  Moon,
  Briefcase,
  TrendingUp,
  Target,
  Clock,
} from 'lucide-react';

const GOAL_OPTIONS = [
  { id: 'Study', label: 'Study', icon: BookOpen, desc: 'Courses, reading, assignments' },
  { id: 'Fitness', label: 'Fitness', icon: Dumbbell, desc: 'Gym, running, training' },
  { id: 'Health', label: 'Health', icon: Heart, desc: 'Hydration, diet, wellness' },
  { id: 'Sleep', label: 'Sleep', icon: Moon, desc: '8 hours, consistent schedule' },
  { id: 'Work', label: 'Work', icon: Briefcase, desc: 'Deep focus, projects, tasks' },
  { id: 'Productivity', label: 'Productivity', icon: TrendingUp, desc: 'Time management, habits' },
  { id: 'Personal Growth', label: 'Personal Growth', icon: Sparkles, desc: 'Mindfulness, journaling' },
];

export const OnboardingModal: React.FC = () => {
  const { userProfile, user, updateUserProfile } = useAuth();
  const { createStarterRoutine, showToast } = useRoutine();

  const [step, setStep] = useState<number>(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Study', 'Fitness', 'Sleep']);
  const [displayName, setDisplayName] = useState<string>(
    userProfile?.displayName || user?.displayName || ''
  );
  const [createStarter, setCreateStarter] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // If user already completed onboarding, do not render
  if (userProfile?.onboardingCompleted) {
    return null;
  }

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    try {
      setIsSubmitting(true);
      const name = displayName.trim() || user?.displayName || 'Friend';
      
      if (createStarter) {
        await createStarterRoutine(selectedGoals);
      }

      await updateUserProfile({
        displayName: name,
        onboardingCompleted: true,
        selectedGoals,
      });

      showToast('Welcome to RoutineFlow! Your dashboard is ready.', 'success');
    } catch (err) {
      console.error('Error completing onboarding:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step
                  ? 'bg-indigo-600 dark:bg-indigo-500'
                  : 'bg-slate-100 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-4 space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Welcome to RoutineFlow 👋
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Build unbreakable habits, track your daily routines, and watch your consistency compound day by day.
                </p>
              </div>

              <div className="pt-6">
                <button
                  id="onboarding-step1-next"
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-sm rounded-2xl shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: What to improve */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  What do you want to improve?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Select all areas that apply. We'll personalize your experience.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {GOAL_OPTIONS.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = selectedGoals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => toggleGoal(goal.id)}
                      className={`flex items-start gap-3 p-3 text-left rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{goal.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {goal.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Back
                </button>
                <button
                  id="onboarding-step2-next"
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={selectedGoals.length === 0}
                  className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: What should we call you? */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  What should we call you?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Set your display name for your dashboard greetings.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Display Name
                </label>
                <input
                  id="onboarding-displayname-input"
                  type="text"
                  placeholder="e.g. Fayaz Ahmad"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Back
                </button>
                <button
                  id="onboarding-step3-next"
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Let's build your first routine */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Let's build your first routine
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  We'll start you off with a balanced set of daily habits. You can edit, adjust, or delete them anytime.
                </p>
              </div>

              {/* Starter routines preview */}
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>📚 Study & Deep Work</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">2 Hours</span>
                </div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>🏋️ Gym & Workout</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">1 Hour</span>
                </div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>😴 Sleep 8 Hours</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">8 Hours</span>
                </div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>📖 Read Book</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">30 Mins</span>
                </div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>💧 Drink Water</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">3 Litres</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="starter-routine-checkbox"
                  type="checkbox"
                  checked={createStarter}
                  onChange={(e) => setCreateStarter(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="starter-routine-checkbox"
                  className="text-xs text-slate-600 dark:text-slate-400 select-none cursor-pointer"
                >
                  Create these starter habits for me
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Back
                </button>
                <button
                  id="onboarding-finish-btn"
                  type="button"
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Setting up...' : 'Start My Routine'}
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
