const bcrypt = require("bcryptjs");
const { query, withTransaction, resetTestDb } = require("../src/db/db");
const { demoPasswords } = require("../src/db/seed");

const count = async (table) => (await query(`SELECT COUNT(*)::int AS n FROM ${table}`)).rows[0].n;

beforeEach(async () => {
  await resetTestDb();
});

describe("seed", () => {
  // same numbers as src/data/store.js
  test.each([
    ["user_credentials", 6],
    ["user_profiles", 6],
    ["services", 4],
    ["queues", 4],
    ["queue_entries", 15],
    ["notifications", 4],
    ["queue_history", 3],
  ])("%s has %i rows", async (table, expected) => {
    expect(await count(table)).toBe(expected);
  });

  test("passwords are bcrypt hashes of the store.js logins, never plain text", async () => {
    expect(demoPasswords).toEqual({ admin: "Admin1234", user: "Password1" });
    const { rows } = await query("SELECT role, password_hash FROM user_credentials");
    for (const { role, password_hash: hash } of rows) {
      const other = role === "admin" ? demoPasswords.user : demoPasswords.admin;
      expect(hash).toMatch(/^\$2[aby]\$10\$.{53}$/);
      expect(hash).not.toContain(demoPasswords[role]);
      expect(await bcrypt.compare(demoPasswords[role], hash)).toBe(true);
      expect(await bcrypt.compare(other, hash)).toBe(false);
    }
  });

  test("keeps the store.js ids and roles", async () => {
    const { rows } = await query("SELECT id, email, role FROM user_credentials ORDER BY id");
    expect(rows.map((r) => r.id)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(rows[0]).toMatchObject({ email: "admin@queuesmart.com", role: "admin" });
    expect(rows.slice(1).every((r) => r.role === "user")).toBe(true);
  });

  test("one profile per user with the full name and empty preferences", async () => {
    const { rows } = await query("SELECT * FROM user_profiles WHERE user_id = 3");
    expect(rows[0]).toMatchObject({ email: "diego.cepeda@example.com", full_name: "Diego Cepeda", phone: null, preferences: {} });
  });

  test("one open queue per service with the same id", async () => {
    const { rows } = await query("SELECT id, service_id, status FROM queues ORDER BY id");
    expect(rows).toEqual([1, 2, 3, 4].map((id) => ({ id, service_id: id, status: "open" })));
  });

  const positionsIn = async (queueId) =>
    (await query("SELECT id, position FROM queue_entries WHERE queue_id = $1 ORDER BY position", [queueId])).rows.map((r) => [r.position, r.id]);

  test("waiting entries are 1..n by priority then join time, served ones come after", async () => {
    expect(await positionsIn(4)).toEqual([[1, 403], [2, 401], [3, 402], [4, 405], [5, 404]]);
    expect(await positionsIn(2)).toEqual([[1, 204], [2, 205], [3, 201], [4, 202], [5, 203]]);
    expect(await positionsIn(1)).toEqual([[1, 103], [2, 101], [3, 102]]);
  });

  test("a queue with nobody waiting still numbers its served entries from 1", async () => {
    expect(await positionsIn(3)).toEqual([[1, 301], [2, 302]]);
  });

  test("in every queue the waiting entries hold exactly positions 1..n", async () => {
    const { rows } = await query("SELECT queue_id, position, status FROM queue_entries ORDER BY queue_id, position");
    for (const queueId of [1, 2, 3, 4]) {
      const line = rows.filter((r) => r.queue_id === queueId);
      const waiting = line.filter((r) => r.status === "waiting").map((r) => r.position);
      expect(waiting).toEqual(waiting.map((_, i) => i + 1));
      expect(line.map((r) => r.position)).toEqual(line.map((_, i) => i + 1));
    }
  });

  test("each user waits in one queue at most", async () => {
    const { rows } = await query("SELECT user_id FROM queue_entries WHERE status = 'waiting' ORDER BY user_id");
    expect(rows.map((r) => r.user_id)).toEqual([2, 3, 4, 5]);
  });

  test("read notifications are seeded as viewed", async () => {
    const { rows } = await query("SELECT id, status FROM notifications ORDER BY id");
    expect(rows.map((r) => r.status)).toEqual(["sent", "viewed", "sent", "viewed"]);
  });

  test("sequences continue after the seeded ids", async () => {
    const insert = async (sql, params) => (await query(sql, params)).rows[0].id;
    expect(await insert("INSERT INTO user_credentials (email, password_hash) VALUES ($1, 'x') RETURNING id", ["new@example.com"])).toBe(7);
    expect(await insert("INSERT INTO services (name, description, duration_minutes) VALUES ('New', 'd', 5) RETURNING id")).toBe(5);
    expect(await insert("INSERT INTO queue_entries (queue_id, user_id, position) VALUES (3, 6, 3) RETURNING id")).toBe(406);
    expect(await insert("INSERT INTO notifications (audience, type, title, message) VALUES ('admin', 'signup', 't', 'm') RETURNING id")).toBe(5);
    expect(await insert("INSERT INTO queue_history (user_id, service_name, outcome) VALUES (6, 'X', 'Served') RETURNING id")).toBe(4);
  });
});

describe("constraints", () => {
  const rejects = (sql, params) => expect(query(sql, params)).rejects.toThrow();

  const insertUser = (email, role = "user") =>
    query("INSERT INTO user_credentials (email, password_hash, role) VALUES ($1, 'x', $2)", [email, role]);
  const insertService = (duration, priority = "medium") =>
    query("INSERT INTO services (name, description, duration_minutes, priority) VALUES ('Test', 'd', $1, $2)", [duration, priority]);
  const insertEntry = ({ queueId = 3, userId = 6, status = "waiting", priority = "medium" } = {}) =>
    query("INSERT INTO queue_entries (queue_id, user_id, position, status, priority) VALUES ($1, $2, 9, $3, $4)", [queueId, userId, status, priority]);
  const insertNotification = ({ audience = "admin", userId = null, title = "Title" } = {}) =>
    query("INSERT INTO notifications (audience, user_id, type, title, message) VALUES ($1, $2, 'signup', $3, 'm')", [audience, userId, title]);

  test("unique email", async () => {
    await expect(insertUser("admin@queuesmart.com")).rejects.toThrow();
    await expect(insertUser("fresh@example.com")).resolves.toBeDefined();
  });

  test("role must be user or admin", async () => {
    await expect(insertUser("boss@example.com", "boss")).rejects.toThrow();
  });

  test("required fields", async () => {
    await rejects("INSERT INTO user_credentials (email) VALUES ('nohash@example.com')");
    await rejects("INSERT INTO services (name, duration_minutes) VALUES ('No description', 5)");
  });

  test("email over 254 characters", async () => {
    await expect(insertUser(`${"a".repeat(250)}@x.com`)).rejects.toThrow();
  });

  test.each([0, 481])("duration %i is out of range", async (duration) => {
    await expect(insertService(duration)).rejects.toThrow();
  });

  test("duration 1 and 480 are allowed", async () => {
    await expect(insertService(1)).resolves.toBeDefined();
    await expect(query("INSERT INTO services (name, description, duration_minutes) VALUES ('Long', 'd', 480)")).resolves.toBeDefined();
  });

  test("priority must be low, medium or high", async () => {
    await expect(insertService(5, "urgent")).rejects.toThrow();
    await expect(insertEntry({ priority: "urgent" })).rejects.toThrow();
  });

  test("queue status must be open or closed", async () => {
    await rejects("UPDATE queues SET status = 'paused' WHERE id = 1");
  });

  test("entry status must be waiting, served or canceled", async () => {
    await expect(insertEntry({ status: "left" })).rejects.toThrow();
    await expect(insertEntry({ status: "canceled" })).resolves.toBeDefined();
  });

  test("position must be positive", async () => {
    await rejects("INSERT INTO queue_entries (queue_id, user_id, position) VALUES (3, 6, 0)");
  });

  test("a user can only have one waiting entry", async () => {
    // user 3 is already waiting in queue 1
    await expect(insertEntry({ queueId: 2, userId: 3 })).rejects.toThrow();
    await expect(insertEntry({ queueId: 2, userId: 3, status: "served" })).resolves.toBeDefined();
  });

  test("a user can wait again once their entry is served", async () => {
    await query("UPDATE queue_entries SET status = 'served' WHERE id = 103");
    await expect(insertEntry({ queueId: 2, userId: 3 })).resolves.toBeDefined();
  });

  test("queue entry needs a real user and queue", async () => {
    await expect(insertEntry({ userId: 999 })).rejects.toThrow();
    await expect(insertEntry({ queueId: 999 })).rejects.toThrow();
  });

  test("a user notification needs a user_id, an admin one doesn't", async () => {
    await expect(insertNotification({ audience: "user" })).rejects.toThrow();
    await expect(insertNotification({ audience: "user", userId: 6 })).resolves.toBeDefined();
    await expect(insertNotification()).resolves.toBeDefined();
  });

  test("notification title over 100 characters", async () => {
    await expect(insertNotification({ title: "x".repeat(101) })).rejects.toThrow();
    await expect(insertNotification({ title: "x".repeat(100) })).resolves.toBeDefined();
  });

  test("deleting a user cascades to their rows", async () => {
    await query("DELETE FROM user_credentials WHERE id = 6");
    expect(await count("user_profiles")).toBe(5);
    expect((await query("SELECT * FROM notifications WHERE user_id = 6")).rowCount).toBe(0);
    expect((await query("SELECT * FROM queue_history WHERE user_id = 6")).rowCount).toBe(0);
  });
});

describe("withTransaction", () => {
  test("commits and returns the callback result", async () => {
    const id = await withTransaction(async (client) => {
      const { rows } = await client.query("INSERT INTO services (name, description, duration_minutes) VALUES ('Tx', 'd', 5) RETURNING id");
      return rows[0].id;
    });
    expect(id).toBe(5);
    expect(await count("services")).toBe(5);
  });

  test("rolls back when the callback throws", async () => {
    await expect(withTransaction(async (client) => {
      await client.query("INSERT INTO services (name, description, duration_minutes) VALUES ('Tx', 'd', 5)");
      await client.query("UPDATE queues SET status = 'closed' WHERE id = 1");
      throw new Error("boom");
    })).rejects.toThrow("boom");

    expect(await count("services")).toBe(4);
    expect((await query("SELECT status FROM queues WHERE id = 1")).rows[0].status).toBe("open");
  });

  test("rolls back when a statement breaks a constraint", async () => {
    await expect(withTransaction(async (client) => {
      await client.query("INSERT INTO services (name, description, duration_minutes) VALUES ('Tx', 'd', 5)");
      await client.query("INSERT INTO services (name, description, duration_minutes) VALUES ('Bad', 'd', 0)");
    })).rejects.toThrow();
    expect(await count("services")).toBe(4);
  });
});

describe("resetTestDb", () => {
  test("puts changed data back and restarts ids", async () => {
    await query("DELETE FROM queue_entries");
    await query("UPDATE services SET name = 'Changed' WHERE id = 1");
    await query("INSERT INTO user_credentials (email, password_hash) VALUES ('temp@example.com', 'x')");

    await resetTestDb();

    expect(await count("queue_entries")).toBe(15);
    expect(await count("user_credentials")).toBe(6);
    expect((await query("SELECT name FROM services WHERE id = 1")).rows[0].name).toBe("Academic Advising");
    const { rows } = await query("INSERT INTO user_credentials (email, password_hash) VALUES ('again@example.com', 'x') RETURNING id");
    expect(rows[0].id).toBe(7);
  });
});

describe("outside test mode", () => {
  const savedEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...savedEnv };
    jest.resetModules();
    jest.dontMock("pg");
  });

  const client = { query: jest.fn(), release: jest.fn() };
  const pool = { query: jest.fn(), connect: jest.fn(async () => client), end: jest.fn() };

  const loadRealDb = () => {
    process.env.NODE_ENV = "development";
    client.query.mockReset();
    client.release.mockReset();
    const Pool = jest.fn(() => pool);
    jest.doMock("pg", () => ({ Pool }));
    let db;
    jest.isolateModules(() => {
      db = require("../src/db/db");
    });
    return { db, Pool };
  };

  test("throws a clear error when DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL;
    expect(loadRealDb).toThrow("DATABASE_URL is not set");
  });

  test("builds a pg pool with ssl for supabase", () => {
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/fake";
    const { Pool } = loadRealDb();
    expect(Pool).toHaveBeenCalledWith({ connectionString: "postgres://user:pass@localhost:5432/fake", ssl: { rejectUnauthorized: false } });
  });

  test("resetTestDb refuses to run", async () => {
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/fake";
    const { db } = loadRealDb();
    await expect(db.resetTestDb()).rejects.toThrow("only runs when NODE_ENV is \"test\"");
  });

  test("withTransaction sends BEGIN, COMMIT and ROLLBACK on the real pool", async () => {
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/fake";
    const { db } = loadRealDb();

    await expect(db.withTransaction(async () => "done")).resolves.toBe("done");
    expect(client.query.mock.calls.map(([sql]) => sql)).toEqual(["BEGIN", "COMMIT"]);

    client.query.mockClear();
    await expect(db.withTransaction(async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    expect(client.query.mock.calls.map(([sql]) => sql)).toEqual(["BEGIN", "ROLLBACK"]);
    expect(client.release).toHaveBeenCalledTimes(2);
  });

  test("closeDb ends the pool", async () => {
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/fake";
    const { db } = loadRealDb();
    await db.closeDb();
    expect(pool.end).toHaveBeenCalled();
  });
});