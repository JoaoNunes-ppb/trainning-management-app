#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"

fail() {
  echo "Environment validation failed: $*" >&2
  exit 1
}

[[ -f "$ENV_FILE" ]] || fail "$ENV_FILE does not exist"

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

required=(
  DOMAIN IMAGE_TAG POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD
  DB_NAME DB_USER DB_PASS JWT_SECRET ADMIN_USERNAME ADMIN_PASSWORD
  CORS_ALLOWED_ORIGINS AWS_REGION AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
  S3_BUCKET S3_PREFIX
)

for name in "${required[@]}"; do
  [[ -n "${!name:-}" ]] || fail "$name is not set"
  [[ "${!name}" != *CHANGE_ME* ]] || fail "$name still contains CHANGE_ME"
done

[[ "$DOMAIN" != http://* && "$DOMAIN" != https://* && "$DOMAIN" != */* ]] ||
  fail "DOMAIN must be a hostname without a scheme or path"
[[ "$IMAGE_TAG" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$ ]] ||
  fail "IMAGE_TAG contains invalid characters"
(( ${#JWT_SECRET} >= 32 )) || fail "JWT_SECRET must contain at least 32 characters"
[[ "$CORS_ALLOWED_ORIGINS" == *"https://$DOMAIN"* ]] ||
  fail "CORS_ALLOWED_ORIGINS must include https://$DOMAIN"

command -v docker >/dev/null 2>&1 || fail "docker is not installed"
docker compose version >/dev/null 2>&1 || fail "docker compose is not available"
command -v curl >/dev/null 2>&1 || fail "curl is not installed"

cd "$APP_DIR"
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml config --quiet ||
  fail "Docker Compose configuration is invalid"

echo "Environment validation passed."
