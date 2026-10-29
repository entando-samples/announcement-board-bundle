# ADR-003 — API security with the provisioned Keycloak

Status: accepted (step 20, schedule row 46 "Protect the MFE-MS communication")

## Context

Until step 19 every operation of `announcement-ms` is public, on purpose, so
the trainees can build and test without tokens. Entando applications use one
Keycloak realm; Entando injects `KEYCLOAK_AUTH_URL`, `KEYCLOAK_REALM`,
`KEYCLOAK_CLIENT_ID` and `KEYCLOAK_CLIENT_SECRET` into every bundle
microservice and shares one Keycloak JS adapter per page on
`window.entando.keycloak`. Keycloak's presence does **not** protect a
microservice by itself: the service has to validate tokens.

## Decision

1. `announcement-ms` is an OAuth 2.0 **resource server** (Spring Security,
   JWT). Tokens are validated for signature (realm JWKS), issuer
   (`KEYCLOAK_AUTH_URL/realms/KEYCLOAK_REALM`) and expiry. The JWKS is fetched
   lazily, so the service starts without Keycloak.
2. **Authentication only.** Any valid access token of the realm is accepted;
   no role or audience is checked. Browser tokens are issued to the page's
   client, not to the microservice client. Optional extension: declare
   `roles: ["announcement-editor"]` on the microservice in `entando.json` and
   require that client role on write operations (403 otherwise).
3. **Anonymous exceptions**, matched by exact method and path:
   - `GET /api/announcements/search` — the public search. Its bearer token is
     never even read, so a malformed or expired token cannot turn it into a 401.
   - `GET /api/health` — the platform health probe (Kubernetes sends no token).
   - CORS preflight (`OPTIONS`).
   Everything else, including the other GET operations and the OpenAPI
   document, requires a token (deny by default).
4. Stateless, no session, CSRF disabled (bearer tokens only, no cookies).
5. 401 and 403 carry `WWW-Authenticate: Bearer …` and a Problem Details body
   without business data. Authentication runs before the controllers, so an
   unknown id gives 401, not 404.
6. Micro frontends use the shared adapter: the board sends no token for search
   and a token for "Read more"; the manager sends a token on every call. On a
   401 they refresh the token once and retry, then ask the user to sign in.
   The UI only reflects the backend decision; it is not the enforcement point.
7. The principal name (stored as `createdBy`) is the token's
   `preferred_username`, falling back to `sub`.

## Consequences and known limits

- **Clock skew:** Spring Security accepts a token up to 60 s after its `exp`
  (default skew between Keycloak and the pods).
- **Issuer vs. reachable URL:** the issuer in the tokens is the external
  Keycloak URL. If the pod cannot reach it, set
  `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_JWK_SET_URI` to an internal JWKS
  URL; the issuer is still checked against `issuer-uri`. Verify the value of
  `KEYCLOAK_AUTH_URL` on the target instance (`ent kubectl describe pod`).
- Without an audience check, a token issued for another client of the same
  realm is accepted. The optional role closes that gap where needed.
- `KEYCLOAK_CLIENT_ID/SECRET` are not used: the service calls no other service.
