#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
PREVIOUS_TAG="${1:-}"

[[ -n "$PREVIOUS_TAG" ]] || {
  echo "Usage: $0 PREVIOUS_IMAGE_TAG" >&2
  exit 2
}
[[ "$PREVIOUS_TAG" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$ ]] || {
  echo "Invalid image tag: $PREVIOUS_TAG" >&2
  exit 2
}
[[ -f "$ENV_FILE" ]] || {
  echo "Missing environment file: $ENV_FILE" >&2
  exit 1
}

update_image_tag() {
  local tag="$1"
  local next_env="$APP_DIR/.env.rollback"
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
echo "Rolling back to image tag $PREVIOUS_TAG..."
update_image_tag "$PREVIOUS_TAG"
export IMAGE_TAG="$PREVIOUS_TAG"
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml pull
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml up -d --remove-orphans
"$APP_DIR/deploy/scripts/health-check.sh"
echo "Rollback to $PREVIOUS_TAG completed."
