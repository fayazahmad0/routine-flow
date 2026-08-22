/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, WeekStartDay } from '../types';

/**
 * Returns YYYY-MM-DD string for a given date in the user's timezone or system timezone
 */
export function getLocalDateString(date: Date = new Date(), timezone?: string): string {
  try {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // Output format: YYYY-MM-DD
  } catch {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

export interface MonthDayInfo {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  dayNumber: number;
}

/**
 * Parses YYYY-MM-DD into a Date object at 12:00:00 local time to prevent DST shifts
 */
export function parseLocalDate(dateStr?: string | null): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date();
  }
  const parts = dateStr.trim().split('-');
  if (parts.length < 3) {
    return new Date();
  }
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) {
    return new Date();
  }
  return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * Gets day of week: 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
 */
export function getDayOfWeek(dateStr?: string | null): number {
  return parseLocalDate(dateStr).getDay();
}

/**
 * Checks if a task is scheduled on a given local date string (YYYY-MM-DD)
 */
export function isTaskScheduledOnDate(task: Task, dateStr: string): boolean {
  if (!task.isActive || task.isArchived) return false;
  
  // Do not show tasks before they were created in the user's local date
  if (task.createdAt && dateStr) {
    try {
      const createdLocalDate = getLocalDateString(new Date(task.createdAt));
      if (dateStr < createdLocalDate) {
        return false;
      }
    } catch {
      // Fallback if parsing fails
    }
  }

  const schedule = task.schedule;
  if (!schedule) return true;

  if (schedule.type === 'everyday') {
    return true;
  }

  const dayOfWeek = getDayOfWeek(dateStr); // 0 (Sun) - 6 (Sat)

  if (schedule.type === 'specific_days' || schedule.type === 'custom') {
    if (!schedule.days || schedule.days.length === 0) return true;
    return schedule.days.includes(dayOfWeek);
  }

  if (schedule.type === 'weekly') {
    return true;
  }

  return true;
}

/**
 * Formats date into a user-friendly format: e.g. "Tuesday, August 18"
 */
export function formatFullDate(dateStr?: string | null): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats date into short format: e.g. "Aug 18"
 */
export function formatShortDate(dateStr?: string | null): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Returns greeting based on local hour
 */
export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Adds or subtracts days from a YYYY-MM-DD string
 */
export function addDaysToDateString(dateStr?: string | null, days: number = 0): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
}

/**
 * Returns the array of dates in the current week (7 days)
 */
export function getWeekDates(dateStr?: string | null, weekStart: WeekStartDay = 'monday'): string[] {
  const currentDate = parseLocalDate(dateStr);
  const currentDay = currentDate.getDay(); // 0 (Sun) to 6 (Sat)
  
  let diffToStart: number;
  if (weekStart === 'monday') {
    diffToStart = (currentDay === 0 ? -6 : 1) - currentDay;
  } else {
    diffToStart = -currentDay;
  }

  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() + diffToStart);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(getLocalDateString(d));
  }
  return dates;
}

/**
 * Generates month calendar matrix (array of weeks, each containing 7 date objects or null)
 */
export interface CalendarCell {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export function getMonthCalendarMatrix(
  year: number,
  month: number, // 0-11
  todayStr: string,
  weekStart: WeekStartDay = 'monday'
): CalendarCell[][] {
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)

  let leadingBlanks = 0;
  if (weekStart === 'monday') {
    leadingBlanks = startDay === 0 ? 6 : startDay - 1;
  } else {
    leadingBlanks = startDay;
  }

  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];

  // Previous month overflow days
  for (let i = leadingBlanks - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const prevMonthDate = new Date(year, month - 1, dayNum, 12, 0, 0);
    const dateStr = getLocalDateString(prevMonthDate);
    cells.push({
      dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d, 12, 0, 0);
    const dateStr = getLocalDateString(curDate);
    cells.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
    });
  }

  // Next month overflow days to complete 35 or 42 grid
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const nextMonthDate = new Date(year, month + 1, i, 12, 0, 0);
    const dateStr = getLocalDateString(nextMonthDate);
    cells.push({
      dateStr,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
    });
  }

  // Chunk into rows of 7
  const weeks: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

/**
 * Formats day name (e.g. "Mon" or "Monday")
 */
export function formatDayName(dateInput?: string | Date | null, format: 'short' | 'long' = 'short'): string {
  const date = typeof dateInput === 'string' ? parseLocalDate(dateInput) : (dateInput || new Date());
  return date.toLocaleDateString(undefined, { weekday: format });
}

/**
 * Returns month name by 0-indexed month number
 */
export function getMonthName(monthIndex: number, format: 'short' | 'long' = 'long'): string {
  const date = new Date(2026, monthIndex, 1);
  return date.toLocaleDateString(undefined, { month: format });
}

/**
 * Alias for getLocalDateString
 */
export function formatDateToYYYYMMDD(date: Date = new Date(), timezone?: string): string {
  return getLocalDateString(date, timezone);
}

/**
 * Returns structured array of day objects in a given month for calendar rendering with padding
 */
export function getMonthDays(
  year: number,
  month: number,
  weekStart: WeekStartDay = 'monday'
): MonthDayInfo[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)

  let leadingBlanks = 0;
  if (weekStart === 'monday') {
    leadingBlanks = startDay === 0 ? 6 : startDay - 1;
  } else {
    leadingBlanks = startDay;
  }

  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells: MonthDayInfo[] = [];

  // Previous month overflow days
  for (let i = leadingBlanks - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const prevMonthDate = new Date(year, month - 1, dayNum, 12, 0, 0);
    const dateStr = getLocalDateString(prevMonthDate);
    cells.push({
      date: prevMonthDate,
      dateStr,
      isCurrentMonth: false,
      dayNumber: dayNum,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d, 12, 0, 0);
    const dateStr = getLocalDateString(curDate);
    cells.push({
      date: curDate,
      dateStr,
      isCurrentMonth: true,
      dayNumber: d,
    });
  }

  // Next month overflow days to complete full weeks
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const nextMonthDate = new Date(year, month + 1, i, 12, 0, 0);
    const dateStr = getLocalDateString(nextMonthDate);
    cells.push({
      date: nextMonthDate,
      dateStr,
      isCurrentMonth: false,
      dayNumber: i,
    });
  }

  return cells;
}

