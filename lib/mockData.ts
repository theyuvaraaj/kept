import type { Habit, Place, User } from './types';
import { dateKey } from './analytics';

export const DEMO_USER: User = { name: 'Alex Rivera', email: 'demo@kept.app' };

export const PLACES: Array<Place & { sub: string }> = [
  { name: 'Riverside Track', sub: 'Running trail · 0.4 mi', lat: 37.7694, lng: -122.4862 },
  { name: 'GoldGym — Downtown', sub: 'Fitness center · 1.1 mi', lat: 37.7849, lng: -122.4094 },
  { name: 'Blue Bottle Coffee', sub: 'Café · 0.6 mi', lat: 37.7765, lng: -122.423 },
  { name: 'City Library, 3rd Fl', sub: 'Study space · 0.9 mi', lat: 37.7788, lng: -122.4159 },
  { name: 'Dolores Park', sub: 'Park · 0.7 mi', lat: 37.7596, lng: -122.4269 },
];

/** Seed ~3 weeks of history, with a few misses, so charts look alive. */
function seedHistory(missBacks: number[]): Record<string, 'green' | 'red'> {
  const h: Record<string, 'green' | 'red'> = {};
  const today = new Date();
  const miss = new Set(missBacks);
  for (let back = 20; back >= 1; back--) {
    const d = new Date(today);
    d.setDate(today.getDate() - back);
    h[dateKey(d)] = miss.has(back) ? 'red' : 'green';
  }
  return h;
}

function backKey(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateKey(d);
}

export function demoHabits(): Habit[] {
  return [
    {
      id: 'h1',
      name: 'Morning Run',
      place: { name: 'Riverside Track', lat: 37.7694, lng: -122.4862 },
      scheduleType: 'specific',
      days: [1, 2, 3, 4, 5],
      weeklyTarget: 5,
      start: '06:00',
      end: '09:00',
      radius: 120,
      autoCheck: true,
      reminder: true,
      createdAt: backKey(20),
      history: seedHistory([3, 9, 15]),
    },
    {
      id: 'h2',
      name: 'Read at Library',
      place: { name: 'City Library, 3rd Fl', lat: 37.7788, lng: -122.4159 },
      scheduleType: 'count',
      days: [],
      weeklyTarget: 3,
      start: '18:00',
      end: '21:00',
      radius: 100,
      autoCheck: false,
      reminder: true,
      createdAt: backKey(20),
      history: seedHistory([2, 6, 11]),
    },
  ];
}
