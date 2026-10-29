# announcement-ms REST contract (row 31)

Paths are relative to the microservice context path. In Entando the platform
sets the context path (`SERVER_SERVLET_CONTEXT_PATH`) and the API claim URL
already includes it, so micro frontends append only the paths below.

JSON everywhere; timestamps are ISO-8601 UTC strings.

## Operations

| # | Method and path | Purpose | Success | Access until step 19 | Access from step 20 |
|---|---|---|---|---|---|
| O1 | `GET /api/announcements/search` | Public search of published announcements | 200 `Page<Summary>` | anonymous | **anonymous** |
| O2 | `GET /api/announcements` | Management list (drafts included) | 200 `Page<Item>` | anonymous | bearer token |
| O3 | `GET /api/announcements/{id}` | Full detail | 200 `Item` | anonymous | bearer token |
| O4 | `POST /api/announcements` | Create | 201 `Item` + `Location` | anonymous | bearer token |
| O5 | `PUT /api/announcements/{id}` | Replace (including status) | 200 `Item` | anonymous | bearer token |
| O6 | `DELETE /api/announcements/{id}` | Delete | 204 | anonymous | bearer token |
| O7 | `GET /v3/api-docs`, `/swagger-ui.html` | OpenAPI document and UI | 200 | anonymous | bearer token |
| I1 | `GET /api/health` | Platform health probe | 200 `{"status":"UP"}` | anonymous | anonymous (infrastructure) |

`{id}` is numeric; `/api/announcements/search` never matches the `{id}` route.

## O1 — public search

Query parameters:

| Name | Type | Default | Rules |
|---|---|---|---|
| `q` | string | – | optional, trimmed, ≤ 100 characters; case-insensitive match on title or summary |
| `category` | enum | – | optional: `GENERAL`, `TRAINING`, `EVENT`, `MAINTENANCE` |
| `page` | integer | 0 | ≥ 0 |
| `size` | integer | 10 | 1–50 |

Results are always restricted to `status = PUBLISHED` and ordered by
`publishedAt` descending (then `id` descending). Clients cannot change either.

Each `Summary` contains **only** `id`, `title`, `summary`, `category`,
`publishedAt`. Never `body`, `status`, `createdBy`, or drafts.

From step 20 the endpoint ignores credentials: no, valid, malformed or expired
`Authorization` headers all give the same anonymous result.

## Representations

`Page<T>`: `{ "items": T[], "page": 0, "size": 10, "totalItems": 3, "totalPages": 1 }`

`Item` (O2–O5):

| Field | Notes |
|---|---|
| `id` | number |
| `title`, `summary`, `body` | strings |
| `category` | enum |
| `status` | `DRAFT` or `PUBLISHED` |
| `publishedAt` | set when first published; `null` while draft |
| `createdAt`, `updatedAt` | server-managed |
| `createdBy` | `anonymous` until step 20, then the token's `preferred_username` |

`AnnouncementInput` (O4, O5 request body):

| Field | Rules |
|---|---|
| `title` | required, 3–120 characters after trimming |
| `summary` | required, 1–280 characters after trimming |
| `body` | required, 1–4000 characters after trimming |
| `category` | required enum |
| `status` | required, `DRAFT` or `PUBLISHED` |

O2 query parameters: `status` (optional enum), `page` (≥ 0, default 0),
`size` (1–100, default 20). Ordered by `updatedAt` descending.

## Errors — RFC 7807 Problem Details (`application/problem+json`)

| Status | When | Body |
|---|---|---|
| 400 | Invalid body, query parameter or path variable | `title`, `status`, `detail`, `errors: [{ field, message }]` |
| 404 | Unknown `id` | `detail` names the id |
| 401 | Step 20+: missing, malformed, expired or untrusted token on O2–O7 | `WWW-Authenticate: Bearer …`; no business data |
| 403 | Step 20+, optional role only: authenticated but not allowed | no business data |
| 500 | Unexpected failure | generic message, no stack trace |

## Health

Spring Boot Actuator with base path `/api`; only `health` is exposed. It is the
`healthCheckPath` of the microservice in `entando.json`.
