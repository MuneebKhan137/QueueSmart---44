const { store, nextId } = require('../../data/store');
const { notFound } = require('../../utils/httpError');
const { validateService } = require('./validation');

const findService = id => {
  const numericId = Number(id);
  const service = Number.isSafeInteger(numericId) && numericId > 0
    ? store.services.find(s => s.id === numericId) : null;
  if (!service) throw notFound('Service not found.');
  return service;
};

const listServices = () => store.services;
const getService = id => findService(id);
const createService = body => {
  const values = validateService(body);
  const service = { id: nextId('services'), ...values };
  store.services.push(service);
  store.queues[service.id] = [];
  return service;
};
const updateService = (id, body) => {
  const service = findService(id);
  Object.assign(service, validateService(body, service));
  return service;
};

module.exports = { listServices, getService, createService, updateService };
