import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth, useNotice } from "../Context/contexts";
import { Field, Icon } from "./UI";
export default function AuthForm({ register = false }) {
  const { session, login } = useAuth();
  const notify = useNotice();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const from = location.state?.from;
  const destination =
    typeof from === "string" &&
    from.startsWith("/") &&
    !from.startsWith("//") &&
    !/^\/(login|register)/.test(from)
      ? from
      : "/";
  if (session) return <Navigate to={destination} replace />;
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (register && values.password !== values.rePassword) {
      setError("Passwords do not match.");
      return;
    }
    values.email = values.email.trim();
    if (register) values.name = values.name.trim();
    setBusy(true);
    setError("");
    try {
      const result = await api(`/auth/${register ? "signup" : "signin"}`, {
        method: "POST",
        body: values,
        auth: false,
      });
      login(result);
      notify(register ? "Welcome to FreshCart!" : "Welcome back!");
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container auth-page">
      <aside className="auth-aside">
        <Icon name="bag" width="48" height="48" />
        <p className="eyebrow">YOUR EVERYDAY, UPGRADED</p>
        <h1>
          Good things
          <br />
          start here.
        </h1>
        <p>
          One account. All your favorites.
          <br />A fresher way to shop every day.
        </p>
        <div className="auth-art">
          fresh<span>cart</span>
          <i>✦</i>
        </div>
      </aside>
      <section className="auth-panel">
        <p className="eyebrow">
          {register ? "MAKE YOURSELF AT HOME" : "HELLO AGAIN"}
        </p>
        <h2>{register ? "Create your account" : "Welcome back."}</h2>
        <p className="muted">
          {register
            ? "Your next favorite find is just around the corner."
            : "Sign in to pick up where you left off."}
        </p>
        <form onSubmit={submit}>
          {register && (
            <Field
              label="Full name"
              name="name"
              required
              minLength={3}
              maxLength={50}
              autoComplete="name"
            />
          )}
          <Field
            label="Email address"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
          <Field
            label="Password"
            name="password"
            type="password"
            required
            minLength={register ? 8 : undefined}
            autoComplete={register ? "new-password" : "current-password"}
          />
          {register && (
            <>
              <small className="muted">
                Use at least 8 characters, including letters and numbers.
              </small>
              <Field
                label="Confirm password"
                name="rePassword"
                type="password"
                required
                autoComplete="new-password"
              />
              <Field
                label="Egyptian mobile number"
                name="phone"
                type="tel"
                required
                pattern="01[0125][0-9]{8}"
                title="An 11-digit Egyptian mobile number, e.g. 01012345678"
                autoComplete="tel"
              />
            </>
          )}
          {!register && (
            <Link className="forgot" to="/forgot-password">
              Forgot password?
            </Link>
          )}
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn full" disabled={busy}>
            {busy
              ? "Please wait…"
              : register
                ? "Create account →"
                : "Sign in →"}
          </button>
        </form>
        <p className="auth-switch">
          {register ? "Already have an account? " : "New to FreshCart? "}
          <Link to={register ? "/login" : "/register"} state={location.state}>
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </div>
  );
}
