// helpers so seed times are relative to when the server started
const minutesAgo = (mins) => new Date(Date.now() - mins * 60 * 1000).toISOString();
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

// demo logins: admin@queuesmart.com / Admin1234, everyone else / Password1
const seedUsers = [
  { id: 1, name: "Admin", email: "admin@queuesmart.com", role: "admin", password: "Admin1234" },
  { id: 2, name: "Aqeel Somani", email: "aqeel.somani@example.com", role: "user" },
  { id: 3, name: "Diego Cepeda", email: "diego.cepeda@example.com", role: "user" },
  { id: 4, name: "Muneeb Khan", email: "muneeb.khan@example.com", role: "user" },
  { id: 5, name: "Santiago Reyes", email: "santiago.reyes@example.com", role: "user" },
  { id: 6, name: "Demo Student", email: "demo.student@example.com", role: "user" },
].map((user) => ({ password: "Password1", ...user }));

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

// [entry id, user id, joined minutes ago, priority, status]
const seedLines = {
  1: [
    [101, 5, 95, "medium", "served"],
    [102, 4, 80, "medium", "served"],
    [103, 3, 40, "low", "waiting"],
  ],
  2: [
    [201, 2, 110, "high", "served"],
    [202, 3, 100, "high", "served"],
    [203, 6, 75, "high", "served"],
    [204, 4, 35, "medium", "waiting"],
    [205, 5, 25, "medium", "waiting"],
  ],
  3: [
    [301, 2, 70, "low", "served"],
    [302, 6, 50, "low", "served"],
  ],
  4: [
    [401, 4, 120, "medium", "served"],
    [402, 3, 105, "medium", "served"],
    [403, 2, 45, "medium", "waiting"],
    [404, 5, 90, "low", "served"],
    [405, 6, 60, "medium", "served"],
  ],
};

const seedQueues = {};
for (const [serviceId, lines] of Object.entries(seedLines)) {
  seedQueues[serviceId] = lines.map(([id, userId, joinedMinutesAgo, priority, status]) => ({
    id,
    serviceId: Number(serviceId),
    userId,
    name: seedUsers.find((user) => user.id === userId).name,
    email: seedUsers.find((user) => user.id === userId).email,
    priority,
    status,
    joinedAt: minutesAgo(joinedMinutesAgo),
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
  { id: 1, userId: 6, serviceId: 3, serviceName: "ID Card Services", outcome: "Served", date: daysAgo(14) },
  { id: 2, userId: 6, serviceId: 1, serviceName: "Academic Advising", outcome: "Served", date: daysAgo(7) },
  { id: 3, userId: 6, serviceId: 4, serviceName: "Registrar", outcome: "Left queue", date: daysAgo(3) },
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

// last id handed out per collection
let lastIds = {};

const resetStore = () => {
  const fresh = structuredClone(seed);
  for (const key of Object.keys(store)) delete store[key];
  Object.assign(store, fresh);
  lastIds = {};
};

const nextId = (collectionName) => {
  const collection = store[collectionName];
  if (!collection) throw new Error(`Unknown collection: ${collectionName}`);

  const items = Array.isArray(collection) ? collection : Object.values(collection).flat();
  const highest = items.reduce((max, item) => Math.max(max, item.id), 0);
  lastIds[collectionName] = Math.max(highest, lastIds[collectionName] || 0) + 1;
  return lastIds[collectionName];
};

resetStore();

module.exports = { store, resetStore, nextId };
