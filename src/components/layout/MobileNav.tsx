/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LayoutDashboard, CheckSquare, Calendar, BarChart3, User, Plus } from 'lucide-react';
import { ActiveTab } from '../../types';
import { useRoutine } from '../../context/RoutineContext';

interface MobileNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenAddTask: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddTask,
}) => {
  const { todayProgress } = useRoutine();

  const navButtons = [
    { id: 'dashboard' as ActiveTab, label: 'Home', icon: LayoutDashboard },
    {
      id: 'tasks' as ActiveTab,
      label: 'Tasks',
      icon: CheckSquare,
      badge: todayProgress.remainingCount > 0 ? todayProgress.remainingCount : undefined,
    },
    { id: 'calendar' as ActiveTab, label: 'Calendar', icon: Calendar },
    { id: 'analytics' as ActiveTab, label: 'Analytics', icon: BarChart3 },
    { id: 'profile' as ActiveTab, label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 dark:bg-[#161616]/95 backdrop-blur-md border-t border-[#E8E3DA] dark:border-[#282725] px-2 py-1.5 transition-colors pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navButtons.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          // Insert Add button in middle if index == 2
          return (
            <React.Fragment key={item.id}>
              {index === 2 && (
                <button
                  id="mobile-nav-add-btn"
                  onClick={onOpenAddTask}
                  className="flex flex-col items-center justify-center -mt-5 w-11 h-11 rounded-full bg-[#1A1A1A] dark:bg-[#F3EFEA] text-[#FAF8F5] dark:text-[#121212] active:scale-95 shadow-md cursor-pointer"
                  aria-label="Add Task"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}

              <button
                id={`mobile-nav-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-[#1A1A1A] dark:text-[#F3EFEA] font-semibold'
                    : 'text-[#78716C] dark:text-[#A39E96] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA]'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2px]' : 'stroke-[1.6px]'}`} />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-[15px] h-3.5 px-1 text-[9px] font-mono font-bold text-white bg-[#A04000] rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono tracking-tight mt-0.5">{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};
