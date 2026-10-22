const express = require("express");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true });
});

router.use("/auth", require("../modules/auth/routes"));

// each module mounts its router here, uncomment yours once it exists

module.exports = router;
