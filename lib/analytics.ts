// Pure habit analytics — ported from the HTML prototype, typed.
// NOTE (v2 / see notes.txt): date keys use LOCAL time and missed days are never
// auto-marked. Both must be fixed before real users (timezone + midnight job).

import { colors } from '@/theme/tokens';
import type { Habit, HeatWeek } from './types';

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

function midnight(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = midnight(d);
  x.setDate(x.getDate() - x.getDay()); // Sunday-based
  return x;
}

/** One slip is forgiven before a streak breaks (retention "streak-freeze"). */
export const GRACE_DAYS = 1;

/** Is this date one the habit is meant to be kept on? Count mode = any day. */
export function isScheduled(habit: Habit, d: Date): boolean {
  if ((habit.scheduleType || 'specific') === 'count') return true;
  return (habit.days || []).includes(d.getDay());
}

export function streakUnit(habit: Habit): 'DAY STREAK' | 'WEEK STREAK' {
  return (habit.scheduleType || 'specific') === 'count' ? 'WEEK STREAK' : 'DAY STREAK';
}

export function streakOf(habit: Habit): number {
  return (habit.scheduleType || 'specific') === 'count' ? weekStreak(habit) : dayStreak(habit);
}

// Specific mode: consecutive SCHEDULED days kept. Non-scheduled days are
// skipped (don't break it). Today, if scheduled but not yet done, is pending
// (doesn't break). One missed scheduled day is forgiven (grace).
function dayStreak(habit: Habit): number {
  const h = habit.history || {};
  const today = midnight(new Date());
  let count = 0;
  let grace = GRACE_DAYS;
  const d = new Date(today);
  for (let i = 0; i < 730; i++) {
    if (isScheduled(habit, d)) {
      const st = h[dateKey(d)];
      const isToday = d.getTime() === today.getTime();
      if (st === 'green') count++;
      else if (isToday) {
        /* pending today — neither count nor break */
      } else if (grace > 0) grace--; // forgive one slip
      else break;
    }
    d.setDate(d.getDate() - 1);
  }
  return count;
}

// Count mode: consecutive weeks that hit weeklyTarget. Current (partial) week
// doesn't break the run if the target isn't reached yet.
function weekStreak(habit: Habit): number {
  const today = midnight(new Date());
  const target = habit.weeklyTarget || 4;
  const ws = startOfWeek(today);
  let count = greensInRange(habit, ws, today) >= target ? 1 : 0;
  const w = new Date(ws);
  w.setDate(w.getDate() - 7);
  for (let i = 0; i < 260; i++) {
    const we = new Date(w);
    we.setDate(we.getDate() + 6);
    if (greensInRange(habit, w, we) >= target) {
      count++;
      w.setDate(w.getDate() - 7);
    } else break;
  }
  return count;
}

export function winsOf(habit: Habit): number {
  return Object.values(habit.history || {}).filter((v) => v === 'green').length;
}

function greensInRange(habit: Habit, from: Date, to: Date): number {
  const h = habit.history || {};
  let n = 0;
  const d = midnight(from);
  const end = midnight(to);
  while (d <= end) {
    if (h[dateKey(d)] === 'green') n++;
    d.setDate(d.getDate() + 1);
  }
  return n;
}

function scheduledInRange(habit: Habit, from: Date, to: Date): number {
  let n = 0;
  const days = habit.days || [];
  const d = midnight(from);
  const end = midnight(to);
  while (d <= end) {
    if (days.includes(d.getDay())) n++;
    d.setDate(d.getDate() + 1);
  }
  return n;
}

/** Scheduled days in range that were kept (green). */
function scheduledKeptInRange(habit: Habit, from: Date, to: Date): number {
  const h = habit.history || {};
  const days = habit.days || [];
  let n = 0;
  const d = midnight(from);
  const end = midnight(to);
  while (d <= end) {
    if (days.includes(d.getDay()) && h[dateKey(d)] === 'green') n++;
    d.setDate(d.getDate() + 1);
  }
  return n;
}

// Whole calendar days between two dates, DST-safe (anchored at UTC midnight so
// a 23h/25h DST day never miscounts). See notes.txt #13.
function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86400000);
}

function firstDate(habit: Habit): Date {
  const keys = Object.keys(habit.history || {});
  if (!keys.length) return midnight(new Date());
  let min: Date | null = null;
  keys.forEach((k) => {
    const [y, m, day] = k.split('-').map(Number);
    const d = new Date(y, m - 1, day);
    if (!min || d < min) min = d;
  });
  return midnight(min || new Date());
}

