import { useState } from "react";
import { changePassword } from "../api";

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await changePassword(current, next);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl2 border border-line bg-surface p-6 shadow-cardhover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-ink">Change password</h3>
          <button onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-ink">✕</button>
        </div>

        {done ? (
          <>
            <p className="rounded-lg bg-pos/10 px-3 py-2 text-sm text-pos">Your password was changed. ✅</p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-xl bg-gradient-to-br from-forest-800 to-forest-600 py-2.5 font-bold text-cream-50 shadow-glow"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-muted">Current password</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="mb-3 w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-ink outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20"
            />
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-muted">New password</label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="at least 6 characters"
              className="w-full rounded-xl border border-line bg-panel px-3 py-2.5 text-ink outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20"
            />
            {error && <p className="mt-3 rounded-lg bg-neg/10 px-3 py-2 text-sm text-neg">{error}</p>}
            <button
              onClick={submit}
              disabled={busy}
              className="mt-4 w-full rounded-xl bg-gradient-to-br from-forest-800 to-forest-600 py-2.5 font-bold text-cream-50 shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {busy ? "Saving…" : "Update password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
