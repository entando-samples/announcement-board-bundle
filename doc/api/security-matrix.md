# Security regression matrix

Phase A = steps 10–19 (public API, by design). Phase B = step 20 onward
(Keycloak bearer tokens). "Postman" = `tests/api` collection;
"backend" = `announcement-ms` automated tests.

| # | Request | Phase A | Phase B | Covered by |
|---|---|---|---|---|
| S1 | GET search, no token | 200 | 200 | backend, Postman |
| S2 | GET search, valid token | 200 | 200 | backend, Postman |
| S3 | GET search, malformed or expired token | 200 | 200 (token ignored) | backend, Postman |
| S4 | GET search payload | summaries only | summaries only | backend, Postman |
| S5 | GET list, no token | 200 | 401 | backend, Postman |
| S6 | GET detail, no token | 200 | 401 | backend, Postman |
| S7 | GET detail of unknown id, no token | 404 | 401 (no existence leak) | backend, Postman |
| S8 | POST / PUT / DELETE, no token | 2xx | 401 + `WWW-Authenticate: Bearer` | backend, Postman |
| S9 | Protected operation, expired token | 2xx | 401 | backend, Postman |
| S10 | Protected operation, bad signature or wrong issuer | 2xx | 401 | backend |
| S11 | Protected operation, valid token | 2xx | 2xx | backend, Postman |
| S13 | OpenAPI document, no token | 200 | 401 | backend, Postman |
| S14 | `/api/health`, no token | 200 | 200 (infrastructure exemption) | backend, Postman |
| S16 | CORS preflight of a protected operation | 200 | 200 (no token on preflight) | backend |
| S17 | 401 bodies contain no business data | n/a | yes | backend, Postman |
| S18 | Board signed out: search works, "Read more" asks to sign in | works | as stated | MFE tests |
| S19 | Manager signed out: sign-in panel, no API call | works | as stated | MFE tests |
| S20 | Manager signed in: CRUD with token | n/a | yes | MFE tests |
| S21 | 401 mid-session → token refresh → one retry, then sign-in | n/a | yes | MFE tests |

S12 (403 for a missing role) applies only if the optional editor role is enabled.

## Phase A results (step 19)

- Backend: `PublicAccessIntegrationTest` — every operation works anonymously.
- Postman, local environment: 15 requests, 32 assertions, 0 failures.
