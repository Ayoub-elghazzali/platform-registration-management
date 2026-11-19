# Security notes

## MongoDB credentials

The application now requires `MONGODB_URI` from the runtime environment. No remote database URI or fallback credential is embedded in the server source.

1. Create a new database user in MongoDB Atlas with the minimum permissions required by this application.
2. Rotate the password or delete the previously exposed database user immediately.
3. Restrict Atlas network access to the application environment where practical; avoid broad public IP access.
4. Store the replacement URI in your deployment platform's secret manager or in a local, untracked `.env` file.
5. Never commit `.env`; use `.env.example` only as a non-secret template.
6. Review Atlas database access logs and audit events from the period in which the URI was public. Investigate unexpected connections and data access.
7. Verify that the application starts with the new URI and that the old database user can no longer authenticate.

## Git history

Removing a secret from the current file does not remove it from earlier Git commits, forks, clones, caches, or third-party copies. Treat the old credential as compromised and rotate it first. History rewriting (for example, with `git filter-repo`) is intentionally not performed; it requires a coordinated plan for collaborators and forks and explicit owner approval.

## Reporting

Do not publish real personal data, access tokens, database URIs, private keys, or production exports in issues, screenshots, fixtures, or documentation.
