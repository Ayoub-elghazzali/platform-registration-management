import { vi } from "vitest";
import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios, { setCsrfToken } from "./api";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("./api", () => ({
  __esModule: true,
  default: { get: vi.fn(), post: vi.fn() },
  setCsrfToken: vi.fn()
}));

function Probe() {
  const { user, loading, login, logout } = useAuth();
  return (
    <section>
      <output data-testid="user">{user?.username || "anonymous"}</output>
      <output data-testid="loading">{String(loading)}</output>
      <button onClick={() => login("test-admin", "test-password")}>login</button>
      <button onClick={() => logout()}>logout</button>
    </section>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  axios.get.mockImplementation(async (url) => {
    if (url === "/auth/me") return { data: { user: null } };
    if (url === "/auth/csrf") return { data: { csrfToken: "initial-csrf" } };
    throw new Error("Unexpected GET");
  });
});

test("AuthProvider restores anonymous state after initial session lookup", async () => {
  render(<AuthProvider><Probe /></AuthProvider>);
  await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
  expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
  expect(setCsrfToken).toHaveBeenCalledWith("initial-csrf");
});

test("login stores user in memory and installs the CSRF token", async () => {
  axios.post.mockResolvedValue({
    data: { user: { username: "test-admin", role: "SUPER_ADMIN" }, csrfToken: "login-csrf" }
  });
  render(<AuthProvider><Probe /></AuthProvider>);
  await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
  fireEvent.click(screen.getByRole("button", { name: "login" }));
  await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("test-admin"));
  expect(setCsrfToken).toHaveBeenCalledWith("login-csrf");
});

test("logout revokes the session and clears user and CSRF state", async () => {
  axios.get.mockImplementation(async (url) => url === "/auth/me"
    ? { data: { user: { username: "test-admin", role: "SUPER_ADMIN" } } }
    : { data: { csrfToken: "initial-csrf" } });
  axios.post.mockResolvedValue({ data: { success: true } });
  render(<AuthProvider><Probe /></AuthProvider>);
  await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("test-admin"));
  fireEvent.click(screen.getByRole("button", { name: "logout" }));
  await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("anonymous"));
  expect(axios.post).toHaveBeenCalledWith("/auth/logout");
  expect(setCsrfToken).toHaveBeenLastCalledWith(null);
});

test("expired-session event clears authentication state", async () => {
  axios.get.mockImplementation(async (url) => url === "/auth/me"
    ? { data: { user: { username: "test-admin", role: "SUPER_ADMIN" } } }
    : { data: { csrfToken: "initial-csrf" } });
  render(<AuthProvider><Probe /></AuthProvider>);
  await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("test-admin"));
  act(() => window.dispatchEvent(new Event("auth:expired")));
  expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
  expect(setCsrfToken).toHaveBeenLastCalledWith(null);
});
