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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/98 dark:bg-[#161616]/98 backdrop-blur-lg border-t border-[#E8E3DA] dark:border-[#282725] px-3 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-colors shadow-lg">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {navButtons.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <React.Fragment key={item.id}>
              {index === 2 && (
                <button
                  id="mobile-nav-add-btn"
                  onClick={onOpenAddTask}
                  className="flex flex-col items-center justify-center -mt-6 w-12 h-12 rounded-full bg-[#1A1A1A] hover:bg-[#33312E] dark:bg-[#F3EFEA] dark:text-[#121212] dark:hover:bg-[#E2DDD5] text-[#FAF8F5] active:scale-90 shadow-md transition-all cursor-pointer ring-4 ring-[#FAF8F5] dark:ring-[#161616]"
                  aria-label="Add Task"
                >
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </button>
              )}

              <button
                id={`mobile-nav-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center min-w-[52px] min-h-[48px] py-1 px-1.5 rounded-xl transition-all cursor-pointer active:scale-95 ${
                  isActive
                    ? 'text-[#1A1A1A] dark:text-[#F3EFEA] font-bold'
                    : 'text-[#78716C] dark:text-[#A39E96] hover:text-[#1A1A1A] dark:hover:text-[#F3EFEA]'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-2.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-mono font-bold text-white bg-[#A04000] rounded-full shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-mono tracking-tight mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};
