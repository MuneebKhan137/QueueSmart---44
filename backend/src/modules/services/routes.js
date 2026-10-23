const express = require('express');
const { requireUser, requireAdmin } = require('../../middleware/currentUser');
const { listServices, getService, createService, updateService } = require('./service');
const router = express.Router();

router.get('/', requireUser, (req, res) => {
  res.set('Cache-Control', 'no-store').json({ services: listServices() });
});
router.get('/:id', requireUser, (req, res) => {
  res.set('Cache-Control', 'no-store').json({ service: getService(req.params.id) });
});
router.post('/', requireAdmin, (req, res) => {
  res.status(201).json({ service: createService(req.body) });
});
router.patch('/:id', requireAdmin, (req, res) => {
  res.json({ service: updateService(req.params.id, req.body) });
});

module.exports = router;
