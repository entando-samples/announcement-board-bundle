# Runbook — Keycloak (step 20)

## Local

    ent bundle svc start keycloak postgresql

- Console: http://localhost:9080/auth (admin / admin)
- Realm `entando-dev`, issuer `http://localhost:9080/auth/realms/entando-dev`
- Realm users: `admin` (password `admin`), `user`
- Browser client used by the local containers: `web_app` (public, PKCE)
- Test-only client added by this bundle: `training26-api-tests` (public,
  direct access grants, 20 s tokens). Local realm only.

`announcement-ms` needs no extra configuration locally: its `issuer-uri`
defaults to the local realm.

The local `index.html` of each widget plays the role of the Entando page: it
loads `keycloak.js` from the server, initialises it once with `check-sso`,
stores it on `window.entando.keycloak`, and re-emits its callbacks as
`keycloak` window events. Use the bar at the top to sign in or out.

### Troubleshooting: Keycloak keeps restarting

`docker ps` shows `training26-keycloak-1 Restarting` and the log repeats
"User with username 'admin' already added". The first start failed because
the container user (uid 1000) cannot write `svc/keycloak/keycloak-db`
(owned by another uid on the host). Fix:

    ent bundle svc stop keycloak
    chmod 777 svc/keycloak/keycloak-db
    docker rm training26-keycloak-1
    ent bundle svc start keycloak

## Live API security check

    tests/api/run-secured.sh

The script gets an access token from `training26-api-tests`, waits 85 s so it is
really expired (20 s lifespan + 60 s clock skew accepted by Spring Security),
gets a fresh token, and runs the Postman collection: public search with no,
valid, malformed and expired tokens; full lifecycle with a token; and 401 for
every protected operation with no, malformed and expired tokens.

Manual token, for curl or Postman:

    curl -s -X POST http://localhost:9080/auth/realms/entando-dev/protocol/openid-connect/token \
      -d grant_type=password -d client_id=training26-api-tests -d username=admin -d password=admin

## Entando cluster

- Entando creates a Keycloak client for `announcement-ms` at install time and
  injects `KEYCLOAK_AUTH_URL` and `KEYCLOAK_REALM`; the issuer is derived from
  them. Check the values: `ent kubectl describe pod <announcement-ms pod>`.
- Decode a token issued on the portal (browser dev tools: the `Authorization`
  header of a manager call) and compare its `iss` with
  `KEYCLOAK_AUTH_URL/realms/KEYCLOAK_REALM`. If they differ only by host
  (external vs. internal), set `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI`
  to the token's `iss` and, if the pod cannot reach that host,
  `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_JWK_SET_URI` to the internal
  `.../protocol/openid-connect/certs` URL (microservice `env` in `entando.json`).
- The page that hosts the widgets must initialise Keycloak (the standard
  Entando page templates do; check that `window.entando.keycloak` exists).
- Run the Postman collection with `cluster.postman_environment.json`, adding
  `accessToken` and `expiredToken` taken from the portal.
