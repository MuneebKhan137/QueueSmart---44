const express = require("express");
const { register, login } = require("./service");

const router = express.Router();

router.post("/register", (req, res) => {
  res.status(201).json({ user: register(req.body ?? {}) });
});

router.post("/login", (req, res) => {
  res.json({ user: login(req.body ?? {}) });
});

module.exports = router;
