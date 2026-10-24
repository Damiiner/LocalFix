import { useState } from "react";
import { Link } from "react-router-dom";
import LogoMark from "../components/LogoMark";

const defaultLogin = { email: "", password: "" };
const defaultRegister = { name: "", email: "", password: "", confirmPassword: "" };

function AuthPage({ mode, onLogin, onRegister, onReactivate }) {
  const [loginForm, setLoginForm] = useState(defaultLogin);
  const [registerForm, setRegisterForm] = useState(defaultRegister);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pausedMode, setPausedMode] = useState(false);

  const isLogin = mode === "login";

  const submit = (event) => {
    event.preventDefault();
    setError("");
    setPausedMode(false);
    setIsSubmitting(true);

    if (!isLogin && registerForm.password !== registerForm.confirmPassword) {
      setIsSubmitting(false);
      setError("Passwords do not match.");
      return;
    }

    const action = isLogin ? onLogin(loginForm) : onRegister(registerForm);
    action.then((result) => {
      setIsSubmitting(false);
      if (!result?.ok) {
        setError(result?.error || "Something went wrong.");
        if (result?.code === "paused") {
          setPausedMode(true);
        }
      }
    });
  };

  const reactivate = () => {
    if (!onReactivate) return;
    setError("");
    setIsSubmitting(true);
    onReactivate(loginForm).then((result) => {
      setIsSubmitting(false);
      if (!result?.ok) {
        setError(result?.error || "Could not reactivate.");
      } else {
        setPausedMode(false);
      }
    });
  };

  return (
    <section className="auth-page">
      <div className="auth-brand-row">
        <LogoMark large />
        <div className="auth-brand-titles">
          <span className="auth-brand-name">LocalFix</span>
          <span className="auth-brand-tag muted">Neighbors helping neighbors</span>
        </div>
      </div>
      <form className="card task-form auth-card" onSubmit={submit}>
        <h2>{isLogin ? "Sign in" : "Create account"}</h2>
        <p className="muted">
          {isLogin ? "Welcome back." : "One account to request and offer help."}
        </p>

        {isLogin ? (
          <>
            <label>
              Email
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="you@gmail.com"
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Password"
                autoComplete="current-password"
              />
            </label>
          </>
        ) : (
          <>
            <label>
              Full name
              <input
                value={registerForm.name}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Your name"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="you@gmail.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                value={registerForm.confirmPassword}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                }
                placeholder="Repeat password"
                autoComplete="new-password"
              />
            </label>
          </>
        )}

        {error ? <p className="form-error">{error}</p> : null}

        {isLogin && pausedMode ? (
          <p className="auth-paused-hint muted">This account is paused. Reactivate with your password below.</p>
        ) : null}

        <button className="btn btn-primary-action" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Please wait..." : isLogin ? "Sign in" : "Register"}
        </button>

        {isLogin && pausedMode && onReactivate ? (
          <button
            type="button"
            className="btn btn-secondary auth-reactivate-btn"
            disabled={isSubmitting}
            onClick={reactivate}
          >
            Reactivate &amp; sign in
          </button>
        ) : null}

        <p className="muted auth-switch">
          {isLogin ? "New here?" : "Already have an account?"}{" "}
          <Link to={isLogin ? "/register" : "/login"}>{isLogin ? "Create an account" : "Sign in"}</Link>
        </p>
      </form>
    </section>
  );
}

export default AuthPage;
