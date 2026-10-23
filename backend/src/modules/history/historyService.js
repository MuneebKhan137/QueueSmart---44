// placeholder so queues work
// keep the  name but replace inside
const { store, nextId } = require("../../data/store");

const addHistory = ({ userId, serviceId, serviceName, outcome }) => {
  const row = { id: nextId("history"), userId, serviceId, serviceName, outcome, date: new Date().toISOString() };
  store.history.push(row);
  return row;
};

module.exports = { addHistory };
