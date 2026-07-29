import type { DayStatus, Habit, Place, User } from './types';
import { dateKey } from './analytics';

export const DEMO_USER: User = { name: 'Alex Rivera', email: 'demo@kept.app' };

export const PLACES: Array<Place & { sub: string }> = [
  { name: 'Riverside Track', sub: 'Running trail · 0.4 mi', lat: 37.7694, lng: -122.4862 },
  { name: 'GoldGym - Downtown', sub: 'Fitness center · 1.1 mi', lat: 37.7849, lng: -122.4094 },
  { name: 'Blue Bottle Coffee', sub: 'Café · 0.6 mi', lat: 37.7765, lng: -122.423 },
  { name: 'City Library, 3rd Fl', sub: 'Study space · 0.9 mi', lat: 37.7788, lng: -122.4159 },
  { name: 'Dolores Park', sub: 'Park · 0.7 mi', lat: 37.7596, lng: -122.4269 },
];

function daysBackKey(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateKey(d);
}

// Green on scheduled weekdays over `span` days. Recent `perfect` days are always
// green (strong current streak); older days hit `greenProb`, leaving realistic
// gaps that read as the odd missed day on the heatmap.
function genSpecific(days: number[], span: number, greenProb: number, perfect: number): Record<string, DayStatus> {
  const h: Record<string, DayStatus> = {};
  const today = new Date();
  for (let back = span; back >= 1; back--) {
    const d = new Date(today);
    d.setDate(today.getDate() - back);
    if (!days.includes(d.getDay())) continue;
    if (back <= perfect || Math.random() < greenProb) h[dateKey(d)] = 'green';
  }
  return h;
}

// Count mode: green on a few preferred weekdays each week (~perWeek days/week).
function genCount(preferred: number[], span: number, greenProb: number, perfect: number): Record<string, DayStatus> {
  const h: Record<string, DayStatus> = {};
  const today = new Date();
  for (let back = span; back >= 1; back--) {
    const d = new Date(today);
    d.setDate(today.getDate() - back);
    if (!preferred.includes(d.getDay())) continue;
    if (back <= perfect || Math.random() < greenProb) h[dateKey(d)] = 'green';
  }
  return h;
}

/** Curated, realistic habits with ~10 months of history — for Play Store
 *  screenshots (rich stats + a full GitHub-style heatmap). */
export function sampleHabits(): Habit[] {
  return [
    {
      id: 'h1',
      name: 'Morning Gym',
      place: { name: 'GoldGym - Downtown', lat: 37.7849, lng: -122.4094 },
      scheduleType: 'specific',
      days: [1, 3, 5],
      weeklyTarget: 3,
      start: '06:00',
      end: '08:00',
      radius: 120,
      autoCheck: true,
      reminder: true,
      createdAt: daysBackKey(350),
      history: genSpecific([1, 3, 5], 350, 0.97, 45),
    },
    {
      id: 'h2',
      name: 'Run near the park',
      place: { name: 'Dolores Park', lat: 37.7596, lng: -122.4269 },
      scheduleType: 'specific',
      days: [1, 2, 3, 4, 5, 6],
      weeklyTarget: 6,
      start: '06:30',
      end: '08:30',
      radius: 150,
      autoCheck: true,
      reminder: true,
      createdAt: daysBackKey(350),
      history: genSpecific([1, 2, 3, 4, 5, 6], 350, 0.95, 32),
    },
    {
      id: 'h3',
      name: 'Work from office',
      place: { name: 'Market St Office', lat: 37.7898, lng: -122.4013 },
      scheduleType: 'specific',
      days: [1, 2, 3, 4, 5],
      weeklyTarget: 5,
      start: '09:00',
      end: '18:00',
      radius: 140,
      autoCheck: true,
      reminder: false,
      createdAt: daysBackKey(360),
      history: genSpecific([1, 2, 3, 4, 5], 360, 0.98, 60),
    },
    {
      id: 'h4',
      name: 'Read at the Library',
      place: { name: 'City Library, 3rd Fl', lat: 37.7788, lng: -122.4159 },
      scheduleType: 'count',
      days: [],
      weeklyTarget: 3,
      start: '18:00',
      end: '21:00',
      radius: 100,
      autoCheck: false,
      reminder: true,
      createdAt: daysBackKey(340),
      history: genCount([2, 4, 0], 340, 0.96, 30),
    },
    {
      id: 'h5',
      name: 'Evening Meditation',
      place: { name: 'Mindful Studio', lat: 37.7671, lng: -122.4256 },
      scheduleType: 'count',
      days: [],
      weeklyTarget: 5,
      start: '21:00',
      end: '22:00',
      radius: 100,
      autoCheck: false,
      reminder: true,
      createdAt: daysBackKey(330),
      history: genCount([1, 2, 3, 4, 0], 330, 0.95, 28),
    },
    {
      id: 'h6',
      name: 'Language study',
      place: { name: 'Blue Bottle Coffee', lat: 37.7765, lng: -122.423 },
      scheduleType: 'specific',
      days: [2, 4],
      weeklyTarget: 2,
      start: '08:00',
      end: '09:00',
      radius: 100,
      autoCheck: false,
      reminder: true,
      createdAt: daysBackKey(300),
      history: genSpecific([2, 4], 300, 0.95, 30),
    },
  ];
}

// Initial seed for a fresh install (before sign-in). Same curated set.
export function demoHabits(): Habit[] {
  return sampleHabits();
}
