/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

export const AppShellSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F9F8F6] dark:bg-[#121212] text-[#1A1A1A] dark:text-[#F3EFEA] flex flex-col md:flex-row transition-colors">
      {/* Fake Sidebar for desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#E8E3DA] dark:border-[#282725] bg-[#F2EDE4]/60 dark:bg-[#181716] p-5 shrink-0 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] dark:bg-[#F3EFEA] text-[#FAF8F5] dark:text-[#121212] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="h-4 w-24 bg-[#E2DDD5] dark:bg-[#2E2C2A] rounded-md animate-pulse" />
            <div className="h-2.5 w-16 bg-[#E2DDD5]/60 dark:bg-[#2E2C2A]/60 rounded-md mt-1.5 animate-pulse" />
          </div>
        </div>

        <div className="space-y-2 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-full bg-[#E2DDD5]/50 dark:bg-[#282725]/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden pb-28 sm:pb-32 md:pb-8">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#F9F8F6]/90 dark:bg-[#121212]/90 backdrop-blur-md border-b border-[#E8E3DA] dark:border-[#282725] px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#1A1A1A] dark:bg-[#F3EFEA] text-white dark:text-black flex md:hidden items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-serif font-bold text-lg text-[#1A1A1A] dark:text-[#F3EFEA]">
              RoutineFlow
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E8E3DA] dark:bg-[#282725] animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-[#E8E3DA] dark:bg-[#282725] animate-pulse" />
          </div>
        </header>

        {/* Dashboard Skeleton */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Greeting Banner */}
          <div className="pb-2 border-b border-[#E8E3DA] dark:border-[#282725] space-y-2">
            <div className="h-3 w-32 bg-[#E2DDD5] dark:bg-[#2E2C2A] rounded-md animate-pulse" />
            <div className="h-7 w-56 bg-[#E2DDD5] dark:bg-[#2E2C2A] rounded-lg animate-pulse" />
          </div>

          {/* Progress Card Skeleton */}
          <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-6 border border-[#E8E3DA] dark:border-[#282725] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex-1 space-y-3 w-full">
              <div className="h-5 w-28 bg-[#F2EDE4] dark:bg-[#242220] rounded-full animate-pulse" />
              <div className="h-7 w-64 bg-[#E2DDD5] dark:bg-[#2E2C2A] rounded-lg animate-pulse" />
              <div className="h-4 w-48 bg-[#E2DDD5]/70 dark:bg-[#2E2C2A]/70 rounded-md animate-pulse" />
            </div>
            <div className="w-28 h-28 rounded-full border-8 border-[#EAE4D9] dark:border-[#282725] animate-pulse shrink-0" />
          </div>

          {/* Habit Rows Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#1A1918] rounded-2xl p-4 sm:p-5 border border-[#E8E3DA] dark:border-[#282725] flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3.5 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-[#EAE4D9] dark:bg-[#282725] animate-pulse" />
                    <div className="w-8 h-8 rounded-xl bg-[#EAE4D9]/60 dark:bg-[#282725]/60 animate-pulse" />
                    <div className="space-y-1.5 flex-1 max-w-xs">
                      <div className="h-4 w-3/4 bg-[#E2DDD5] dark:bg-[#2E2C2A] rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-[#E2DDD5]/60 dark:bg-[#2E2C2A]/60 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="w-20 h-8 bg-[#EAE4D9]/80 dark:bg-[#282725]/80 rounded-xl animate-pulse" />
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-5 border border-[#E8E3DA] dark:border-[#282725] h-36 animate-pulse" />
              <div className="bg-white dark:bg-[#1A1918] rounded-2xl p-5 border border-[#E8E3DA] dark:border-[#282725] h-32 animate-pulse" />
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Nav Skeleton */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#FAF8F5]/95 dark:bg-[#161514]/95 border-t border-[#E8E3DA] dark:border-[#282725] px-4 py-2 flex items-center justify-around h-16">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-8 h-8 rounded-xl bg-[#E2DDD5]/60 dark:bg-[#282725]/60 animate-pulse" />
        ))}
      </div>
    </div>
  );
};
