# Demo script and acceptance (after step 20)

Local setup: `ent bundle svc start keycloak postgresql`, `announcement-ms`
running, `npm start` in the board (5173), manager (5174) and board-config
(5175) folders. On an Entando instance, use a published page with the board
(configured) and a page with the manager.

1. Signed out, open the board. Title, page size and default category follow
   the widget configuration; dates follow the page language.
2. Search "maintenance": only published announcements, no drafts.
3. "Read more": the board asks to sign in, no content is shown.
4. Run `tests/api/run-secured.sh`: search answers 200 with no, malformed and
   expired tokens; list/detail/create/update/delete answer 401 without a valid
   token; the full lifecycle works with one.
5. Sign in and open the manager: create a draft, check it is not in the board
   search, publish it, check it appears.
6. "Read more" on the board now shows the full text.
7. In App Builder change `pageSize` to 3 (local: edit
   `announcement-board/public/mfe-config.json`): the board shows 3 items.
8. Sign out: the manager returns to the sign-in panel and shows no data.

## Acceptance criteria

| AC | Criterion | Evidence |
|---|---|---|
| AC1 | Bundle packs, publishes and installs on Entando 7.5 | `ent bundle pack` (descriptors validated locally); publish/install on the training instance |
| AC2 | Two widgets and one config MFE, React + TypeScript + Vite | `entando.json`, `npm run verify` in each MFE |
| AC3 | Board configurable through App Builder, with defaults and fallbacks | `boardParams` + config MFE tests; App Builder check on the instance |
| AC4 | Context parameters consumed | `context.test.ts`; `config` attribute on the instance |
| AC5 | Shadow-DOM style isolation | local page with hostile CSS (checked in Chrome) |
| AC6 | Data in provisioned PostgreSQL survives restarts | local svc PostgreSQL restart check |
| AC7 | Phase A matrix passes at step 19 | `step-19` Postman run: 32/32 assertions |
| AC8 | Phase B matrix passes from step 20 | `SecurityIntegrationTest`, `run-secured.sh` |
| AC9 | Automated suites green at every step | `mvn test`, `npm run verify` |
