const express = require("express");
const { requireUser } = require("../../middleware/currentUser");
const { getMyEntry, joinQueue, leaveQueue, getQueueSummary } = require("./queueService");

const router = express.Router();

router.get("/me", requireUser, (req, res) => {
  res.json(getMyEntry(req.user.id) || { entry: null });
});

router.post("/join", requireUser, (req, res) => {
  res.status(201).json(joinQueue(req.user.id, req.body));
});

router.post("/leave", requireUser, (req, res) => {
  res.json(leaveQueue(req.user.id));
});

// public so the join page can show waits before signing in
router.get("/:serviceId/summary", (req, res) => {
  res.json(getQueueSummary(req.params.serviceId));
});

module.exports = router;
