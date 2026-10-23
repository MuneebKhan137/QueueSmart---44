const request = require("supertest");
const app = require("../src/app");
const { store, resetStore } = require("../src/data/store");
const {
  listNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  notifyJoined,
  notifyAlmostReady,
  notifyServed,
  notifyNewSignup,
} = require("../src/modules/notifications/notificationService");

const admin = { id: 1, role: "admin" };
const demo = { id: 6, role: "user" };
const diego = { id: 3, role: "user" };

const valid = { audience: "user", userId: 3, type: "queue_update", title: "Hi", message: "Hello there." };

const catchError = (fn) => {
  try {
    fn();
  } catch (err) {
    return err;
  }
  throw new Error("expected an error");
};

beforeEach(() => {
  resetStore();
});

describe("addNotification validation", () => {
  test("adds a valid user notification", () => {
    const n = addNotification(valid);
    expect(n).toMatchObject({ id: 5, audience: "user", userId: 3, type: "queue_update", title: "Hi", message: "Hello there.", read: false });
    expect(new Date(n.createdAt).toISOString()).toBe(n.createdAt);
    expect(store.notifications).toContainEqual(n);
  });

  test("admin notifications don't need or keep a userId", () => {
    const n = addNotification({ ...valid, audience: "admin", userId: undefined });
    expect(n.audience).toBe("admin");
    expect(n).not.toHaveProperty("userId");
  });

  test("trims title and message", () => {
    const n = addNotification({ ...valid, title: "  Hi  ", message: "  Hello.  " });
    expect(n.title).toBe("Hi");
    expect(n.message).toBe("Hello.");
  });

  test("rejects a bad audience", () => {
    const err = catchError(() => addNotification({ ...valid, audience: "everyone" }));
    expect(err.status).toBe(400);
    expect(err.fields.audience).toBeDefined();
  });

  test("rejects a user notification without a userId", () => {
    const err = catchError(() => addNotification({ ...valid, userId: undefined }));
    expect(err.status).toBe(400);
    expect(err.fields.userId).toBe("User is required for a user notification.");
  });

  test("rejects an unknown user", () => {
    const err = catchError(() => addNotification({ ...valid, userId: 999 }));
    expect(err.fields.userId).toBe("That user doesn't exist.");
  });

  test("rejects a bad type", () => {
    const err = catchError(() => addNotification({ ...valid, type: "spam" }));
    expect(err.fields.type).toBeDefined();
  });

  test("rejects an empty or all-spaces title", () => {
    expect(catchError(() => addNotification({ ...valid, title: "" })).fields.title).toBe("Title is required.");
    expect(catchError(() => addNotification({ ...valid, title: "   " })).fields.title).toBe("Title is required.");
    expect(catchError(() => addNotification({ ...valid, title: 42 })).fields.title).toBe("Title is required.");
  });

  test("title can be 100 chars but not 101", () => {
    expect(addNotification({ ...valid, title: "a".repeat(100) }).title).toHaveLength(100);
    const err = catchError(() => addNotification({ ...valid, title: "a".repeat(101) }));
    expect(err.fields.title).toBe("Title must be 100 characters or less.");
  });

  test("rejects an empty message", () => {
    expect(catchError(() => addNotification({ ...valid, message: " " })).fields.message).toBe("Message is required.");
  });

  test("message can be 300 chars but not 301", () => {
    expect(addNotification({ ...valid, message: "a".repeat(300) }).message).toHaveLength(300);
    const err = catchError(() => addNotification({ ...valid, message: "a".repeat(301) }));
    expect(err.fields.message).toBe("Message must be 300 characters or less.");
  });

  test("reports every bad field at once and adds nothing", () => {
    const before = store.notifications.length;
    const err = catchError(() => addNotification());
    expect(Object.keys(err.fields).sort()).toEqual(["audience", "message", "title", "type"]);
    expect(store.notifications).toHaveLength(before);
  });
});

describe("listNotifications", () => {
  test("admin gets only admin notifications, newest first", () => {
    const list = listNotifications("admin", 1);
    expect(list.map((n) => n.id)).toEqual([1, 2]);
  });

  test("user gets only their own, newest first", () => {
    expect(listNotifications("user", 6).map((n) => n.id)).toEqual([3, 4]);
    expect(listNotifications("user", 3)).toEqual([]);
  });

  test("a new notification comes first", () => {
    const n = addNotification({ ...valid, userId: 6 });
    expect(listNotifications("user", 6)[0].id).toBe(n.id);
  });

  test("rejects a bad audience", () => {
    expect(catchError(() => listNotifications("nope", 6)).status).toBe(400);
  });
});

describe("markAsRead", () => {
  test("a user can mark their own", () => {
    expect(markAsRead(3, demo).read).toBe(true);
    expect(store.notifications.find((n) => n.id === 3).read).toBe(true);
  });

  test("a user can't mark someone else's", () => {
    expect(catchError(() => markAsRead(3, diego)).status).toBe(403);
    expect(store.notifications.find((n) => n.id === 3).read).toBe(false);
  });

  test("a user can't mark an admin one", () => {
    expect(catchError(() => markAsRead(1, demo)).status).toBe(403);
  });

  test("an admin can mark admin ones", () => {
    expect(markAsRead(1, admin).read).toBe(true);
  });

  test("404 when it doesn't exist", () => {
    const err = catchError(() => markAsRead(999, demo));
    expect(err.status).toBe(404);
    expect(err.message).toBe("Notification not found.");
  });
});

