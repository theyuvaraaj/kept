export type DayStatus = 'green' | 'red';

export type ScheduleType = 'specific' | 'count';

export interface Place {
  name: string;
  lat: number;
  lng: number;
}

export interface Habit {
  id: string;
  name: string;
  place: Place;
  scheduleType: ScheduleType;
  /** Days of week (0=Sun..6=Sat) for 'specific' mode. */
  days: number[];
  /** Target check-ins per week for 'count' mode. */
  weeklyTarget: number;
  start: string; // 'HH:MM'
  end: string; // 'HH:MM'
  radius: number; // metres
  autoCheck: boolean;
  /** Send a local reminder during the window. */
  reminder: boolean;
  /** dateKey the habit was created — nothing before this counts as missed. */
  createdAt?: string;
  /** Epoch ms of the last local change — drives last-write-wins cloud sync. */
  updatedAt?: number;
  /** Soft-delete tombstone so deletions propagate across devices. */
  deleted?: boolean;
  /** Archived habits are hidden from Home + Stats but kept. */
  archived?: boolean;
  /** Map of dateKey -> status. */
  history: Record<string, DayStatus>;
}

export interface User {
  name: string;
  email: string;
}

export interface HeatCell {
  color: string;
  future: boolean;
}

export interface HeatWeek {
  days: HeatCell[];
}
