# ADR-001 — Training feature: Announcement Board

Status: accepted (row 26)

## Context

The Day 2 labs need one small feature that exercises a Java 17 REST
microservice, two React/TypeScript/Vite micro frontends, a configurable widget,
a provisioned database and, at the end, Keycloak-protected APIs with a single
public search endpoint.

## Decision

Build an **Announcement Board**: staff publish short notices; anyone searches
published notices; only signed-in users read full detail or manage content.

Alternatives considered: service request board (requests are not naturally
public, workflow states add scope) and training task tracker (no natural public
search).

## Data model — `Announcement`

| Attribute | Rules |
|---|---|
| id | server-assigned numeric key |
| title | required, 3–120 characters |
| summary | required, ≤ 280 characters, shown in search |
| body | required, ≤ 4000 characters, never in search results |
| category | `GENERAL`, `TRAINING`, `EVENT`, `MAINTENANCE` |
| status | `DRAFT` (default) or `PUBLISHED` |
| publishedAt | set when first published, cleared when back to draft |
| createdAt / updatedAt | server-managed |
| createdBy | `anonymous` until step 20, then the token's `preferred_username` |

## Out of scope

Attachments, rich text, scheduling, content i18n, multitenancy, live
MFE-to-MFE events (Day 3 row 48).

## Consequences

One entity and seven operations keep every lab under 40 minutes; the public
search versus protected detail split demonstrates that not every GET is public.
