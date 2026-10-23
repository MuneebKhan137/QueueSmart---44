const { store, nextId } = require("../../data/store");
const { badRequest, conflict, unauthorized } = require("../../utils/httpError");
const { validateRegister, validateLogin } = require("./validation");
const { notifyNewSignup } = require("../notifications/notificationService");

// never send the password to the client
const publicUser = ({ id, name, firstName, lastName, email, phone, role }) => ({
  id,
  name,
  firstName,
  lastName,
  email,
  phone,
  role,
});

const normalizeEmail = (email) => email.trim().toLowerCase();

const findByEmail = (email) => store.users.find((user) => user.email.toLowerCase() === normalizeEmail(email));

const register = (body) => {
  const fields = validateRegister(body);
  if (Object.keys(fields).length) throw badRequest("Please fix the highlighted fields.", fields);

  const email = normalizeEmail(body.email);
  if (findByEmail(email)) throw conflict("An account with that email already exists.");

  // role is never taken from the request, new accounts are always regular users
  const firstName = body.firstName.trim();
  const lastName = body.lastName.trim();
  const user = {
    id: nextId("users"),
    // other modules show user.name, so keep the full name there
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    email,
    phone: body.phone?.trim() || "",
    role: "user",
    password: body.password,
  };
  store.users.push(user);
  notifyNewSignup(user.email);

  return publicUser(user);
};

const login = (body) => {
  const fields = validateLogin(body);
  if (Object.keys(fields).length) throw badRequest("Please fix the highlighted fields.", fields);

  const user = findByEmail(body.email);
  // same message for unknown email and wrong password so emails can't be probed
  if (!user || user.password !== body.password) {
    throw unauthorized("Invalid email or password.");
  }
  return publicUser(user);
};

module.exports = { register, login, publicUser };
