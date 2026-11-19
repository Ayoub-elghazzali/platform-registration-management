import { vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import Login from "./Pages/Login";

vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("./security/AuthContext", () => ({
  useAuth: () => ({ login: vi.fn(), user: null, loading: false })
}));

test("login page exposes accessible username and password fields", () => {
  render(<Login />);
  expect(screen.getByRole("heading", { name: /connexion administrateur/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/nom d’utilisateur/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
});
