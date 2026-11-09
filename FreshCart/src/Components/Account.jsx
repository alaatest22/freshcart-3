import { useState } from "react";
import { useAuth, useNotice } from "../Context/contexts";
import { api } from "../lib/api";
import { Field, Heading } from "./UI";
export default function Account() {
  const { user, login } = useAuth();
  const notify = useNotice();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget,
      values = Object.fromEntries(new FormData(form));
    if (values.password !== values.rePassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await api("/users/changeMyPassword", {
        method: "PUT",
        body: values,
      });
      login({ ...result, user: result.user || user });
      notify("Your password has been updated.");
      form.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page">
      <Heading
        eyebrow="YOUR ACCOUNT"
        title={`Hello, ${user?.name || "shopper"}.`}
      />
      <section className="form-card">
        <h2>Change password</h2>
        <form onSubmit={submit}>
          <Field
            label="Current password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
          <Field
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <Field
            label="Confirm new password"
            name="rePassword"
            type="password"
            autoComplete="new-password"
            required
          />
          {error && (
            <p role="alert" className="inline-error">
              {error}
            </p>
          )}
          <button className="btn" disabled={busy}>
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}
