import { useState } from "react";

const KEY = "presidentinder.unlocked";

/**
 * Remembered locally so a second run doesn't ask again. This is a courtesy
 * gate, not a paywall: anyone with devtools walks straight past it, and the
 * unlock happens even when the network call fails, because breaking the
 * result page over a failed POST would be a worse trade than a lost address.
 */
export function useUnlocked() {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });
  const unlock = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* private mode: unlock for this session only */
    }
    setUnlocked(true);
  };
  return [unlocked, unlock] as const;
}

const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export default function EmailGate({ onUnlock }: { onUnlock: () => void }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = LOOKS_LIKE_EMAIL.test(email.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      /* offline or blocked: unlock anyway */
    }
    onUnlock();
  }

  return (
    <form className="gate" onSubmit={submit}>
      <div className="gate-title">Falta pouco</div>
      <div className="gate-row">
        <input
          type="email"
          className="gate-input"
          placeholder="Deixe seu e-mail pra desbloquear"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          spellCheck={false}
          aria-label="E-mail"
        />
        <button
          type="submit"
          className={`gate-btn${valid ? " on" : ""}`}
          disabled={!valid || busy}
        >
          DESBLOQUEAR
        </button>
      </div>
    </form>
  );
}
