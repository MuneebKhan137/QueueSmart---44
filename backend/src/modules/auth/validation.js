const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// letters (any language), spaces, hyphens, apostrophes and periods
const NAME_RE = /^\p{L}[\p{L}\p{M} '.-]*$/u;
const PHONE_RE = /^\+?[\d\s\-().]+$/;

const LIMITS = { emailMax: 254, nameMax: 50, phoneMax: 20, phoneMinDigits: 7, phoneMaxDigits: 15, passwordMin: 8, passwordMax: 72 };

const validateEmail = (email) => {
  if (email === undefined || email === null || email === "") return "Email is required.";
  if (typeof email !== "string") return "Email must be text.";
  const value = email.trim();
  if (!value) return "Email is required.";
  if (value.length > LIMITS.emailMax) return `Email must be ${LIMITS.emailMax} characters or fewer.`;
  if (!EMAIL_RE.test(value)) return "Enter a valid email address.";
  return "";
};

const validatePassword = (password) => {
  if (password === undefined || password === null || password === "") return "Password is required.";
  if (typeof password !== "string") return "Password must be text.";
  if (password.length < LIMITS.passwordMin) return `Password must be at least ${LIMITS.passwordMin} characters.`;
  if (password.length > LIMITS.passwordMax) return `Password must be ${LIMITS.passwordMax} characters or fewer.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Password needs at least one letter and one number.";
  return "";
};

// firstName and lastName both use this, label is "First name" or "Last name"
const validateName = (name, label = "Name") => {
  if (name === undefined || name === null || name === "") return `${label} is required.`;
  if (typeof name !== "string") return `${label} must be text.`;
  const value = name.trim();
  if (!value) return `${label} is required.`;
  if (value.length > LIMITS.nameMax) return `${label} must be ${LIMITS.nameMax} characters or fewer.`;
  if (!NAME_RE.test(value)) return `${label} can only contain letters, spaces, hyphens and apostrophes.`;
  return "";
};

// phone is optional
const validatePhone = (phone) => {
  if (phone === undefined || phone === null || phone === "") return "";
  if (typeof phone !== "string") return "Phone must be text.";
  const value = phone.trim();
  if (!value) return "";
  if (value.length > LIMITS.phoneMax) return `Phone must be ${LIMITS.phoneMax} characters or fewer.`;
  const digits = value.replace(/\D/g, "").length;
  if (!PHONE_RE.test(value) || digits < LIMITS.phoneMinDigits || digits > LIMITS.phoneMaxDigits) {
    return "Enter a valid phone number.";
  }
  return "";
};

// drops empty messages so the result is {} when everything is valid
const onlyErrors = (fields) => Object.fromEntries(Object.entries(fields).filter(([, message]) => message));

const validateRegister = (body = {}) =>
  onlyErrors({
    firstName: validateName(body.firstName, "First name"),
    lastName: validateName(body.lastName, "Last name"),
    email: validateEmail(body.email),
    password: validatePassword(body.password),
    phone: validatePhone(body.phone),
  });

// login only checks that something sensible was sent, the real check is the credentials
const validateLogin = (body = {}) => {
  const fields = { email: validateEmail(body.email) };
  if (body.password === undefined || body.password === null || body.password === "") {
    fields.password = "Password is required.";
  } else if (typeof body.password !== "string") {
    fields.password = "Password must be text.";
  } else if (body.password.length > LIMITS.passwordMax) {
    fields.password = `Password must be ${LIMITS.passwordMax} characters or fewer.`;
  }
  return onlyErrors(fields);
};

module.exports = { LIMITS, validateEmail, validatePassword, validateName, validatePhone, validateRegister, validateLogin };
