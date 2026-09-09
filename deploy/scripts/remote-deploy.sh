#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
NEW_TAG="${1:-}"
STATE_DIR="$APP_DIR/.deploy"
LOCK_FILE="$STATE_DIR/deploy.lock"
PREVIOUS_TAG_FILE="$STATE_DIR/previous-image-tag"

[[ -n "$NEW_TAG" ]] || {
  echo "Usage: $0 IMAGE_TAG" >&2
  exit 2
}
[[ "$NEW_TAG" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$ ]] || {
  echo "Invalid image tag: $NEW_TAG" >&2
  exit 2
}
command -v flock >/dev/null 2>&1 || {
  echo "flock is required on the deployment server" >&2
  exit 1
}

mkdir -p "$STATE_DIR"
exec 9>"$LOCK_FILE"
flock -n 9 || {
  echo "Another deployment is already running." >&2
  exit 1
}

[[ -f "$ENV_FILE" ]] || {
  echo "Missing environment file: $ENV_FILE" >&2
  exit 1
}

current_tag="$(sed -n 's/^IMAGE_TAG=//p' "$ENV_FILE" | tail -n 1)"
if [[ -z "$current_tag" ]]; then
  echo "IMAGE_TAG must already be set in $ENV_FILE to enable rollback." >&2
  exit 1
fi
printf '%s\n' "$current_tag" > "$PREVIOUS_TAG_FILE"

update_image_tag() {
  local tag="$1"
  local next_env="$APP_DIR/.env.deploy"
  awk -v tag="$tag" '
    BEGIN { updated = 0 }
    /^IMAGE_TAG=/ {
      if (!updated) {
        print "IMAGE_TAG=" tag
        updated = 1
      }
      next
    }
    { print }
    END {
      if (!updated) print "IMAGE_TAG=" tag
    }
  ' "$ENV_FILE" > "$next_env"
  chmod --reference="$ENV_FILE" "$next_env"
  mv "$next_env" "$ENV_FILE"
}

cd "$APP_DIR"
export IMAGE_TAG="$current_tag"

if [[ -n "$(docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml ps -q postgres 2>/dev/null)" ]]; then
  echo "Running pre-deployment backup..."
  docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml \
    run --rm --no-deps --entrypoint /usr/local/bin/backup.sh backup
else
  echo "No existing stack detected; skipping pre-deployment backup."
fi

echo "Deploying image tag $NEW_TAG..."
update_image_tag "$NEW_TAG"
export IMAGE_TAG="$NEW_TAG"

if "$APP_DIR/deploy/scripts/validate-env.sh" &&
  docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml pull &&
  docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml up -d --remove-orphans &&
  "$APP_DIR/deploy/scripts/health-check.sh"; then
  echo "Deployment of $NEW_TAG completed."
  docker image prune -f
  exit 0
fi

echo "Deployment failed; rolling back to $current_tag." >&2
if "$APP_DIR/deploy/scripts/rollback.sh" "$current_tag"; then
  echo "Rollback completed after failed deployment." >&2
else
  echo "Rollback also failed; manual intervention is required." >&2
fi
exit 1
