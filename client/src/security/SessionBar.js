import React from "react";
import { useAuth } from "./AuthContext";

export default function SessionBar() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <aside className="session-bar" aria-label="Session utilisateur">
      <span>{user.username} · {user.role}</span>
      <button type="button" onClick={logout}>Se déconnecter</button>
    </aside>
  );
}
