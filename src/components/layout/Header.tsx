/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRoutine } from '../../context/RoutineContext';
import { useTheme } from '../../context/ThemeContext';
import { getTimeGreeting, formatFullDate } from '../../utils/dateUtils';
import { Plus, Sun, Moon, Bell, BellOff, User, Flame } from 'lucide-react';
import { ActiveTab } from '../../types';

interface HeaderProps {
  onOpenAddTask: () => void;
  onSelectTab: (tab: ActiveTab) => void;
  activeTab: ActiveTab;
}

export const Header: React.FC<HeaderProps> = React.memo(({ onOpenAddTask, onSelectTab, activeTab }) => {
  const { userProfile, user } = useAuth();
  const { todayDateStr, streakStats, showToast } = useRoutine();
  const { theme, setTheme, isDark } = useTheme();

  const greeting = getTimeGreeting();
  const rawDisplayName = userProfile?.displayName || user?.displayName || 'Friend';
  const firstName = typeof rawDisplayName === 'string' && rawDisplayName.trim()
    ? rawDisplayName.trim().split(' ')[0]
    : 'Friend';
  const dateFormatted = formatFullDate(todayDateStr);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleNotificationRequest = async () => {
    if (!('Notification' in window)) {
      showToast('Notifications are not supported in this browser.', 'info');
      return;
    }

    if (Notification.permission === 'granted') {
      showToast('Notifications are active for RoutineFlow.', 'info');
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showToast('Notifications enabled for routine reminders!', 'success');
      } else {
        showToast('Notification permission was dismissed.', 'info');
      }
    } else {
      showToast('Notifications are blocked. Please enable them in browser site settings.', 'info');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5] dark:bg-[#161616] md:bg-[#FAF8F5]/90 md:dark:bg-[#161616]/90 md:backdrop-blur-md border-b border-[#E8E3DA] dark:border-[#282725] px-4 sm:px-6 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Greeting & Date */}
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-[#1A1A1A] dark:text-[#F3EFEA]">
              {greeting}, {firstName}
            </h1>
            {streakStats.currentStreak > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-mono font-semibold bg-[#F2EDE4] dark:bg-[#242220] text-[#A04000] dark:text-[#E08A50] border border-[#E2DDD5] dark:border-[#353330] rounded-full">
                <Flame className="w-3.5 h-3.5 fill-current" />
                {streakStats.currentStreak}d
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-mono tracking-wide text-[#78716C] dark:text-[#A39E96] mt-0.5">
            {dateFormatted}
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Add Task Button */}
          <button
            id="header-add-task-btn"
            onClick={onOpenAddTask}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1A1A1A] hover:bg-[#33312E] active:scale-95 text-[#FAF8F5] dark:bg-[#F3EFEA] dark:text-[#121212] dark:hover:bg-[#E2DDD5] text-xs sm:text-sm font-medium rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Record Routine</span>
          </button>

          {/* Theme Toggle */}
          <button
            id="header-theme-toggle-btn"
            onClick={toggleTheme}
            className="p-2 text-[#57534E] dark:text-[#A39E96] hover:bg-[#EAE4D9] dark:hover:bg-[#282725] rounded-xl transition-colors cursor-pointer border border-[#E8E3DA] dark:border-[#2E2C2A]"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#D4A373]" /> : <Moon className="w-4 h-4 text-[#57534E]" />}
          </button>

          {/* Notification Button */}
          <button
            id="header-notifications-btn"
            onClick={handleNotificationRequest}
            className="p-2 text-[#57534E] dark:text-[#A39E96] hover:bg-[#EAE4D9] dark:hover:bg-[#282725] rounded-xl transition-colors cursor-pointer border border-[#E8E3DA] dark:border-[#2E2C2A]"
            aria-label="Notifications"
            title="Routine reminders"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Profile Avatar */}
          <button
            id="header-profile-btn"
            onClick={() => onSelectTab('profile')}
            className={`p-1 rounded-xl transition-all border ${
              activeTab === 'profile'
                ? 'border-[#1A1A1A] dark:border-[#F3EFEA] ring-1 ring-[#1A1A1A] dark:ring-[#F3EFEA]'
                : 'border-[#E8E3DA] dark:border-[#2E2C2A] hover:bg-[#EAE4D9] dark:hover:bg-[#282725]'
            }`}
            aria-label="Profile"
          >
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={firstName}
                className="w-7 h-7 rounded-lg object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-[#EAE4D9] dark:bg-[#282725] text-[#1A1A1A] dark:text-[#F3EFEA] flex items-center justify-center font-serif font-bold text-xs">
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
