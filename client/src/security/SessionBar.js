import React, { useState } from "react";
import { useAuth } from "./AuthContext";

export default function SessionBar() {
  const { user, logout, refreshSession } = useAuth();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  async function renew() {
    setBusy(true);
    setMessage("");
    try {
      await refreshSession();
      setMessage("Session renouvelée pour 8 heures.");
    } catch (error) {
      setMessage("Impossible de renouveler la session. Reconnectez-vous.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    try {
      await logout();
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <aside className="session-bar" aria-label="Session utilisateur">
      <span>{user.username} · {user.role}</span>
      {message && <span role="status">{message}</span>}
      <button type="button" onClick={renew} disabled={busy}>{busy ? "Renouvellement…" : "Renouveler la session"}</button>
      <button type="button" onClick={signOut}>Se déconnecter</button>
    </aside>
  );
}
