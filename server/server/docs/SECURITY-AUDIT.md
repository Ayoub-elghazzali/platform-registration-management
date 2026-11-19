# Phase B.3 — Security and validation report

**Repository:** Ayoub-elghazzali/platform-registration-management  
**Validation environment:** GitHub Actions, Ubuntu 26.04, Node.js 22.23.4  
**Database used by integration tests:** isolated MongoDB Memory Server; no production database was accessed.

## Verified CI executions

| Pipeline | Run | Commit tested | Result |
|---|---|---|---|
| Backend security tests and audit | https://github.com/Ayoub-elghazzali/platform-registration-management/actions/runs/44553430270 | f84df3a2cc1d454244c01c2da92a02e8ab9f615e | Passed |
| Frontend tests, build and audit | https://github.com/Ayoub-elghazzali/platform-registration-management/actions/runs/44553452425 | 07ba4b66f6cf5ba315617556156b19ec5f31b3ca | Passed |

Both pipelines installed from the committed package lockfiles using npm ci. Neither pipeline regenerated or silently rewrote dependencies during the final verification.

## Test and build results

| Check | Created | Executed | Passed | Failed |
|---|---:|---:|---:|---:|
| Backend unit and integration tests | 45 | 45 | 45 | 0 |
| Frontend Vitest suites | 10 | 10 | 10 | 0 |
| Frontend test files | 4 | 4 | 4 | 0 |

Backend npm test reported 45 tests, 45 passed, 0 failed. The integration suite runs against an isolated in-memory MongoDB database.

Frontend npm test reported 4 test files and 10 tests passed. Vite production build completed successfully (Vite 7.3.8).

Backend npm run build performs Node syntax validation for the API, security modules, database configuration, and administrative scripts. It completed successfully.

## Scenarios covered

- Successful and unsuccessful login, unknown account, disabled account, legacy password migration and reset-required legacy credentials.
- Session creation, expiry, renewal, logout, session revocation after account disablement, and password-change revocation.
- Missing and stale CSRF token rejection.
- Missing authentication and missing permission on administrative route families.
- SUPER_ADMIN, ADMIN, REGIONAL_ADMIN, PROVINCIAL_ADMIN and USER permission matrix.
- Regional and provincial geographic scoping; out-of-scope reads, modifications and validation attempts are rejected.
- Missing geographic scope fails closed.
- Attempted SUPER_ADMIN creation through the administrator endpoint is rejected.
- Repeated login attempts are rate-limited.
- Helmet response headers and CORS origin allowlist.
- Password fields are not returned by administrator APIs; audit endpoint omits IP pseudonym.

## Dependency audit

The initial frontend dependency audit found 70 advisories (12 low, 14 moderate, 39 high, 5 critical). The initial backend audit found 6 advisories (5 high, 1 critical).

The dependency remediation upgraded direct packages, regenerated and committed both lockfiles, replaced the unmaintained Create React App/react-scripts build chain with Vite/Vitest, and updated vulnerable transitive dependencies.

The final committed-lockfile CI runs report **0 vulnerabilities** for the backend and frontend. npm audit is a blocking CI step for high and critical advisories.

## Security controls rechecked

- Server-side opaque sessions; only SHA-256 session identifier digests are stored in MongoDB.
- HttpOnly, SameSite=Lax session cookie; Secure in production.
- CSRF synchronizer token on authenticated mutations.
- Exact CORS origin allowlist and explicit 403 for disallowed Origin headers.
- Helmet defaults, disabled X-Powered-By, bounded JSON bodies.
- Bcrypt cost factor 12 and 72-byte UTF-8 boundary handling.
- Exact-match-only migration from legacy plaintext passwords.
- Server-side permission checks and geographic scoping on protected API routes.
- MongoDB filter sanitization and rejection of operator-shaped request input.
- Login throttling and privacy-minimized security audit events.
- No authentication token stored in localStorage or sessionStorage.

## Migration readiness

The operator runbook is published at MIGRATION.md. It covers a protected backup, isolated restore rehearsal, account migrability classes, operator-assisted password resets, verified geographic scope assignment, and rollback.

No production account inventory was read, no real account was migrated, no production password was reset, and no geographic scope was assigned. Actual counts of legacy, already-hashed, disabled, or reset-required accounts remain unknown until an approved pre-production database copy is inspected.

## Remaining pre-production actions

1. Configure MONGODB_URI, CLIENT_ORIGINS, COOKIE_SECURE=true, AUDIT_IP_HASH_KEY, HTTPS and the least-privilege database account in the pre-production secret manager.
2. Confirm that the production deployment has exactly one trusted reverse proxy hop, or adjust Express trust proxy configuration to the actual topology.
3. Use a sanitized database copy to rehearse login migration, weak/long password reset, geographic scope assignment, backup restore and rollback.
4. Perform manual browser acceptance of the legacy dashboards and registration/validation journeys. Automated tests and the production build pass, but a full end-to-end browser suite for every legacy screen has not been implemented.
5. Configure a shared Redis/MongoDB rate-limit store before horizontal scaling. Current login throttling is process-local.
6. Plan MFA, email-based recovery, centralized SIEM forwarding and operational alerting before production deployment.

**Conclusion:** the automated Phase B.3 validation gates pass on GitHub Actions. The repository is suitable for a controlled pre-production rehearsal after environment configuration. This report does not certify production deployment or a completed migration of real accounts.
