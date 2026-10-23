class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    if (fields) this.fields = fields;
  }
}

const badRequest = (message = "Invalid request.", fields) => new HttpError(400, message, fields);
const unauthorized = (message = "You need to be signed in.") => new HttpError(401, message);
const forbidden = (message = "You don't have access to this.") => new HttpError(403, message);
const notFound = (message = "Not found.") => new HttpError(404, message);
const conflict = (message = "That conflicts with existing data.") => new HttpError(409, message);

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict };
