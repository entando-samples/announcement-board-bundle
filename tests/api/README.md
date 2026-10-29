# API regression suite (Postman)

Black-box tests of `announcement-ms`, run with the Postman CLI:

    postman collection run tests/api/announcement-api.postman_collection.json \
      -e tests/api/local.postman_environment.json

- `local.postman_environment.json`: microservice on `http://localhost:8081`.
- `cluster.postman_environment.json`: fill in the ingress URL of the
  installed bundle (`ent kubectl describe ingress`).

The collection mirrors `doc/api/security-matrix.md`. Up to step 19 every
operation was expected to work **without credentials** (`git checkout
step-19`). From step 20 the management operations need `accessToken` and the
security folder checks the 401 cases. Run it with the tokens from the local
Keycloak:

    tests/api/run-secured.sh

(see `doc/runbooks/keycloak.md`).

Each run creates one announcement with a unique `runId` and deletes it at the end.
