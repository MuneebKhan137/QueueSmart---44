// tiny front-end store for the signed-in user's queue activity (assignment 2 only)
// replaced by API calls in assignment 3
import { initialQueues } from './data/mockData';

const ENTRY_KEY = 'queuesmart.entry';
const HISTORY_KEY = 'queuesmart.history';

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable, state just won't persist */
  }
};

export function queueStats(service) {
  const waiting = (initialQueues[service.id] || []).filter((p) => p.status !== 'served').length;
  return { waiting, waitMinutes: waiting * service.durationMinutes };
}

export const getEntry = () => read(ENTRY_KEY, null);

export function joinQueue(service) {
  const { waiting } = queueStats(service);
  const entry = {
    serviceId: service.id,
    serviceName: service.name,
    token: 100 + Math.floor(Math.random() * 900),
    position: waiting + 1,
    durationMinutes: service.durationMinutes,
    joinedAt: new Date().toISOString(),
  };
  write(ENTRY_KEY, entry);
  return entry;
}

export function updatePosition(position) {
  const entry = getEntry();
  if (!entry) return null;
  const next = { ...entry, position };
  write(ENTRY_KEY, next);
  return next;
}

// moves the active entry into history with the given outcome ("Served" or "Left queue")
export function finishEntry(outcome) {
  const entry = getEntry();
  if (!entry) return;
  write(HISTORY_KEY, [
    { id: Date.now(), date: new Date().toISOString(), serviceName: entry.serviceName, outcome },
    ...getHistory(),
  ]);
  localStorage.removeItem(ENTRY_KEY);
}

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const seed = [
  { id: 1, date: daysAgo(3), serviceName: 'Financial Aid', outcome: 'Served' },
  { id: 2, date: daysAgo(9), serviceName: 'ID Card Services', outcome: 'Served' },
  { id: 3, date: daysAgo(15), serviceName: 'Registrar', outcome: 'Left queue' },
];
export const getHistory = () => read(HISTORY_KEY, seed);

// waiting / almost ready / served, same wording as the admin queue
export function statusFor(position) {
  if (position <= 0) return 'served';
  if (position <= 2) return 'almost ready';
  return 'waiting';
}
