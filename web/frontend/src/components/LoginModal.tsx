import { useState } from "react";
import { login as apiLogin, signup as apiSignup } from "../api";
import { Icon } from "./Icon";

export default function LoginModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") await apiSignup(username.trim(), password);
      else await apiLogin(username.trim(), password);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl2 border border-line bg-surface p-6 shadow-cardhover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-ink">
            {mode === "signup" ? "Create your player" : "Log in to play"}
          </h3>
          <button onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-ink">
            ✕
          </button>
        </div>
        <p className="mb-4 text-sm text-ink-muted">
          Stock Market Club trading game · everyone starts with $100,000.
        </p>

        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-muted">Full name</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-3 w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-ink outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20"
          placeholder="Enter your full name"
        />
        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-muted">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-ink outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20"
          placeholder="at least 6 characters"
        />

        {mode === "signup" && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-gold-700 dark:text-gold-400">
            <span className="mt-0.5 flex-none"><Icon name="info" size={13} /></span>
            For your safety, don't reuse a password from another account.
          </p>
        )}

        {error && <p className="mt-3 rounded-lg bg-neg/10 px-3 py-2 text-sm text-neg">{error}</p>}

        <button
          onClick={submit}
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-gradient-to-br from-forest-800 to-forest-600 py-2.5 font-bold text-cream-50 shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
        </button>

        <button
          onClick={() => {
            setMode(mode === "signup" ? "login" : "signup");
            setError(null);
          }}
          className="mt-3 w-full text-center text-sm font-semibold text-forest-600 hover:text-forest-700"
        >
          {mode === "signup" ? "Already have an account? Log in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}
