/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showText?: boolean;
  subText?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 140,
  strokeWidth = 12,
  className = '',
  showText = true,
  subText,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-[#EAE4D9] dark:text-[#282725]"
        />
        {/* Animated Progress bar */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          strokeLinecap="round"
          fill="transparent"
          className={
            clampedPercentage === 100
              ? 'text-[#2D5A43] dark:text-[#68B087]'
              : clampedPercentage >= 60
              ? 'text-[#1A1A1A] dark:text-[#F3EFEA]'
              : clampedPercentage >= 30
              ? 'text-[#A04000] dark:text-[#E08A50]'
              : 'text-[#991B1B] dark:text-[#EF4444]'
          }
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-3xl font-bold tracking-tight text-[#1A1A1A] dark:text-[#F3EFEA] transition-all duration-150">
            {clampedPercentage}%
          </span>
          {subText && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#78716C] dark:text-[#A39E96] mt-0.5">
              {subText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
