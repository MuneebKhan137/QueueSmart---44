// helpers so seed times are relative to when the server started
const minutesAgo = (mins) => new Date(Date.now() - mins * 60 * 1000).toISOString();
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const todayAt = (time) => {
  const [, h, m, ampm] = time.match(/(\d+):(\d+) (AM|PM)/);
  const date = new Date();
  date.setHours((Number(h) % 12) + (ampm === "PM" ? 12 : 0), Number(m), 0, 0);
  return date.toISOString();
};

const seedUsers = [
  { id: 1, name: "Admin", email: "admin@queuesmart.com", role: "admin" },
  { id: 2, name: "Aqeel Somani", email: "aqeel.somani@example.com", role: "user" },
  { id: 3, name: "Diego Cepeda", email: "diego.cepeda@example.com", role: "user" },
  { id: 4, name: "Muneeb Khan", email: "muneeb.khan@example.com", role: "user" },
  { id: 5, name: "Santiago Reyes", email: "santiago.reyes@example.com", role: "user" },
  { id: 6, name: "Demo Student", email: "demo.student@example.com", role: "user" },
];

const seedServices = [
  {
    id: 1,
    name: "Academic Advising",
    description: "Degree planning and course selection with a college advisor.",
    durationMinutes: 15,
    priority: "medium",
    isOpen: true,
  },
  {
    id: 2,
    name: "Financial Aid",
    description: "Help with FAFSA, scholarships, grants and checking your aid status.",
    durationMinutes: 10,
    priority: "high",
    isOpen: true,
  },
  {
    id: 3,
    name: "ID Card Services",
    description: "Get a new student ID card or replace a lost or damaged one.",
    durationMinutes: 5,
    priority: "low",
    isOpen: true,
  },
  {
    id: 4,
    name: "Registrar",
    description: "Transcripts, enrollment verification and registration holds.",
    durationMinutes: 20,
    priority: "medium",
    isOpen: true,
  },
];

// [entry id, user id, joined at, priority, status]
// "almost ready" is now just "waiting"
const seedLines = {
  1: [
    [101, 5, "1:05 PM", "medium", "waiting"],
    [102, 4, "1:09 PM", "medium", "waiting"],
    [103, 3, "1:14 PM", "low", "waiting"],
  ],
  2: [
    [201, 2, "12:58 PM", "high", "served"],
    [202, 3, "1:02 PM", "high", "served"],
    [203, 6, "1:07 PM", "high", "waiting"],
    [204, 4, "1:12 PM", "medium", "waiting"],
    [205, 5, "1:16 PM", "medium", "waiting"],
  ],
  3: [
    [301, 2, "1:10 PM", "low", "waiting"],
    [302, 6, "1:18 PM", "low", "waiting"],
  ],
  4: [
    [401, 4, "12:50 PM", "medium", "served"],
    [402, 3, "12:55 PM", "medium", "waiting"],
    [403, 2, "1:01 PM", "medium", "waiting"],
    [404, 5, "1:06 PM", "low", "waiting"],
    [405, 6, "1:11 PM", "medium", "waiting"],
  ],
};

const seedQueues = {};
for (const [serviceId, lines] of Object.entries(seedLines)) {
  seedQueues[serviceId] = lines.map(([id, userId, joinedAt, priority, status]) => ({
    id,
    serviceId: Number(serviceId),
    userId,
    name: seedUsers.find((user) => user.id === userId).name,
    email: seedUsers.find((user) => user.id === userId).email,
    priority,
    status,
    joinedAt: todayAt(joinedAt),
  }));
}

// audience decides if admins or users see it
const seedNotifications = [
  {
    id: 1,
    audience: "admin",
    type: "signup",
    title: "New signup",
    message: "Demo Student created an account.",
    createdAt: minutesAgo(2),
    read: false,
  },
  {
    id: 2,
    audience: "admin",
    type: "queue_update",
    title: "Queue getting long",
    message: "Registrar now has 5 people in line.",
    createdAt: minutesAgo(9),
    read: true,
  },
  {
    id: 3,
    audience: "user",
    userId: 6,
    type: "queue_update",
    title: "Queue update",
    message: "You're #3 in Financial Aid.",
    createdAt: minutesAgo(4),
    read: false,
  },
  {
    id: 4,
    audience: "user",
    userId: 6,
    type: "status_change",
    title: "Almost your turn",
    message: "Your status in Financial Aid changed to almost ready.",
    createdAt: minutesAgo(6),
    read: true,
  },
];

const seedHistory = [
  { id: 1, userId: 6, serviceId: 3, serviceName: "ID Card Services", outcome: "served", date: daysAgo(14) },
  { id: 2, userId: 6, serviceId: 1, serviceName: "Academic Advising", outcome: "served", date: daysAgo(7) },
  { id: 3, userId: 6, serviceId: 4, serviceName: "Registrar", outcome: "left", date: daysAgo(3) },
];

const seed = {
  users: seedUsers,
  services: seedServices,
  queues: seedQueues,
  notifications: seedNotifications,
  history: seedHistory,
};

// live data
const store = {};

const resetStore = () => {
  const fresh = structuredClone(seed);
  for (const key of Object.keys(store)) delete store[key];
  Object.assign(store, fresh);
};

const nextId = (collectionName) => {
  const collection = store[collectionName];
  if (!collection) throw new Error(`Unknown collection: ${collectionName}`);

  const items = Array.isArray(collection) ? collection : Object.values(collection).flat();
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
};

resetStore();

module.exports = { store, resetStore, nextId };