describe("markAllAsRead", () => {
  test("returns how many changed and only touches that user's", () => {
    addNotification({ ...valid, userId: 6 });
    addNotification({ ...valid, userId: 3 });

    expect(markAllAsRead("user", 6)).toBe(2);
    expect(listNotifications("user", 6).every((n) => n.read)).toBe(true);
    expect(listNotifications("user", 3)[0].read).toBe(false);
    expect(markAllAsRead("user", 6)).toBe(0);
  });

  test("admin marks all admin ones", () => {
    expect(markAllAsRead("admin", 1)).toBe(1);
  });

  test("rejects a bad audience", () => {
    expect(catchError(() => markAllAsRead("nope", 6)).status).toBe(400);
  });
});

describe("trigger helpers", () => {
  test("notifyJoined", () => {
    expect(notifyJoined(3, "Registrar", 4, 30)).toMatchObject({
      audience: "user",
      userId: 3,
      type: "queue_update",
      title: "You joined the queue",
      message: "You're #4 in line for Registrar, about 30 min wait.",
    });
  });

  test("notifyJoined uses you're next wording at position 1", () => {
    expect(notifyJoined(3, "Registrar", 1, 0).message).toBe("You're next in line for Registrar.");
  });

  test("notifyAlmostReady", () => {
    expect(notifyAlmostReady(3, "Financial Aid")).toMatchObject({
      audience: "user",
      userId: 3,
      type: "status_change",
      title: "Almost your turn",
      message: "Head over to Financial Aid, you're almost up.",
    });
  });

  test("notifyServed", () => {
    expect(notifyServed(3, "Financial Aid")).toMatchObject({
      audience: "user",
      userId: 3,
      type: "status_change",
      title: "You've been served",
      message: "Thanks for visiting Financial Aid.",
    });
  });

  test("notifyNewSignup", () => {
    const n = notifyNewSignup("new.person@example.com");
    expect(n).toMatchObject({
      audience: "admin",
      type: "signup",
      title: "New user signed up",
      message: "new.person@example.com just created an account.",
    });
    expect(n).not.toHaveProperty("userId");
  });
});

describe("notification routes", () => {
  const as = (id, req) => req.set("x-user-id", String(id));

  test("401 without x-user-id", async () => {
    const res = await request(app).get("/api/notifications?audience=user");
    expect(res.status).toBe(401);
  });

  test("400 for a missing or bad audience", async () => {
    const missing = await as(6, request(app).get("/api/notifications"));
    const bad = await as(6, request(app).get("/api/notifications?audience=everyone"));
    expect(missing.status).toBe(400);
    expect(bad.status).toBe(400);
    expect(bad.body.fields.audience).toBeDefined();
  });

  test("403 when a normal user asks for admin", async () => {
    const res = await as(6, request(app).get("/api/notifications?audience=admin"));
    expect(res.status).toBe(403);
  });

  test("user gets their own list", async () => {
    const res = await as(6, request(app).get("/api/notifications?audience=user"));
    expect(res.status).toBe(200);
    expect(res.body.notifications.map((n) => n.id)).toEqual([3, 4]);
  });

  test("admin gets the admin list", async () => {
    const res = await as(1, request(app).get("/api/notifications?audience=admin"));
    expect(res.status).toBe(200);
    expect(res.body.notifications.map((n) => n.id)).toEqual([1, 2]);
  });

  test("mark one as read", async () => {
    const res = await as(6, request(app).patch("/api/notifications/3/read"));
    expect(res.status).toBe(200);
    expect(res.body.notification).toMatchObject({ id: 3, read: true });
  });

  test("mark read rejects a bad id, someone else's and a missing one", async () => {
    expect((await as(6, request(app).patch("/api/notifications/abc/read"))).status).toBe(400);
    expect((await as(6, request(app).patch("/api/notifications/0/read"))).status).toBe(400);
    expect((await as(3, request(app).patch("/api/notifications/3/read"))).status).toBe(403);
    expect((await as(6, request(app).patch("/api/notifications/999/read"))).status).toBe(404);
  });

  test("mark all as read", async () => {
    const res = await as(6, request(app).patch("/api/notifications/read-all?audience=user"));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ updated: 1 });

    const list = await as(6, request(app).get("/api/notifications?audience=user"));
    expect(list.body.notifications.every((n) => n.read)).toBe(true);
  });

  test("mark all as read checks the audience too", async () => {
    expect((await as(6, request(app).patch("/api/notifications/read-all"))).status).toBe(400);
    expect((await as(6, request(app).patch("/api/notifications/read-all?audience=admin"))).status).toBe(403);
    expect((await as(1, request(app).patch("/api/notifications/read-all?audience=admin"))).body).toEqual({ updated: 1 });
  });
});
