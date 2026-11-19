import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

jest.mock("./security/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    refreshSession: jest.fn()
  })
}));

test("login page exposes accessible username and password fields", () => {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByRole("heading", { name: /connexion administrateur/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/nom d’utilisateur/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
});
