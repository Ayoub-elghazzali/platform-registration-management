import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../security/AuthContext";
import "./Login.css";

const DASHBOARD_BY_ROLE = {
  SUPER_ADMIN: "/dashboardGeneral",
  ADMIN: "/dashboardGeneral",
  REGIONAL_ADMIN: "/dashboardRegional",
  PROVINCIAL_ADMIN: "/PresidentProvincial",
  USER: "/"
};

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(username.trim(), password);
      const destination = DASHBOARD_BY_ROLE[user.role];
      if (!destination || destination === "/") {
        setError("Ce compte ne possède pas d’espace administrateur.");
        return;
      }
      setPassword("");
      navigate(destination, { replace: true });
    } catch (requestError) {
      const response = requestError.response;
      setError(response?.data?.message || response?.data?.error || "Connexion impossible. Vérifiez vos identifiants ou réessayez plus tard.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <h2>Connexion administrateur</h2>
        {error && <p className="error-message" role="alert">{error}</p>}
        <label htmlFor="username">Nom d’utilisateur</label>
        <input id="username" name="username" type="text" autoComplete="username" value={username}
          onChange={event => setUsername(event.target.value)} required minLength={3} maxLength={80} />
        <label htmlFor="password">Mot de passe</label>
        <input id="password" name="password" type="password" autoComplete="current-password" value={password}
          onChange={event => setPassword(event.target.value)} required maxLength={128} />
        <button type="submit" disabled={submitting || !username.trim() || !password}>
          {submitting ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
