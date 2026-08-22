/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRoutine } from '../../context/RoutineContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Settings as SettingsIcon,
  User,
  Moon,
  Sun,
  Laptop,
  Calendar,
  FolderPlus,
  Trash2,
  LogOut,
  Save,
  Check,
  RotateCcw,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

export const SettingsView: React.FC = () => {
  const { userProfile, updateUserProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const {
    categories,
    addCategory,
    deleteCategory,
    createStarterRoutine,
    showToast,
  } = useRoutine();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<'monday' | 'sunday'>(
    userProfile?.settings?.firstDayOfWeek || 'monday'
  );
  const [timezone, setTimezone] = useState(
    userProfile?.settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Category addition
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  // Confirmation modals
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeletingCatId, setIsDeletingCatId] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      await updateUserProfile({
        displayName: displayName.trim(),
        settings: {
          ...userProfile?.settings,
          firstDayOfWeek,
          timezone,
        },
      });
      showToast('Profile & preferences saved successfully.', 'success');
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    await addCategory({
      name: newCatName.trim(),
      color: newCatColor,
      icon: 'CheckSquare',
    });
    setNewCatName('');
  };

  const handleResetHabits = async () => {
    await createStarterRoutine(['Study', 'Fitness', 'Sleep', 'Health', 'Productivity']);
    setIsResetModalOpen(false);
    showToast('Reset to default starter habits.', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] dark:text-[#F3EFEA] tracking-tight">
          Settings & Preferences
        </h2>
        <p className="text-xs sm:text-sm font-mono text-[#78716C] dark:text-[#A39E96] mt-1">
          Customize your profile, routine categories, theme, and schedule preferences.
        </p>
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white dark:bg-[#1A1918] rounded-2xl p-5 sm:p-6 border border-[#E8E3DA] dark:border-[#282725] shadow-xs space-y-4"
      >
        <h3 className="font-serif text-sm font-bold text-[#1A1A1A] dark:text-[#F3EFEA] tracking-tight flex items-center gap-2">
          <User className="w-4 h-4 text-[#A04000] dark:text-[#E08A50]" />
          Profile Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-semibold text-[#57534E] dark:text-[#A39E96] mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#161616] border border-[#E8E3DA] dark:border-[#282725] rounded-xl text-xs sm:text-sm font-medium text-[#1A1A1A] dark:text-[#F3EFEA] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#F3EFEA]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-[#57534E] dark:text-[#A39E96] mb-1.5">
              Timezone
            </label>
            <input
              type="text"
              disabled
              value={timezone}
              className="w-full px-3.5 py-2.5 bg-[#F2EDE4] dark:bg-[#22211F] border border-[#E2DDD5] dark:border-[#2E2C2A] rounded-xl text-xs sm:text-sm text-[#78716C] dark:text-[#A39E96] font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSavingProfile}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] hover:bg-[#33312E] dark:bg-[#F3EFEA] dark:text-[#121212] dark:hover:bg-[#E2DDD5] text-[#FAF8F5] text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSavingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* Theme & Display Preferences */}
      <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-5 sm:p-6 border border-[#E8E3DA] dark:border-[#282725] shadow-xs space-y-4">
        <h3 className="font-serif text-sm font-bold text-[#1A1A1A] dark:text-[#F3EFEA] tracking-tight flex items-center gap-2">
          <Moon className="w-4 h-4 text-[#A04000] dark:text-[#E08A50]" />
          Appearance & Calendar
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-mono font-semibold text-[#57534E] dark:text-[#A39E96] mb-2">
              Theme Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light' as const, label: 'Light', icon: Sun },
                { id: 'dark' as const, label: 'Dark', icon: Moon },
                { id: 'system' as const, label: 'System', icon: Laptop },
              ].map((t) => {
                const Icon = t.icon;
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#1A1A1A] dark:border-[#F3EFEA] bg-[#F2EDE4] dark:bg-[#252422] text-[#1A1A1A] dark:text-[#F3EFEA] ring-1 ring-[#1A1A1A] dark:ring-[#F3EFEA]'
                        : 'border-[#E8E3DA] dark:border-[#282725] text-[#78716C] dark:text-[#A39E96] hover:bg-[#F2EDE4] dark:hover:bg-[#252422]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* First Day of Week */}
          <div>
            <label className="block text-xs font-mono font-semibold text-[#57534E] dark:text-[#A39E96] mb-2">
              First Day of Week
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'monday' as const, label: 'Monday' },
                { id: 'sunday' as const, label: 'Sunday' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setFirstDayOfWeek(d.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    firstDayOfWeek === d.id
                      ? 'border-[#1A1A1A] dark:border-[#F3EFEA] bg-[#F2EDE4] dark:bg-[#252422] text-[#1A1A1A] dark:text-[#F3EFEA] ring-1 ring-[#1A1A1A] dark:ring-[#F3EFEA]'
                      : 'border-[#E8E3DA] dark:border-[#282725] text-[#78716C] dark:text-[#A39E96] hover:bg-[#F2EDE4] dark:hover:bg-[#252422]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category Management */}
      <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-5 sm:p-6 border border-[#E8E3DA] dark:border-[#282725] shadow-xs space-y-4">
        <h3 className="font-serif text-sm font-bold text-[#1A1A1A] dark:text-[#F3EFEA] tracking-tight flex items-center gap-2">
          <FolderPlus className="w-4 h-4 text-[#A04000] dark:text-[#E08A50]" />
          Manage Categories
        </h3>

        {/* Existing Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {categories.map((cat) => (
            <div
              key={cat.categoryId}
              className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#161616] border border-[#E8E3DA] dark:border-[#282725]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color || '#6366f1' }}
                />
                <span className="text-xs font-bold text-[#1A1A1A] dark:text-[#F3EFEA] truncate">
                  {cat.name}
                </span>
              </div>

              {categories.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsDeletingCatId(cat.categoryId)}
                  className="p-1 text-[#78716C] hover:text-[#B91C1C] dark:hover:text-[#F87171] rounded-lg hover:bg-[#FEE2E2] dark:hover:bg-[#3E1A1A] cursor-pointer"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Category inline form */}
        <form onSubmit={handleAddCategory} className="flex items-center gap-2 pt-2">
          <input
            type="text"
            placeholder="New Category Name..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#161616] border border-[#E8E3DA] dark:border-[#282725] rounded-xl text-xs font-medium text-[#1A1A1A] dark:text-[#F3EFEA] focus:outline-none focus:border-[#1A1A1A] dark:focus:border-[#F3EFEA]"
          />
          <input
            type="color"
            value={newCatColor}
            onChange={(e) => setNewCatColor(e.target.value)}
            className="w-9 h-9 rounded-xl border-0 cursor-pointer bg-transparent"
          />
          <button
            type="submit"
            disabled={!newCatName.trim()}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#33312E] dark:bg-[#F3EFEA] dark:text-[#121212] dark:hover:bg-[#E2DDD5] text-[#FAF8F5] text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer transition-all"
          >
            Add
          </button>
        </form>
      </div>

      {/* Danger / Reset Zone */}
      <div className="bg-[#FFF5F5] dark:bg-[#2A1616] rounded-2xl p-5 sm:p-6 border border-[#FCDADA] dark:border-[#4E2424] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-serif text-sm font-bold text-[#991B1B] dark:text-[#FCA5A5]">
            Reset Routine Templates
          </h4>
          <p className="text-xs text-[#B91C1C]/80 dark:text-[#F87171]/80 mt-0.5 font-mono">
            Reload standard starter habits (Study, Fitness, Sleep, Reading, Hydration).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsResetModalOpen(true)}
          className="px-4 py-2 bg-white dark:bg-[#1A1918] border border-[#F87171] dark:border-[#991B1B] text-[#B91C1C] dark:text-[#FCA5A5] hover:bg-[#FEE2E2] dark:hover:bg-[#3E1A1A] text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          Reset Routines
        </button>
      </div>

      {/* Sign Out Button */}
      <div className="pt-2 flex justify-center">
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] hover:bg-[#33312E] dark:bg-[#F3EFEA] dark:text-[#121212] dark:hover:bg-[#E2DDD5] text-[#FAF8F5] text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out of RoutineFlow
        </button>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Reset to Starter Habits?"
        message="This will add the standard starter habit set (Study, Fitness, Sleep, etc.) to your account."
        confirmLabel="Reset Routines"
        onConfirm={handleResetHabits}
        onCancel={() => setIsResetModalOpen(false)}
      />

      <ConfirmModal
        isOpen={Boolean(isDeletingCatId)}
        title="Delete Category?"
        message="Are you sure you want to remove this category? Tasks assigned to it will remain safe."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={async () => {
          if (isDeletingCatId) {
            await deleteCategory(isDeletingCatId);
            setIsDeletingCatId(null);
          }
        }}
        onCancel={() => setIsDeletingCatId(null)}
      />
    </div>
  );
};
