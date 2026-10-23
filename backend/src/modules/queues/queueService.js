const { store, nextId } = require("../../data/store");
const { badRequest, notFound, conflict } = require("../../utils/httpError");
const { getService } = require("../services/service");
const { estimateWait } = require("../waitTime/waitTimeService");
const { addHistory } = require("../history/historyService");
const { notifyJoined } = require("../notifications/notificationService");

const priorities = ["low", "medium", "high"];
const priorityRank = { high: 0, medium: 1, low: 2 };

// order: high, medium, low, then first to last joined
const getQueue = (serviceId) =>
  (store.queues[serviceId] || [])
    .filter((e) => e.status === "waiting")
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || a.joinedAt.localeCompare(b.joinedAt));

const getStatus = (position) => (position <= 2 ? "almost ready" : "waiting");

// position
const describeEntry = (entry) => {
  const service = getService(entry.serviceId);
  const position = getQueue(entry.serviceId).indexOf(entry) + 1;
  return {
    entry,
    serviceName: service.name,
    position,
    waitMinutes: estimateWait(position, service.durationMinutes),
    status: getStatus(position),
  };
};

const findWaitingEntry = (userId) =>
  Object.values(store.queues)
    .flat()
    .find((e) => e.userId === userId && e.status === "waiting");

const getMyEntry = (userId) => {
  const entry = findWaitingEntry(userId);
  return entry ? describeEntry(entry) : null;
};

const isPositiveInteger = (value) =>
  (typeof value === "number" && Number.isSafeInteger(value) && value > 0) ||
  (typeof value === "string" && /^[1-9]\d*$/.test(value));

const joinQueue = (userId, { serviceId, priority } = {}) => {
  const fields = {};

  if (serviceId === undefined || serviceId === null || serviceId === "") {
    fields.serviceId = "Pick a service.";
  } else if (!isPositiveInteger(serviceId)) {
    fields.serviceId = "Service id must be a positive integer.";
  }

  const chosenPriority = priority === undefined || priority === null ? "medium" : priority;
  if (!priorities.includes(chosenPriority)) {
    fields.priority = "Priority must be \"low\", \"medium\" or \"high\".";
  }

  if (Object.keys(fields).length > 0) {
    throw badRequest("Couldn't join the queue.", fields);
  }

  const service = getService(serviceId);
  if (!service.isOpen) throw conflict("This service is closed.");
  if (findWaitingEntry(userId)) throw conflict("You're already in a queue.");

  const user = store.users.find((u) => u.id === userId);
  const entry = {
    id: nextId("queues"),
    userId,
    name: user.name,
    serviceId: service.id,
    priority: chosenPriority,
    status: "waiting",
    joinedAt: new Date().toISOString(),
  };

  if (!store.queues[service.id]) store.queues[service.id] = [];
  store.queues[service.id].push(entry);

  const result = describeEntry(entry);
  notifyJoined(userId, service.name, result.position, result.waitMinutes);
  return result;
};

const leaveQueue = (userId) => {
  const entry = findWaitingEntry(userId);
  if (!entry) throw notFound("You're not in a queue.");

  const queue = store.queues[entry.serviceId];
  queue.splice(queue.indexOf(entry), 1);

  const service = getService(entry.serviceId);
  addHistory({ userId, serviceId: entry.serviceId, serviceName: service.name, outcome: "Left queue" });
  return { left: true, serviceName: service.name };
};

const getQueueSummary = (serviceId) => {
  const service = getService(serviceId);

  const waiting = getQueue(service.id).length;
  return {
    serviceId: service.id,
    waiting,
    estimatedWaitMinutes: estimateWait(waiting + 1, service.durationMinutes),
  };
};

module.exports = { getQueue, getStatus, getMyEntry, joinQueue, leaveQueue, getQueueSummary };
