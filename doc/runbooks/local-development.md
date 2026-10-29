# Runbook — API claims, local development and CORS (row 34)

References:
- https://developer.entando.com/v7.5/docs/getting-started/ent-api.html
- https://developer.entando.com/v7.5/tutorials/create/ms/add-api-claim.html

## How a widget finds the microservice

1. `ent bundle api add <mfe> announcement-api --serviceName=announcement-ms --serviceUrl=http://localhost:8081`
   records an **internal** API claim on the MFE in `entando.json`
   (`apiClaims: [{ name, type: "internal", serviceName }]`) and writes the local
   URL to `microfrontends/<mfe>/public/mfe-config.json`.
2. **Deployed:** when the widget is rendered, Entando injects
   `systemParams.api["announcement-api"].url` into the `config` attribute. The
   URL already contains the ingress path of `announcement-ms`.
3. **Local:** the dev `index.html` copies `public/mfe-config.json` into the same
   attribute, so the code path is identical.
4. The MFE builds request URLs as `<claim url>` + contract path
   (`/api/announcements/search`, …). No host is hard-coded; a missing claim URL
   is shown as a configuration error.

Internal claims (`ent bundle api add`) work offline (verified with bundle CLI
1.2.3); external claims (`api add-ext`) need an attached instance (`ent attach-*`).

## Database (from step 17)

`announcement-ms` declares `dbms: postgresql`: Entando provisions a PostgreSQL
schema at install time and injects `SPRING_DATASOURCE_URL/USERNAME/PASSWORD`.
Locally, start the matching auxiliary service before the microservice:

    ent bundle svc start postgresql     # localhost:5432, db training26
    ent bundle svc stop postgresql

Flyway (`src/main/resources/db/migration`) owns the schema; Hibernate only
validates it. Tests use in-memory H2 in PostgreSQL mode and need no Docker.

## Local ports

| Component | Command (from its folder, Node 20+) | URL |
|---|---|---|
| announcement-ms | `ent bundle run announcement-ms` or `mvn spring-boot:run` | http://localhost:8081 |
| announcement-board | `npm start` | http://localhost:5173 |
| announcement-manager | `npm start` | http://localhost:5174 |
| announcement-board-config (step 18) | `npm start` | http://localhost:5175 |

Each Vite dev server uses a fixed port (`strictPort`) so the CORS origins and
the bookmarks used during the course never change.

## CORS

- Local: the widgets (`localhost:517x`) and the API (`localhost:8081`) have
  different origins, so the browser sends CORS requests. `announcement-ms`
  allows `http://localhost:*` and `http://127.0.0.1:*`
  (`announcement.cors.allowed-origin-patterns`, overridable with the
  `ANNOUNCEMENT_CORS_ALLOWED_ORIGIN_PATTERNS` environment variable).
- Deployed: widgets and the microservice ingress share the application host,
  so requests are same-origin and CORS does not apply. Verify on the first
  deployment (step 13).
- CORS is **not** security: curl, Postman and server-side callers ignore it.
  Authentication is added in step 20.

## Smoke test

    curl -s http://localhost:8081/api/health
    curl -s "http://localhost:8081/api/announcements/search?q=maintenance"
