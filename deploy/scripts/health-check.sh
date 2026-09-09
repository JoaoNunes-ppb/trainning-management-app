#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
HEALTH_PATH="${HEALTH_PATH:-/health/backend}"
HEALTH_ATTEMPTS="${HEALTH_ATTEMPTS:-30}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-5}"

[[ -f "$ENV_FILE" ]] || {
  echo "Missing environment file: $ENV_FILE" >&2
  exit 1
}

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${DOMAIN:?DOMAIN must be set in $ENV_FILE}"
[[ "$HEALTH_PATH" == /* ]] || HEALTH_PATH="/$HEALTH_PATH"
url="https://${DOMAIN}${HEALTH_PATH}"

cd "$APP_DIR"
for service in postgres app web backup; do
  if [[ -z "$(docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml ps -q "$service")" ]]; then
    echo "Service is not running: $service" >&2
    exit 1
  fi
done

for ((attempt = 1; attempt <= HEALTH_ATTEMPTS; attempt++)); do
  if curl --fail --silent --show-error --location \
    --connect-timeout 5 --max-time 15 "$url" >/dev/null; then
    echo "HTTPS health check passed: $url"
    exit 0
  fi
  echo "Health check attempt $attempt/$HEALTH_ATTEMPTS failed; retrying..." >&2
  sleep "$HEALTH_INTERVAL"
done

echo "HTTPS health check failed: $url" >&2
exit 1
