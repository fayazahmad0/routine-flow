/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = 'h-32' }) => (
  <div className={`bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse ${className}`} />
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-8">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-4 w-32 bg-slate-100 dark:bg-slate-850 rounded animate-pulse" />
      </div>
      <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 h-52 bg-slate-100 dark:bg-slate-800/70 rounded-2xl animate-pulse" />
      <div className="h-52 bg-slate-100 dark:bg-slate-800/70 rounded-2xl animate-pulse" />
    </div>

    <div className="space-y-3">
      <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse" />
      ))}
    </div>
  </div>
);
