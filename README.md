# Platform Registration Management

Administrative registration management platform with role-based dashboards and geographic data scope. This repository is being hardened from an academic project into a maintainable full-stack application.

> **Security maturity: authentication and authorization implementation in progress. Do not use real personal data or deploy publicly until the CI suite has passed and the remaining operational controls have been completed.**

## Technology stack

- **Frontend:** React 19, Vite 7, Vitest, React Router 7, Axios, Recharts
- **Backend:** Node.js, Express 5, Mongoose
- **Database:** MongoDB
- **Authentication:** bcrypt password hashes, opaque server-side sessions, HttpOnly cookies, CSRF synchronizer tokens
- **Security:** Helmet, restricted CORS, MongoDB operator-input rejection, request-size limits, server-side RBAC, geographic scoping and privacy-minimized audit events
- **Tests:** Node.js test runner, Supertest, MongoDB Memory Server, Vitest and Testing Library

## Repository structure

```text
client/                       React application
server/server/
  config/database.js          Environment-only MongoDB configuration
  security/authorization.js   Role permissions and geographic scoping
  security/passwords.js       bcrypt hashing and legacy migration checks
  scripts/                    Admin provisioning, reset and geographic scope assignment
  test/                       Unit and MongoDB-backed integration tests
  docs/API.md                 Authentication and API reference
  docs/RBAC.md                Roles, permissions and geographic boundaries
  .env.example                Non-secret environment template
SECURITY.md                   Security controls and operational limitations
```

## Local setup

Requirements: Node.js 20+, npm, and a local MongoDB instance or a dedicated test/development database.

### Backend

```bash
cd server/server
npm ci
cp .env.example .env
```

Configure `MONGODB_URI` in the untracked `.env` file. Never use production credentials in local development.

Run the API:

```bash
npm run dev
```

Run tests:

```bash
npm run build
npm run test:unit
npm run test:integration
npm test
```

The integration suite creates an isolated in-memory MongoDB instance. It does not connect to the configured application database.

### Frontend

```bash
cd client
npm ci
npm run dev
npm test
npm run build
```

Set `VITE_API_URL` when the API is not running at `http://localhost:3001`. The browser sends credentials using cookies; it does not persist authentication tokens in localStorage.

## Authentication architecture

The API uses opaque random server-side sessions instead of browser-stored JWTs. Only a SHA-256 digest of the session identifier is stored in MongoDB. The browser receives an HttpOnly, SameSite cookie, Secure in production. Authenticated write requests require a CSRF token in `X-CSRF-Token`. Sessions expire after eight hours and can be renewed or revoked.

New administrator passwords are bcrypt-hashed (default cost 12). Legacy plaintext credentials are migrated only after exact successful verification; the old field is then removed. Legacy passwords that do not satisfy the new policy require an operator reset.

## Initial super administrator

Create the first super administrator from the backend directory. Set secrets in the process environment; do not place them in source code or command-line arguments.

macOS/Linux example:

```bash
export ADMIN_USERNAME="your-admin-login"
read -s ADMIN_PASSWORD
export ADMIN_PASSWORD
npm run admin:create
unset ADMIN_PASSWORD
```

For an operator-assisted reset:

```bash
export RESET_ADMIN_USERNAME="your-admin-login"
read -s RESET_ADMIN_PASSWORD
export RESET_ADMIN_PASSWORD
npm run admin:reset
unset RESET_ADMIN_PASSWORD
```

The reset command revokes all existing sessions for that account and does not automatically reactivate a disabled account.

For a legacy regional or provincial administrator missing its geographic scope, use `npm run admin:scope` with `SCOPE_ADMIN_USERNAME` and either `SCOPE_ADMIN_REGION` or `SCOPE_ADMIN_PROVINCE`. Verify the assignment before granting access.

## Authorization

See [Role and Permission Model](server/server/docs/RBAC.md) and [Authentication API](server/server/docs/API.md). Server-side authorization is authoritative; frontend route guards are only a usability layer. Regional and provincial access is derived from the authenticated administrator record, never from localStorage or a client-supplied role.

## CI

GitHub Actions includes a backend unit/integration test workflow and a frontend production-build workflow. Check the Actions tab for actual execution results; a workflow file existing in the repository does not itself prove that a run passed.

## Current limitations

- Login throttling currently uses process-local memory (8 attempts per account and 30 per IP per 15 minutes). Use a shared Redis or MongoDB rate-limit store before horizontal scaling.
- Email-based password recovery, MFA, centralized SIEM forwarding, and alerting are not yet implemented.
- The current role model reflects the legacy application's known roles. It requires owner review against the real administrative hierarchy before production use.
- Existing legacy administrators must be migrated through successful login or reset using the documented operator procedure.
- The frontend has moved from Create React App to Vite/Vitest; existing screen workflows still require manual pre-production acceptance testing.
- Do not use actual identity documents or real personal records in demonstrations.

## Security

See [SECURITY.md](SECURITY.md), the [Phase B.3 Security Audit](server/server/docs/SECURITY-AUDIT.md), and the [Legacy Account Migration Runbook](server/server/docs/MIGRATION.md). Report security issues privately to the repository owner. Never commit passwords, cookies, tokens, database URIs, or personal data.
