# Security policy

## Supported security controls

- MongoDB credentials are supplied through `MONGODB_URI`; no remote connection string is embedded in source.
- Admin sessions use random opaque identifiers in HttpOnly cookies. The database stores only a SHA-256 digest of each session identifier.
- Authenticated unsafe requests require a synchronizer CSRF token.
- CORS is restricted to `CLIENT_ORIGINS`; Helmet supplies baseline HTTP security headers.
- New passwords use bcrypt with a default cost factor of 12 and a 12-character minimum.
- Legacy plaintext passwords are migrated only after successful exact verification; the plaintext field is unset after migration.
- Server-side RBAC and geographic scoping are applied to administrative endpoints.
- Disabled accounts cannot authenticate; disabling an administrator revokes that administrator's sessions.
- Request bodies are bounded, MongoDB operator-shaped input is rejected, and public registration accepts only a field allowlist.

## Deployment requirements

1. Use HTTPS and set `NODE_ENV=production`, `COOKIE_SECURE=true`, and exact `CLIENT_ORIGINS`.
2. Use a least-privilege MongoDB account and a restricted network allowlist.
3. Store environment values in a deployment secret manager; never commit `.env`.
4. Back up the database before running operational migrations.
5. Use a shared rate-limit store before running multiple API instances.
6. Monitor authentication failures and database access without logging passwords, cookies, session IDs, CSRF tokens, or personal registration records.

## Legacy password migration

The API supports controlled on-login migration from the former plaintext `Admin.password` field. A password is hashed only after the submitted value matches the stored legacy value exactly. If it is incorrect, the legacy field is left unchanged. Legacy passwords shorter than the new policy are not automatically migrated and require an operator reset. See [RBAC.md](server/server/docs/RBAC.md) and [authentication API documentation](server/server/docs/API.md).

## Initial administrator

Provision the first super administrator from the backend using `npm run admin:create` with `ADMIN_USERNAME` and `ADMIN_PASSWORD` supplied only in the process environment. The script refuses to create a second active super administrator.

For legacy regional/provincial accounts with missing scope, assign the verified region/province using `npm run admin:scope` and the `SCOPE_ADMIN_USERNAME`, `SCOPE_ADMIN_REGION`, or `SCOPE_ADMIN_PROVINCE` environment variables. Such accounts are denied access until scope is present.\n\nFor an account recovery, use `npm run admin:reset` with `RESET_ADMIN_USERNAME` and `RESET_ADMIN_PASSWORD` in the process environment. This resets the password hash and revokes all sessions for that account.

## Known limitations

- The login attempt limiter currently uses in-process memory (8 attempts per account and 30 per IP per 15-minute window); use a shared store for multi-instance deployments.
- Email-based password recovery, MFA, account lockout notifications, centralized SIEM forwarding, and formal security monitoring are not implemented.
- The current integration suite uses an isolated in-memory MongoDB test database; it does not validate production configuration or deployment infrastructure.
- Historical credentials may remain in older Git commits. Treat any previously public secret as compromised and rotate it. History rewriting is not performed automatically.

## Reporting

Do not publish credentials, personal data, database exports, session material, or exploit details in public issues. Contact the repository owner privately.

## Audit event privacy

Authentication successes and failures, password migrations/changes, administrator creation/disablement, and logout events are stored as structured audit events. They contain event type, actor/target identifiers where available, timestamp, and a one-way hash of the client IP. They do not contain usernames, passwords, cookies, session identifiers, CSRF tokens, request bodies, or registration records. The `GET /security/audit` endpoint requires `settings:manage` and omits the IP hash from its response.
