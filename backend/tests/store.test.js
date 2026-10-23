const { store, resetStore, nextId } = require("../src/data/store");

beforeEach(() => {
  resetStore();
});

describe("store", () => {
  test("seeds every collection", () => {
    expect(store.users).toHaveLength(6);
    expect(store.services).toHaveLength(4);
    expect(Object.keys(store.queues)).toEqual(["1", "2", "3", "4"]);
    expect(store.notifications).toHaveLength(4);
    expect(store.history.length).toBeGreaterThan(0);
  });

  test("resetStore undoes a change", () => {
    store.users.push({ id: 99, name: "Temp", email: "temp@example.com", role: "user" });
    store.services[0].name = "Changed";
    store.queues[1].pop();

    resetStore();

    expect(store.users).toHaveLength(6);
    expect(store.services[0].name).toBe("Academic Advising");
    expect(store.queues[1]).toHaveLength(3);
  });

  test("resetStore keeps the same store object so requires stay valid", () => {
    const before = store;
    resetStore();
    expect(require("../src/data/store").store).toBe(before);
  });

  test("nextId gives the next free id", () => {
    expect(nextId("users")).toBe(7);
    expect(nextId("notifications")).toBe(5);

    store.users.push({ id: 7, name: "New", email: "new@example.com", role: "user" });
    expect(nextId("users")).toBe(8);
  });

  test("nextId looks across every queue", () => {
    expect(nextId("queues")).toBe(406);
  });

  test("nextId throws for an unknown collection", () => {
    expect(() => nextId("nope")).toThrow("Unknown collection: nope");
  });

  test("every queue entry points to a real user and its own service", () => {
    const userIds = store.users.map((u) => u.id);
    for (const [serviceId, entries] of Object.entries(store.queues)) {
      for (const entry of entries) {
        expect(userIds).toContain(entry.userId);
        expect(entry.serviceId).toBe(Number(serviceId));
        expect(["waiting", "served"]).toContain(entry.status);
        expect(new Date(entry.joinedAt).toISOString()).toBe(entry.joinedAt);
      }
    }
  });

  test("each user waits in one queue at most, demo student in none", () => {
    const waiting = Object.values(store.queues).flat().filter((e) => e.status === "waiting");
    const userIds = waiting.map((e) => e.userId);
    expect(new Set(userIds).size).toBe(userIds.length);
    expect(userIds).not.toContain(6);
  });

  test("seed joinedAt times are never in the future", () => {
    const now = Date.now();
    Object.values(store.queues).flat().forEach((e) => {
      expect(new Date(e.joinedAt).getTime()).toBeLessThanOrEqual(now);
    });
  });

  test("every user notification has a userId", () => {
    const userNotes = store.notifications.filter((n) => n.audience === "user");
    expect(userNotes.length).toBeGreaterThan(0);
    userNotes.forEach((n) => expect(n.userId).toBe(6));
  });
});
