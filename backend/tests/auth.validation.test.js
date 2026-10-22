const {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateRegister,
  validateLogin,
} = require("../src/modules/auth/validation");

describe("validateEmail", () => {
  test.each([undefined, null, "", "   "])("requires a value (%p)", (value) => {
    expect(validateEmail(value)).toBe("Email is required.");
  });

  test("rejects non-strings", () => {
    expect(validateEmail(123)).toBe("Email must be text.");
  });

  test("rejects bad formats", () => {
    expect(validateEmail("nope")).toBe("Enter a valid email address.");
    expect(validateEmail("a@b")).toBe("Enter a valid email address.");
  });

  test("enforces the length limit", () => {
    expect(validateEmail(`${"a".repeat(250)}@x.com`)).toMatch(/254/);
  });

  test("accepts a normal email, even with padding", () => {
    expect(validateEmail("  me@example.com ")).toBe("");
  });
});

describe("validatePassword", () => {
  test("requires a value", () => {
    expect(validatePassword("")).toBe("Password is required.");
    expect(validatePassword(undefined)).toBe("Password is required.");
  });

  test("rejects non-strings", () => {
    expect(validatePassword(12345678)).toBe("Password must be text.");
  });

  test("enforces min and max length", () => {
    expect(validatePassword("abc123")).toMatch(/at least 8/);
    expect(validatePassword("a1".repeat(40))).toMatch(/72/);
  });

  test("needs a letter and a number", () => {
    expect(validatePassword("abcdefgh")).toMatch(/letter and one number/);
    expect(validatePassword("12345678")).toMatch(/letter and one number/);
  });

  test("accepts a good password", () => {
    expect(validatePassword("Password1")).toBe("");
  });
});

describe("validateName", () => {
  test.each([undefined, null, "", "   "])("requires a value (%p)", (value) => {
    expect(validateName(value, "First name")).toBe("First name is required.");
  });

  test("uses a default label", () => {
    expect(validateName("")).toBe("Name is required.");
  });

  test("rejects non-strings and long names", () => {
    expect(validateName(5, "Last name")).toBe("Last name must be text.");
    expect(validateName("x".repeat(51), "Last name")).toMatch(/50/);
  });

  test.each(["John3", "1234", "Jo@n", "Bob_", "-Anna", "<b>x</b>"])("rejects %s", (value) => {
    expect(validateName(value, "First name")).toMatch(/can only contain letters/);
  });

  test.each(["Santiago", "Mary-Jane", "O'Brien", "José", "Anne Marie", "St. John", "李"])("accepts %s", (value) => {
    expect(validateName(value, "First name")).toBe("");
  });
});

describe("validatePhone", () => {
  test.each([undefined, null, "", "   "])("is optional (%p)", (value) => {
    expect(validatePhone(value)).toBe("");
  });

  test("rejects non-strings", () => {
    expect(validatePhone(7135551234)).toBe("Phone must be text.");
  });

  test("enforces the length limit", () => {
    expect(validatePhone("1".repeat(21))).toMatch(/20/);
  });

  test("rejects letters and the wrong number of digits", () => {
    expect(validatePhone("call me maybe")).toBe("Enter a valid phone number.");
    expect(validatePhone("12345")).toBe("Enter a valid phone number.");
    expect(validatePhone("1234567890123456")).toBe("Enter a valid phone number.");
  });

  test.each(["713-555-1234", "(713) 555 1234", "+1 713.555.1234", "7135551234"])("accepts %s", (value) => {
    expect(validatePhone(value)).toBe("");
  });
});

describe("validateRegister", () => {
  test("returns {} for a valid body", () => {
    expect(validateRegister({ firstName: "A", lastName: "B", email: "a@b.com", password: "Password1" })).toEqual({});
  });

  test("collects every field error", () => {
    const fields = validateRegister({ firstName: 1, lastName: "", email: "bad", password: "x", phone: "abc" });
    expect(Object.keys(fields).sort()).toEqual(["email", "firstName", "lastName", "password", "phone"]);
  });

  test("handles a missing body", () => {
    expect(Object.keys(validateRegister())).toEqual(["firstName", "lastName", "email", "password"]);
  });
});

describe("validateLogin", () => {
  test("returns {} for a valid body", () => {
    expect(validateLogin({ email: "a@b.com", password: "whatever" })).toEqual({});
  });

  test("does not enforce password strength", () => {
    expect(validateLogin({ email: "a@b.com", password: "x" })).toEqual({});
  });

  test("flags missing, non-string and oversized passwords", () => {
    expect(validateLogin({ email: "a@b.com" }).password).toBe("Password is required.");
    expect(validateLogin({ email: "a@b.com", password: 1 }).password).toBe("Password must be text.");
    expect(validateLogin({ email: "a@b.com", password: "x".repeat(73) }).password).toMatch(/72/);
  });

  test("flags a bad email and handles a missing body", () => {
    expect(validateLogin({ email: "bad", password: "x" }).email).toBeDefined();
    expect(Object.keys(validateLogin())).toEqual(["email", "password"]);
  });
});
