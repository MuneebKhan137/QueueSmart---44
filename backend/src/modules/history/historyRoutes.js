const express = require("express");
const { requireUser } = require("../../middleware/currentUser");
const { getHistory } = require("./historyService");

const router = express.Router();

router.use(requireUser);

router.get("/", (req, res) => {
    res.json({ history: getHistory(req.user.id) })
});

module.exports = router;