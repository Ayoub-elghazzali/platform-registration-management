# Platform Registration Management

A web application for managing administrative registration workflows with regional and provincial views. This repository began as an academic project and is being incrementally hardened into a maintainable full-stack application.

> **Current maturity: development / security hardening in progress. Do not deploy this version with real personal data or expose its API to the public internet.**

## Technology stack

- **Frontend:** React 19, React Router, Axios, Recharts
- **Backend:** Node.js, Express 5, Mongoose
- **Database:** MongoDB
- **Testing:** Node.js built-in test runner for backend configuration tests

## Repository layout

```text
client/                 React application
server/server/          Express API and MongoDB integration
  config/database.js    Validated environment configuration
  test/                 Backend unit tests
  .env.example          Non-secret local configuration template
SECURITY.md             Credential rotation and Git-history guidance
```

## Local development

### Requirements

- Node.js 20 or newer
- npm
- MongoDB local instance or a MongoDB Atlas database user

### Backend

```bash
cd server/server
npm install
cp .env.example .env
```

Set `MONGODB_URI` in the untracked `.env` file. Use a local development database or a newly rotated, least-privilege database user. Never paste credentials into source code or commit `.env`.

Start the API:

```bash
npm run dev
```

Run the current backend unit tests:

```bash
npm test
```

### Frontend

```bash
cd client
npm install
npm start
```

The existing frontend currently targets the local API at `http://localhost:3001`. Configurable frontend API origins and authenticated API integration are part of the ongoing hardening work.

## Existing application areas

The current codebase includes registration forms, administrator login screens, administrative dashboards, regional/provincial views, registration status operations, and province statistics. These areas are not yet uniformly protected by a complete authorization model.

## Security status and limitations

- The hard-coded MongoDB connection strings were removed from the current server source. The application now requires `MONGODB_URI`.
- A secret that has appeared in a public Git commit must be considered compromised even after removal from the current file. **Rotate or revoke the exposed database user immediately.** See [SECURITY.md](SECURITY.md).
- The legacy administrator model and login flow still require a password-hashing migration and secure token/session implementation.
- Administrative routes still require complete authentication and role-based authorization coverage.
- Input validation, API error handling, audit logging, rate limiting, API documentation, and broader integration tests remain in the hardening backlog.
- Do not use real identity documents, personal information, or production records in development or demonstrations.

## Test coverage

The current automated backend tests cover required MongoDB environment configuration. They do not yet constitute end-to-end, database integration, authorization, or frontend coverage.

## Contribution and responsible disclosure

Do not commit credentials, real personal data, database exports, or production logs. Report security issues privately to the repository owner rather than publishing exploit details.
