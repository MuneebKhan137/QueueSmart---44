// placeholder so queues work
// keep the  name but replace inside
const { store, nextId } = require("../../data/store");

const addHistory = ({ userId, serviceId, serviceName, outcome, entryId }) => {
  const existing = entryId === undefined ? null : store.history.find((row) => row.entryId === entryId);
  if (existing) {
    existing.outcome = outcome;
    existing.date = new Date().toISOString();
    return existing;
  }

  const row = { id: nextId("history"), userId, serviceId, serviceName, outcome, entryId, date: new Date().toISOString() };
  store.history.push(row);
  return row;
};

const getHistory = (userId) =>
  store.history
  .filter((row) => row.userId === userId)
  .sort((a, b) => b.date.localeCompare(a.date));

module.exports = { addHistory, getHistory };
