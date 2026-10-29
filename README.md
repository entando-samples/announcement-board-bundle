# training26 — Announcement Board (Entando 7.5 bundle)

Hands-on bundle for E101 – Entando Developer Training, Day 2.

Staff publish short announcements; anyone can search published ones; only
signed-in users can read full details or manage content (from step 20).

## Components

| Component | Folder | Purpose |
|---|---|---|
| announcement-ms | microservices/announcement-ms | Spring Boot 3 / Java 17 REST API |
| announcement-board | microfrontends/announcement-board | Public, configurable search widget |
| announcement-manager | microfrontends/announcement-manager | Editor widget (create / edit / delete) |
| announcement-board-config | microfrontends/announcement-board-config | App Builder config screen for the board |

## Prerequisites

- Entando CLI 7.5 (`ent`), attached to a 7.5 instance for API claims and deploy
- JDK 17, Maven 3.6.3+
- Node.js 20+ (Vite 6 does not run on Node 14)

  `ent` runs component commands with its own private Node (14.20.0 in ent
  7.5.3), so `ent bundle build|run|pack` fail on the Vite MFEs out of the box.
  Reinstall the private Node once, then re-check:

      ENTANDO_NODE_VERSION_OVERRIDE=v20.19.5 ent check-env base-develop

  Until then, build and run the MFEs with `npm run build` / `npm start` from
  their folders using a Node 20+ installation.

  **Warning:** with the Node 14 runtime, `ent bundle build` and `ent bundle
  pack` report success even though every Vite build failed (see
  `.entando/logs/<mfe>.log`). The bundle would then ship whatever stale
  `dist/` folder is on disk. Always run `npm run verify` in each MFE folder
  with Node 20+ right before `ent bundle pack`.
- Docker (local `svc` services: PostgreSQL, Keycloak)

## Steps

Every step is a commit tagged `step-NN`; `git checkout step-NN` gives the
repository state at the end of that step. See `doc/labs/steps.md`.

API security: steps 1–19 are intentionally PUBLIC; step 20 protects every
operation except `GET /api/announcements/search` (and the health probe) with
the Keycloak realm of the Entando application (`doc/adr/ADR-003-…`).

## Quick start (local)

    ent bundle svc start postgresql keycloak
    (cd microservices/announcement-ms && mvn spring-boot:run)
    (cd microfrontends/announcement-board && npm install && npm start)     # :5173
    (cd microfrontends/announcement-manager && npm install && npm start)   # :5174

Sign in with admin / admin from the bar at the top of the local pages.
Verify: `mvn test`, `npm run verify` in each MFE, `tests/api/run-secured.sh`.

## Documentation

- `doc/adr/` architecture decisions
- `doc/api/` REST contract
- `doc/runbooks/` local development, deployment, Keycloak
- `doc/labs/` lab checklists
