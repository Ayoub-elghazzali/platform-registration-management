import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="auth-loading" aria-live="polite">Vérification de la session…</main>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <main className="auth-denied" role="alert">Accès refusé : votre rôle ne permet pas d’ouvrir cette page.</main>;
  return children;
}
