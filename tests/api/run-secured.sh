#!/usr/bin/env bash
# Phase B (step 20+) live security check against the LOCAL svc Keycloak.
#
# Gets an access token from the local-only client "training26-api-tests"
# (realm entando-dev, 20 s token lifespan), waits until it has expired, gets a
# fresh one, and runs the Postman collection with both tokens.
#
# Spring Security accepts tokens up to 60 s after their expiry (default clock
# skew between Keycloak and the service), so "expired" here means 20 + 60 s.
#
# Prerequisites: ent bundle svc start keycloak postgresql; announcement-ms
# running on BASE_URL; postman CLI and python3 on the PATH.
set -euo pipefail

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:9080/auth}"
REALM="${REALM:-entando-dev}"
CLIENT_ID="${CLIENT_ID:-training26-api-tests}"
KC_USERNAME="${KC_USERNAME:-admin}"
KC_PASSWORD="${KC_PASSWORD:-admin}"
BASE_URL="${BASE_URL:-http://localhost:8081}"
HERE="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$(mktemp --suffix=.postman_environment.json)"
trap 'rm -f "$ENV_FILE"' EXIT

token() {
  curl -sf -X POST "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
    -d grant_type=password -d client_id="$CLIENT_ID" \
    --data-urlencode username="$KC_USERNAME" --data-urlencode password="$KC_PASSWORD" |
    python3 -c 'import json, sys; print(json.load(sys.stdin)["access_token"])'
}

expired="$(token)"
echo "Waiting 85 s for the first token to expire (20 s lifespan + 60 s clock skew)..." >&2
sleep 85
valid="$(token)"

python3 - "$ENV_FILE" "$BASE_URL" "$valid" "$expired" <<'PY'
import json, sys
path, base_url, valid, expired = sys.argv[1:]
values = {"baseUrl": base_url, "accessToken": valid, "expiredToken": expired}
json.dump({"name": "training26 local (secured)",
           "values": [{"key": k, "value": v, "enabled": True} for k, v in values.items()]},
          open(path, "w"))
PY

postman collection run "$HERE/announcement-api.postman_collection.json" -e "$ENV_FILE"
