// placeholder so queues work
// keep the  name but replace inside
const { store } = require("../../data/store");

// the service with that id, or null
const getServiceById = (id) => store.services.find((s) => s.id === Number(id)) || null;

module.exports = { getServiceById };
