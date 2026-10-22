const { store } = require("../data/store");
const { unauthorized, forbidden } = require("../utils/httpError");

// reads x-user-id and sets req.user to that user, or null if missing or unknown
const currentUser = (req, res, next) => {
  const id = Number(req.get("x-user-id"));
  req.user = store.users.find((user) => user.id === id) || null;
  next();
};

const requireUser = (req, res, next) => {
  if (!req.user) return next(unauthorized());
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user) return next(unauthorized());
  if (req.user.role !== "admin") return next(forbidden("Only admins can do this."));
  next();
};

module.exports = { currentUser, requireUser, requireAdmin };
