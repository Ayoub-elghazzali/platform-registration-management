import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "./AuthContext";

jest.mock("./AuthContext", () => ({ useAuth: jest.fn() }));

function renderGuard(user) {
  useAuth.mockReturnValue({ user, loading: false });
  return render(
    <MemoryRouter initialEntries={["/private"]}>
      <Routes>
        <Route path="/login" element={<p>Login screen</p>} />
        <Route path="/private" element={
          <ProtectedRoute roles={["SUPER_ADMIN"]}><p>Private dashboard</p></ProtectedRoute>
        } />
      </Routes>
    </MemoryRouter>
  );
}

test("unauthenticated users are redirected to login", () => {
  renderGuard(null);
  expect(screen.getByText("Login screen")).toBeInTheDocument();
});

test("authenticated users without the required role are denied", () => {
  renderGuard({ role: "PROVINCIAL_ADMIN" });
  expect(screen.getByRole("alert")).toHaveTextContent(/accès refusé/i);
});

test("authorized role can access the protected route", () => {
  renderGuard({ role: "SUPER_ADMIN" });
  expect(screen.getByText("Private dashboard")).toBeInTheDocument();
});
