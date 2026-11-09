import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useNotice } from "../Context/contexts";
import { Field } from "./UI";
export default function ForgotPassword() {
  const [step, setStep] = useState(0),
    [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  const notify = useNotice();
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (step === 2 && values.newPassword !== values.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (step === 0) {
        await api("/auth/forgotPasswords", {
          method: "POST",
          body: { email: values.email.trim() },
          auth: false,
        });
        setEmail(values.email.trim());
        setStep(1);
      } else if (step === 1) {
        await api("/auth/verifyResetCode", {
          method: "POST",
          body: { resetCode: values.resetCode.trim() },
          auth: false,
        });
        setStep(2);
      } else {
        await api("/auth/resetPassword", {
          method: "PUT",
          body: { email, newPassword: values.newPassword },
          auth: false,
        });
        notify("Password updated. Sign in with your new password.");
        navigate("/login", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page">
      <section className="form-card">
        <p className="eyebrow">STEP {step + 1} OF 3</p>
        <h1>
          {
            [
              "Reset your password",
              "Check your inbox",
              "Choose a new password",
            ][step]
          }
        </h1>
        <p className="muted">
          {step === 1
            ? `Enter the reset code sent to ${email}.`
            : "Let’s get you back to your favorites."}
        </p>
        <form key={step} onSubmit={submit}>
          {step === 0 && (
            <Field
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          )}
          {step === 1 && (
            <Field
              label="Reset code"
              name="resetCode"
              inputMode="numeric"
              pattern="[0-9]{6}"
              autoComplete="one-time-code"
              required
            />
          )}
          {step === 2 && (
            <>
              <Field
                label="New password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <Field
                label="Confirm password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </>
          )}
          {error && (
            <p role="alert" className="inline-error">
              {error}
            </p>
          )}
          <button className="btn full" disabled={busy}>
            {busy
              ? "Please wait…"
              : ["Send reset code", "Verify code", "Update password"][step]}
          </button>
        </form>
        {step === 1 && (
          <button
            className="text-button"
            disabled={busy}
            onClick={() => {
              setStep(0);
              setError("");
            }}
          >
            Change email or send another code
          </button>
        )}
        <Link className="continue-link" to="/login">
          ← Back to sign in
        </Link>
      </section>
    </div>
  );
}
