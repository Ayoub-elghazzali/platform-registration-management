import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios, { setCsrfToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await axios.get("/auth/me");
      setUser(response.data.user);
      const csrf = await axios.get("/auth/csrf");
      setCsrfToken(csrf.data.csrfToken);
      return response.data.user;
    } catch (error) {
      setUser(null);
      setCsrfToken(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (username, password) => {
    const response = await axios.post("/auth/login", { username, password });
    setCsrfToken(response.data.csrfToken);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post("/auth/logout");
    } finally {
      setCsrfToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout, refresh }), [user, loading, login, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
