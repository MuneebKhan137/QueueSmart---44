const { store, nextId } = require("../../data/store");
const { badRequest, notFound, conflict } = require("../../utils/httpError");
const { getService } = require("../services/service");
const { estimateWait } = require("../waitTime/waitTimeService");
const { addHistory } = require("../history/historyService");
const { notifyJoined, notifyServed, notifyAlmostReady, notifyRemoved } = require("../notifications/notificationService");

const priorities = ["low", "medium", "high"];
const priorityRank = { high: 0, medium: 1, low: 2 };
const orderKey = (entry) => entry.orderAt ?? Infinity;

// order: high, medium, low, then first to last joined
const getQueue = (serviceId) =>
  (store.queues[serviceId] || [])
    .filter((e) => e.status === "waiting")
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || orderKey(a) - orderKey(b) || a.joinedAt.localeCompare(b.joinedAt) || a.id - b.id);
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

  addHistory({ userId, serviceId: service.id, serviceName: service.name, outcome: "Waiting", entryId: entry.id });

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
  addHistory({ userId, serviceId: entry.serviceId, serviceName: service.name, outcome: "Left queue", entryId: entry.id });
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

const getQueueDetails = (serviceId) => {
  const service = getService(serviceId);
  return {
    ...getQueueSummary(service.id),
    entries: getQueue(service.id).map(describeEntry),
  };
};

//add the next served person controlled by admin advancing the queue
const serveNext = (serviceId) => {
  const service = getService(serviceId);
  const entry = getQueue(service.id)[0];
  if (!entry) throw conflict("No one waiting for this service.");
  entry.status = "served";
  entry.servedAt = new Date().toISOString();
  addHistory({ userId: entry.userId, serviceId: service.id, serviceName: service.name, outcome: "Served", entryId: entry.id });
  notifyServed(entry.userId, service.name);

  getQueue(service.id)
  .slice(0, 2)
  .forEach((next) => notifyAlmostReady(next.userId, service.name));
  return { servedEntry: entry, ...getQueueDetails(service.id) };
};

const findEntry = (serviceId, entryId) => {
  const service = getService(serviceId);
  const entry = (store.queues[service.id] || []).find(
  (e) => e.id === Number(entryId) && e.status === "waiting"
  );
  if (!entry) throw notFound ("That person isn't waiting in this queue.");
  return { service, entry };
}

const removeEntry = (serviceId, entryId) => {
  const { service, entry } = findEntry(serviceId, entryId);
  const queue = store.queues[service.id];
  queue.splice(queue.indexOf(entry), 1);
  addHistory({
    userId: entry.userId,
    serviceId: service.id,
    serviceName: service.name,
    outcome: "Removed by admin",
    entryId: entry.id,
  });
  notifyRemoved(entry.userId, service.name);
  return getQueueDetails(service.id)
};

const setPriority = (serviceId, entryId, priority) => {
  if (!priorities.includes(priority)) {
    throw badRequest("Priority must be \"low\", \"medium\" or \"high\".", {
      priority: "Priority must be \"low\", \"medium\" or \"high\".",
  });
}
const { service, entry } = findEntry(serviceId, entryId);
entry.priority = priority;
return getQueueDetails(service.id)
};

const moveEntry = (serviceId, entryId, direction) => {
  if (direction !== "up" && direction !== "down") {
    throw badRequest("Direction must be \"up\" or\down\".", { direction: "Direction must be \"up\" or \"down\"." });
  }
    const { service } = findEntry(serviceId, entryId);
    const line = getQueue(service.id);
    const index = line.findIndex((e) => e.id === Number(entryId));
    const target = index + (direction === "up" ? -1 : 1);
    if (target < 0 || target >= line.length) throw conflict ("That person is already at the end of the line.");

    line.forEach((e, i ) => { e.orderAt = i; });

    const entry = line[index];
    const neighbour = line[target];

    entry.priority = neighbour.priority;

    const slot = entry.orderAt;
    entry.orderAt = neighbour.orderAt;
    neighbour.orderAt = slot;

    return getQueueDetails(service.id);
};
module.exports = { getQueue, getStatus, getMyEntry, joinQueue, leaveQueue, getQueueSummary, getQueueDetails, serveNext, removeEntry, setPriority, moveEntry };