/** Percentage of promises kept. Definition differs per schedule mode. */
export function keptPct(habit: Habit): number {
  if ((habit.scheduleType || 'specific') === 'count') {
    const wins = winsOf(habit);
    const days = Math.max(1, daysBetween(firstDate(habit), new Date()) + 1);
    const weeks = Math.max(1, Math.ceil(days / 7));
    const denom = (habit.weeklyTarget || 4) * weeks;
    return denom ? Math.min(100, Math.round((wins / denom) * 100)) : 0;
  }
  // Specific mode: kept scheduled days / scheduled days elapsed. Missed
  // scheduled days count against you (no need to write them as 'red').
  const first = firstDate(habit);
  const today = midnight(new Date());
  const todayGreen = (habit.history || {})[todayKey()] === 'green';
  const end = new Date(today);
  if (!todayGreen) end.setDate(end.getDate() - 1); // don't penalize a pending today
  if (end < first) return todayGreen ? 100 : 0;
  const denom = scheduledInRange(habit, first, end);
  const num = scheduledKeptInRange(habit, first, end);
  return denom ? Math.min(100, Math.round((num / denom) * 100)) : 0;
}

export function weekStats(habit: Habit): { done: number; target: number } {
  const today = new Date();
  const ws = startOfWeek(today);
  const count = (habit.scheduleType || 'specific') === 'count';
  // specific: count only scheduled greens so done never exceeds target (#15)
  const done = count ? greensInRange(habit, ws, today) : scheduledKeptInRange(habit, ws, today);
  let target: number;
  if (count) {
    target = habit.weeklyTarget || 4;
  } else {
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    target = scheduledInRange(habit, ws, we);
  }
  return { done, target: Math.max(target, 0) };
}

export function monthStats(habit: Habit): { done: number; target: number } {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const count = (habit.scheduleType || 'specific') === 'count';
  const done = count ? greensInRange(habit, first, today) : scheduledKeptInRange(habit, first, today);
  let target: number;
  if (count) {
    const weeks = Math.ceil(today.getDate() / 7);
    target = (habit.weeklyTarget || 4) * weeks;
  } else {
    target = scheduledInRange(habit, first, today);
  }
  return { done, target: Math.max(target, 0) };
}

export function modeLabel(habit: Habit): string {
  return (habit.scheduleType || 'specific') === 'count'
    ? `Any ${habit.weeklyTarget || 4} days / week`
    : 'Set weekdays';
}

export function scheduleLabelShort(habit: Habit): string {
  return (habit.scheduleType || 'specific') === 'count'
    ? `${habit.weeklyTarget || 4}×/wk`
    : 'set days';
}

/** Build 53 week-columns ending on this week, coloured per-day by `perDay`. */
function yearWeeks(perDay: (d: Date, future: boolean) => string): HeatWeek[] {
  const today = midnight(new Date());
  const start = startOfWeek(today);
  start.setDate(start.getDate() - 52 * 7);
  const weeks: HeatWeek[] = [];
  const cur = new Date(start);
  for (let w = 0; w < 53; w++) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const future = cur > today;
      days.push({ color: perDay(new Date(cur), future), future });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push({ days });
  }
  return weeks;
}

/** Overall heatmap: shade = how many habits were kept that day. */
export function overallHeat(habits: Habit[]): HeatWeek[] {
  const scale = colors.heat;
  return yearWeeks((d, future) => {
    if (future) return 'transparent';
    const k = dateKey(d);
    let c = 0;
    habits.forEach((h) => {
      if ((h.history || {})[k] === 'green') c++;
    });
    const lvl = c === 0 ? 0 : Math.min(4, c);
    return scale[lvl];
  });
}

export function monthTicks(): string[] {
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const arr: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push(MON[d.getMonth()]);
  }
  return arr;
}

export interface CalendarCell {
  n: number;
  kind: 'blank' | 'today' | 'green' | 'red' | 'none';
}

/** Current-month calendar grid for one habit. */
export function monthCells(habit: Habit): CalendarCell[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const todayN = now.getDate();
  const first = new Date(y, m, 1).getDay();
  const dim = new Date(y, m + 1, 0).getDate();
  const hist = habit.history || {};
  const specific = (habit.scheduleType || 'specific') !== 'count';
  const cells: CalendarCell[] = [];
  for (let i = 0; i < first; i++) cells.push({ n: 0, kind: 'blank' });
  for (let n = 1; n <= dim; n++) {
    const st = hist[`${y}-${m + 1}-${n}`];
    const dow = new Date(y, m, n).getDay();
    let kind: CalendarCell['kind'] = 'none';
    if (n === todayN) kind = 'today';
    else if (st === 'green') kind = 'green';
    else if (st === 'red') kind = 'red';
    // past scheduled day with no check-in = missed
    else if (n < todayN && specific && (habit.days || []).includes(dow)) kind = 'red';
    cells.push({ n, kind });
  }
  return cells;
}

export function monthLabel(): string {
  const MON = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const now = new Date();
  return `${MON[now.getMonth()]} ${now.getFullYear()}`;
}

export function fmtTime(t: string): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ap = h < 12 ? 'AM' : 'PM';
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
}
