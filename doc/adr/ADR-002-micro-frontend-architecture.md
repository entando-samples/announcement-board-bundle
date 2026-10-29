# ADR-002 — Micro frontend architecture

Status: accepted (row 26)

## Decision

Three micro frontends, each a custom element built with React + TypeScript +
Vite in library mode:

| MFE | Entando type | Responsibility |
|---|---|---|
| `announcement-board` | widget | Public search (text, category, paging); "Read more" detail; configurable |
| `announcement-manager` | widget | List including drafts, create, edit, publish/unpublish, delete |
| `announcement-board-config` | widget-config | App Builder form for the board parameters |

- The platform renders each widget as its custom element and passes a JSON
  `config` attribute: `systemParams.api[claim].url`, `params`, `contextParams`.
- MFEs never hard-code a backend host: the URL comes from the API claim.
- The two widgets cooperate through the backend (manager publishes, board
  finds). Browser-event communication is a Day 3 topic and is not used.
- Styles are scoped to the element (class prefix; shadow DOM for the board
  from step 16) so that they never restyle the portal page.
- Security is enforced by the microservice. MFEs only adapt the UI (sign-in
  prompts, hidden actions).

## Consequences

Independent builds and releases per MFE; one shared runtime contract
(`doc/api/mfe-contract.md`); a third MFE is needed for configuration because
Entando widget configuration requires a dedicated `widget-config` MFE.
