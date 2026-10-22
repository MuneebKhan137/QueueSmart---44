const express = require("express");
const cors = require("cors");
const { currentUser } = require("./middleware/currentUser");
const { HttpError } = require("./utils/httpError");
const routes = require("./routes");

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use(currentUser);

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

const errorHandler = (err, req, res, next) => {
  if (err instanceof HttpError) {
    const body = { error: err.message };
    if (err.fields) body.fields = err.fields;
    return res.status(err.status).json(body);
  }

  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
};

app.use(errorHandler);

module.exports = app;
