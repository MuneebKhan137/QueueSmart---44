import "./auth.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, ArrowRight, Info } from "lucide-react";
import { validateEmail } from "../validation";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
  <div className="auth-page">
    <div className="auth-card">
      <div className="auth-tabs">
        <Link to="/login" className="auth-tab active">Sign in</Link>
        <Link to="/register" className="auth-tab">Create account</Link>
      </div>

      <div className="auth-badge"><Lock size={18} /></div>
      <h1 className="auth-title">Welcome. Let's get you in line.</h1>
      
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email address <span className="required">*</span></label>
          <div className="input-wrap">
            <Mail className="icon-left" size={16} />
            <input
              id="email" name="email" type="email" autoComplete="email"
              placeholder="you@example.com"
              value={form.email} onChange={handleChange} onBlur={handleBlur}
              aria-invalid={!!errors.email}
            />
          </div>
          {errors.email && <p className="error" role="alert">{errors.email}</p>}
        </div>

        <div className="field">
          <label htmlFor="password">Password <span className="required">*</span></label>
          <div className="input-wrap">
            <Lock className="icon-left" size={16} />
            <input
              id="password" name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password} onChange={handleChange} onBlur={handleBlur}
              aria-invalid={!!errors.password}
            />
            <button
              type="button" className="toggle-visibility"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="error" role="alert">{errors.password}</p>}
        </div>

        {submitError && <p className="error" role="alert">{submitError}</p>}

        <button type="submit" className="auth-submit" disabled={loading}>
          <span>{loading ? "Signing in..." : "Sign in & continue"}</span>
          <ArrowRight size={16} />
        </button>
      </form>

      <div className="auth-notice">
        <Info size={14} />
        <span>This is a front-end demo. No account details are saved or sent to a server.</span>
      </div>
    </div>
  </div>
);
}