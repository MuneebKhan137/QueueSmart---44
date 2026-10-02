import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { validateEmail } from "../validation";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (values) => ({
    email: validateEmail(values.email),
    password: values.password ? "" : "Password is required.",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setErrors((er) => ({ ...er, [name]: validate(form)[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    const errs = validate(form);
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    try {
      // TODO: replace with the real backend call once endpoints are confirmed
      // const res = await fetch("/api/auth/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      // });
      // if (!res.ok) throw new Error("Invalid email or password.");
      navigate("/dashboard"); // adjust to your real route
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1>Login</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={!!errors.email}
          />
          {errors.email && <span className="error" role="alert">{errors.email}</span>}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={!!errors.password}
          />
          {errors.password && <span className="error" role="alert">{errors.password}</span>}
        </div>

        {submitError && <p className="error" role="alert">{submitError}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}