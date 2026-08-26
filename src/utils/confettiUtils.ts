/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import confetti from 'canvas-confetti';

let lastConfettiTime = 0;
let activeConfettiTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Fires a lightweight, hardware-accelerated celebratory burst with strict particle limits
 * and guaranteed cleanup, throttled so rapid taps never compound canvas rendering work.
 */
export function fireLightweightConfetti(): void {
  if (typeof window === 'undefined') return;

  // Check user preference for reduced motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const now = performance.now();
  // Throttle: Never fire multiple confetti loops within 1000ms
  if (now - lastConfettiTime < 1000) {
    return;
  }
  lastConfettiTime = now;

  if (activeConfettiTimer) {
    clearTimeout(activeConfettiTimer);
    activeConfettiTimer = null;
  }

  // Schedule async after current paint frame completes
  activeConfettiTimer = setTimeout(() => {
    try {
      // Clear any previous canvas particles
      confetti.reset();

      confetti({
        particleCount: 15, // Ultra-lightweight: 15 particles max (prevents GPU compositing locks)
        spread: 50,
        origin: { y: 0.85 },
        colors: ['#A04000', '#2D5A43', '#D4A373', '#68B087', '#1A1A1A'],
        ticks: 80, // Finite short duration (< 600ms)
        gravity: 1.2,
        scalar: 0.8,
        disableForReducedMotion: true,
      });

      // Guaranteed cleanup: reset after 700ms to free canvas memory
      activeConfettiTimer = setTimeout(() => {
        try {
          confetti.reset();
        } catch {
          // Ignore
        }
        activeConfettiTimer = null;
      }, 700);
    } catch (e) {
      // Safe fallback if canvas is restricted
    }
  }, 100);
}

/**
 * Cancels and cleans up all running confetti animations immediately
 */
export function cancelConfetti(): void {
  if (activeConfettiTimer) {
    clearTimeout(activeConfettiTimer);
    activeConfettiTimer = null;
  }
  try {
    confetti.reset();
  } catch {
    // Ignore
  }
}
