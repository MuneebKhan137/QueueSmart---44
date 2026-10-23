const { store, nextId } = require("../../data/store");
const { badRequest, forbidden, notFound } = require("../../utils/httpError");

const audiences = ["admin", "user"];
const types = ["signup", "queue_update", "status_change"];
const maxTitle = 100;
const maxMessage = 300;

const isNonEmptyString = (value) => typeof value === "string" && value.trim() !== "";

const checkAudience = (audience) => {
  if (!audiences.includes(audience)) {
    throw badRequest("Audience must be \"admin\" or \"user\".", { audience: "Audience must be \"admin\" or \"user\"." });
  }
};

// admins see every admin notif
const belongsTo = (n, audience, userId) =>
  n.audience === audience && (audience === "admin" || n.userId === userId);

// newest first
const listNotifications = (audience, userId) => {
  checkAudience(audience);
  return store.notifications
    .filter((n) => belongsTo(n, audience, userId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
};

const addNotification = ({ audience, userId, type, title, message } = {}) => {
  const fields = {};

  if (!audiences.includes(audience)) {
    fields.audience = "Audience must be \"admin\" or \"user\".";
  }

  if (audience === "user") {
    if (userId === undefined || userId === null || userId === "") {
      fields.userId = "User is required for a user notification.";
    } else if (!store.users.some((u) => u.id === Number(userId))) {
      fields.userId = "That user doesn't exist.";
    }
  }

  if (!types.includes(type)) {
    fields.type = "Type must be \"signup\", \"queue_update\" or \"status_change\".";
  }

  if (!isNonEmptyString(title)) {
    fields.title = "Title is required.";
  } else if (title.trim().length > maxTitle) {
    fields.title = `Title must be ${maxTitle} characters or less.`;
  }

  if (!isNonEmptyString(message)) {
    fields.message = "Message is required.";
  } else if (message.trim().length > maxMessage) {
    fields.message = `Message must be ${maxMessage} characters or less.`;
  }

  if (Object.keys(fields).length > 0) {
    throw badRequest("Notification is not valid.", fields);
  }

  const notification = {
    id: nextId("notifications"),
    audience,
    ...(audience === "user" && { userId: Number(userId) }),
    type,
    title: title.trim(),
    message: message.trim(),
    createdAt: new Date().toISOString(),
    read: false,
  };

  store.notifications.push(notification);
  return notification;
};

const markAsRead = (id, requester) => {
  const notification = store.notifications.find((n) => n.id === Number(id));
  if (!notification) throw notFound("Notification not found.");

  const allowed = notification.audience === "admin"
    ? requester.role === "admin"
    : notification.userId === requester.id;
  if (!allowed) throw forbidden("You can only mark your own notifications as read.");

  notification.read = true;
  return notification;
};

// how many unread to read
const markAllAsRead = (audience, userId) => {
  checkAudience(audience);
  let changed = 0;
  for (const n of store.notifications) {
    if (belongsTo(n, audience, userId) && !n.read) {
      n.read = true;
      changed += 1;
    }
  }
  return changed;
};

// trigger helpers

const notifyJoined = (userId, serviceName, position, waitMinutes) =>
  addNotification({
    audience: "user",
    userId,
    type: "queue_update",
    title: "You joined the queue",
    message: position === 1
      ? `You're next in line for ${serviceName}.`
      : `You're #${position} in line for ${serviceName}, about ${waitMinutes} min wait.`,
  });

const notifyAlmostReady = (userId, serviceName) =>
  addNotification({
    audience: "user",
    userId,
    type: "status_change",
    title: "Almost your turn",
    message: `Head over to ${serviceName}, you're almost up.`,
  });

const notifyServed = (userId, serviceName) =>
  addNotification({
    audience: "user",
    userId,
    type: "status_change",
    title: "You've been served",
    message: `Thanks for visiting ${serviceName}.`,
  });

const notifyNewSignup = (email) =>
  addNotification({
    audience: "admin",
    type: "signup",
    title: "New user signed up",
    message: `${email} just created an account.`,
  });

const notifyRemoved = (userId, serviceName) =>
  addNotification({
    audience: "user",
    userId,
    type: "status_change",
    title: "Removed from the queue",
    message: `An admin removed you from the ${serviceName} queue.`,
  });

module.exports = {
  listNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  notifyJoined,
  notifyAlmostReady,
  notifyServed,
  notifyNewSignup,
  notifyRemoved,
};
