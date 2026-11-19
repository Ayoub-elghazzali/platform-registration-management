import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Login from "./Login";
import { useAuth } from "../security/AuthContext";
import { useNavigate } from "react-router-dom";

jest.mock("react-router-dom", () => ({ useNavigate: jest.fn() }), { virtual: true });
jest.mock("../security/AuthContext", () => ({ useAuth: jest.fn() }));

const mockNavigate = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  useNavigate.mockReturnValue(mockNavigate);
});

test("login displays a safe API authentication error", async () => {
  const mockLogin = jest.fn().mockRejectedValue({
    response: { status: 401, data: { error: "Identifiants incorrects." } }
  });
  useAuth.mockReturnValue({ login: mockLogin });
  render(<Login />);
  fireEvent.change(screen.getByLabelText(/nom d’utilisateur/i), { target: { value: "test-admin" } });
  fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: "wrong-password" } });
  fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Identifiants incorrects.");
  expect(mockLogin).toHaveBeenCalledWith("test-admin", "wrong-password");
});

test("successful login redirects a super administrator to its dashboard", async () => {
  const mockLogin = jest.fn().mockResolvedValue({ role: "SUPER_ADMIN" });
  useAuth.mockReturnValue({ login: mockLogin });
  render(<Login />);
  fireEvent.change(screen.getByLabelText(/nom d’utilisateur/i), { target: { value: "test-admin" } });
  fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: "correct-password" } });
  fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboardGeneral", { replace: true }));
});
