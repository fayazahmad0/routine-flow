/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  History,
  Trophy,
  Settings,
  Flame,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { useRoutine } from '../../context/RoutineContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { streakStats, todayProgress } = useRoutine();
  const { userProfile, signOut } = useAuth();

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'tasks',
      label: 'My Tasks',
      icon: CheckSquare,
      badge: todayProgress.remainingCount > 0 ? todayProgress.remainingCount : undefined,
    },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'history', label: 'History', icon: History },
    {
      id: 'achievements',
      label: 'Achievements',
      icon: Trophy,
    },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#FAF8F5] dark:bg-[#161616] border-r border-[#E8E3DA] dark:border-[#282725] p-5 select-none shrink-0 transition-colors">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-1 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] dark:bg-[#F3EFEA] text-[#FAF8F5] dark:text-[#121212] flex items-center justify-center shadow-xs">
          {/* Custom routineflow geometric logo */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" className="opacity-40" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold tracking-tight text-[#1A1A1A] dark:text-[#F3EFEA]">
            RoutineFlow
          </h2>
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#78716C] dark:text-[#A39E96]">
            Daily Chronicle
          </p>
        </div>
      </div>

      {/* Streak Highlight Card */}
      <div className="mb-6 p-4 bg-[#F2EDE4] dark:bg-[#1F1E1C] rounded-2xl border border-[#E2DDD5] dark:border-[#2E2C2A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#1A1A1A]/5 dark:bg-[#F3EFEA]/10 text-[#A04000] dark:text-[#E08A50] rounded-xl">
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-[#78716C] dark:text-[#A39E96]">Current Streak</p>
              <p className="font-serif text-base font-bold text-[#1A1A1A] dark:text-[#F3EFEA]">
                {streakStats.currentStreak} {streakStats.currentStreak === 1 ? 'Day' : 'Days'}
              </p>
            </div>
          </div>
          {streakStats.perfectDaysCount > 0 && (
            <div className="text-right">
              <p className="text-[10px] uppercase font-mono tracking-wider text-[#78716C] dark:text-[#A39E96]">Perfect</p>
              <p className="font-serif text-base font-bold text-[#2D5A43] dark:text-[#68B087]">
                {streakStats.perfectDaysCount}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#EAE4D9] dark:bg-[#252422] text-[#1A1A1A] dark:text-[#F3EFEA] font-semibold border border-[#DCD6CD] dark:border-[#353330]'
                  : 'text-[#57534E] dark:text-[#A39E96] hover:bg-[#F2EDE4]/60 dark:hover:bg-[#1E1D1B] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#1A1A1A] dark:text-[#F3EFEA]' : 'text-[#78716C] dark:text-[#78716C]'}`} />
                <span className={isActive ? 'font-medium tracking-tight' : 'font-normal'}>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 text-[11px] font-mono font-medium bg-[#1A1A1A] dark:bg-[#F3EFEA] text-[#FAF8F5] dark:text-[#121212] rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile / Signout section */}
      <div className="pt-4 mt-auto border-t border-[#E8E3DA] dark:border-[#282725]">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F2EDE4] dark:bg-[#1F1E1C] border border-[#E2DDD5] dark:border-[#2E2C2A]">
          <div
            onClick={() => onSelectTab('profile')}
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] dark:bg-[#F3EFEA] text-[#FAF8F5] dark:text-[#121212] font-serif font-bold flex items-center justify-center text-sm shrink-0">
              {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-[#1A1A1A] dark:text-[#F3EFEA] truncate">
                {userProfile?.displayName || 'My Profile'}
              </p>
              <p className="text-[10px] font-mono text-[#78716C] dark:text-[#A39E96] truncate">
                {userProfile?.email || userProfile?.phoneNumber || 'RoutineFlow'}
              </p>
            </div>
          </div>
          <button
            id="sidebar-signout-btn"
            onClick={signOut}
            className="p-1.5 text-[#78716C] hover:text-[#991B1B] dark:hover:text-[#EF4444] rounded-lg hover:bg-[#EAE4D9] dark:hover:bg-[#282725] transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
