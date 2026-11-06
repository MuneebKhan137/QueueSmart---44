const bcrypt = require("bcryptjs");

// same demo data and logins as src/data/store.js, ids kept the same
const demoPasswords = { admin: "Admin1234", user: "Password1" };
const bcryptRounds = 10;

const users = [
  { id: 1, name: "Admin", email: "admin@queuesmart.com", role: "admin" },
  { id: 2, name: "Aqeel Somani", email: "aqeel.somani@example.com", role: "user" },
  { id: 3, name: "Diego Cepeda", email: "diego.cepeda@example.com", role: "user" },
  { id: 4, name: "Muneeb Khan", email: "muneeb.khan@example.com", role: "user" },
  { id: 5, name: "Santiago Reyes", email: "santiago.reyes@example.com", role: "user" },
  { id: 6, name: "Demo Student", email: "demo.student@example.com", role: "user" },
];

const services = [
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

// service id -> [entry id, user id, joined minutes ago, priority, status]
const lines = {
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

const notifications = [
  [1, "admin", null, "signup", "New signup", "Demo Student created an account.", 2, false],
  [2, "admin", null, "queue_update", "Queue getting long", "Registrar now has 5 people in line.", 9, true],
  [3, "user", 6, "queue_update", "Queue update", "You're #3 in Financial Aid.", 4, false],
  [4, "user", 6, "status_change", "Almost your turn", "Your status in Financial Aid changed to almost ready.", 6, true],
];

const history = [
  [1, 6, 3, "ID Card Services", "Served", 14],
  [2, 6, 1, "Academic Advising", "Served", 7],
  [3, 6, 4, "Registrar", "Left queue", 3],
];

// tables with an id sequence
const sequenceTables = ["user_credentials", "services", "queues", "queue_entries", "notifications", "queue_history"];

const priorityRank = { high: 0, medium: 1, low: 2 };

const resetSequences = async (query) => {
  for (const table of sequenceTables) {
    await query(`SELECT setval('${table}_id_seq', COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`);
  }
};

const seed = async (query) => {
  const now = Date.now();
  const minutesAgo = (mins) => new Date(now - mins * 60 * 1000);
  const daysAgo = (days) => new Date(now - days * 24 * 60 * 60 * 1000);

  for (const user of users) {
    const hash = await bcrypt.hash(demoPasswords[user.role], bcryptRounds);
    await query(
      "INSERT INTO user_credentials (id, email, password_hash, role) VALUES ($1, $2, $3, $4)",
      [user.id, user.email, hash, user.role]
    );
  }

  for (const user of users) {
    await query(
      "INSERT INTO user_profiles (user_id, email, full_name) VALUES ($1, $2, $3)",
      [user.id, user.email, user.name]
    );
  }

  for (const service of services) {
    await query(
      "INSERT INTO services (id, name, description, duration_minutes, priority) VALUES ($1, $2, $3, $4, $5)",
      [service.id, service.name, service.description, service.durationMinutes, service.priority]
    );
    // one queue per service
    await query(
      "INSERT INTO queues (id, service_id, status) VALUES ($1, $2, $3)",
      [service.id, service.id, service.isOpen ? "open" : "closed"]
    );
  }

  for (const [serviceId, entries] of Object.entries(lines)) {
    const isDone = (entry) => (entry[4] === "waiting" ? 0 : 1);
    const ordered = [...entries].sort((a, b) => isDone(a) - isDone(b) || priorityRank[a[3]] - priorityRank[b[3]] || b[2] - a[2]);
    for (const [index, [id, userId, joinedMinutesAgo, priority, status]] of ordered.entries()) {
      await query(
        "INSERT INTO queue_entries (id, queue_id, user_id, position, priority, join_time, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [id, Number(serviceId), userId, index + 1, priority, minutesAgo(joinedMinutesAgo), status]
      );
    }
  }

  for (const [id, audience, userId, type, title, message, mins, read] of notifications) {
    await query(
      "INSERT INTO notifications (id, user_id, audience, type, title, message, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [id, userId, audience, type, title, message, read ? "viewed" : "sent", minutesAgo(mins)]
    );
  }

  for (const [id, userId, serviceId, serviceName, outcome, days] of history) {
    await query(
      "INSERT INTO queue_history (id, user_id, service_id, service_name, outcome, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, userId, serviceId, serviceName, outcome, daysAgo(days)]
    );
  }

  await resetSequences(query);
};

module.exports = { seed, resetSequences, demoPasswords, sequenceTables };