# Authentication and API security

## Session design

The API uses opaque, cryptographically random server-side sessions, not browser-stored JWTs. Only a SHA-256 digest of the session identifier is stored in MongoDB. The raw identifier is delivered in an HttpOnly, SameSite=Lax cookie named `prm_session`; the cookie is Secure in production. Sessions expire after eight hours. Logout, password changes, account disablement, and login session rotation revoke existing sessions.

Unsafe authenticated requests require the session's synchronizer CSRF token in `X-CSRF-Token`. The token is returned by login and `GET /auth/csrf`; it is held in frontend memory, not localStorage. Login and other state-changing browser operations also validate the Origin when it is present. CORS allows only configured `CLIENT_ORIGINS`.

## Authentication endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/login` | Sign in; sets HttpOnly cookie and returns CSRF token |
| GET | `/auth/me` | Current authenticated account |
| GET | `/auth/csrf` | Current CSRF token |
| POST | `/auth/refresh` | Rotate session and CSRF token; eight-hour lifetime |
| POST | `/auth/logout` | Revoke current session |
| POST | `/auth/change-password` | Verify current password, set a new bcrypt hash, revoke sessions |

The legacy `POST /loginAdmin` path is retained as a compatibility alias and uses the same secure handler.

## Protected application endpoints

| Method | Path | Permission |
|---|---|---|
| GET | `/users` | `users:read` |
| GET | `/users/:province` | `users:read` + geographic scope |
| GET | `/users/:id/status` | `users:read` + geographic scope |
| POST | `/users/:id/status` | `registrations:validate` + geographic scope |
| POST | `/validateDecision/:userId` | `registrations:validate` + geographic scope |
| GET | `/acceptedUsers`, `/finalAccepted` | `registrations:read` + geographic scope |
| GET | `/stats/provinces` | `statistics:read` + geographic scope |
| GET | `/admins` | `admins:read` |
| POST | `/addAdmin` | `admins:create` |
| DELETE | `/deleteAdmin/:username` | `admins:disable` |
| POST | `/addField` | `provinces:manage` |
| POST | `/createUser` | Public pending registration; whitelisted fields only |

All write endpoints for authenticated sessions require CSRF validation. Public registration is limited to a strict field allowlist and cannot set roles, permissions, or administrative state.

## Passwords

New passwords are bcrypt-hashed with a configurable work factor (default 12), with a minimum of 12 characters and a maximum of 72 UTF-8 bytes (bcrypt's input boundary). Password hashes and legacy password fields are never returned by API responses.

A legacy plaintext credential is migrated only after exact successful verification. The legacy field is then unset. A legacy password too short for the current policy requires an operator-assisted reset. Use the documented backend CLI scripts; never pass passwords as command-line arguments or commit them.

## Operational limitations

The login attempt limiter is currently process-local (8 attempts per account and 30 per IP in a 15-minute window). It protects a single Node.js process but is not shared across multiple instances or restarts; production horizontal scaling must move this counter to a shared Redis or MongoDB-backed rate-limit store. Session records are MongoDB-backed and have a TTL index. Configure TLS at the edge and restrict database network access.
