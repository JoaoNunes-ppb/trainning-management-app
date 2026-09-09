#!/usr/bin/env bash
set -Eeuo pipefail

log() {
  printf '[%s] %s\n' "$(date -Iseconds)" "$*"
}

fail() {
  log "ERROR: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

require_env() {
  [[ -n "${!1:-}" ]] || fail "Required environment variable is not set: $1"
}

require_command aws
require_command gzip
require_command pg_dump
require_command sha256sum

require_env AWS_REGION
require_env S3_BUCKET
require_env DB_PASS

DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-athlete}"
DB_NAME="${DB_NAME:-athletedb}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
STATUS_DIR="${STATUS_DIR:-/status}"
S3_PREFIX="${S3_PREFIX:-backups/athlete-manager}"
LOCAL_BACKUP_RETENTION_DAYS="${LOCAL_BACKUP_RETENTION_DAYS:-3}"

[[ "$LOCAL_BACKUP_RETENTION_DAYS" =~ ^[0-9]+$ ]] ||
  fail "LOCAL_BACKUP_RETENTION_DAYS must be a non-negative integer"
[[ "$S3_BUCKET" != s3://* && "$S3_BUCKET" != */* ]] ||
  fail "S3_BUCKET must be a bucket name, not a URI or path"

S3_PREFIX="${S3_PREFIX#/}"
S3_PREFIX="${S3_PREFIX%/}"
[[ -n "$S3_PREFIX" ]] || fail "S3_PREFIX must not be empty"

mkdir -p "$BACKUP_DIR" "$STATUS_DIR"
umask 077

timestamp="$(date -u +%Y%m%d_%H%M%S)"
backup_name="athletedb_${timestamp}.sql.gz"
backup_path="${BACKUP_DIR}/${backup_name}"
checksum_path="${backup_path}.sha256"
partial_path="${backup_path}.partial"
finish() {
  local status=$?
  rm -f "$partial_path"
  if ((status != 0)); then
    date -Iseconds >"${STATUS_DIR}/last_failure"
  fi
  exit "$status"
}
trap finish EXIT

log "Creating PostgreSQL backup ${backup_name}"
if ! PGPASSWORD="$DB_PASS" pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --no-owner \
  --no-privileges \
  | gzip -c >"$partial_path"; then
  fail "pg_dump failed; no backup was published"
fi

[[ -s "$partial_path" ]] || fail "pg_dump produced an empty backup"
gzip -t "$partial_path" || fail "Generated backup is not a valid gzip file"
mv "$partial_path" "$backup_path"

(
  cd "$BACKUP_DIR"
  sha256sum "$backup_name" >"${backup_name}.sha256"
)
checksum="$(awk '{print $1}' "$checksum_path")"
[[ "$checksum" =~ ^[[:xdigit:]]{64}$ ]] || fail "Could not generate SHA-256 checksum"

s3_base="s3://${S3_BUCKET}/${S3_PREFIX}"
log "Uploading backup and checksum to ${s3_base}/"
aws --region "$AWS_REGION" s3 cp "$backup_path" "${s3_base}/${backup_name}" \
  --only-show-errors \
  --metadata "sha256=${checksum}"
aws --region "$AWS_REGION" s3 cp "$checksum_path" "${s3_base}/${backup_name}.sha256" \
  --only-show-errors

local_size="$(wc -c <"$backup_path" | tr -d '[:space:]')"
remote_size="$(aws --region "$AWS_REGION" s3api head-object \
  --bucket "$S3_BUCKET" \
  --key "${S3_PREFIX}/${backup_name}" \
  --query ContentLength \
  --output text)"
remote_size="${remote_size//[[:space:]]/}"
remote_checksum="$(aws --region "$AWS_REGION" s3api head-object \
  --bucket "$S3_BUCKET" \
  --key "${S3_PREFIX}/${backup_name}" \
  --query Metadata.sha256 \
  --output text)"
remote_checksum="${remote_checksum//[[:space:]]/}"
aws --region "$AWS_REGION" s3api head-object \
  --bucket "$S3_BUCKET" \
  --key "${S3_PREFIX}/${backup_name}.sha256" \
  >/dev/null

[[ "$remote_size" == "$local_size" ]] ||
  fail "Remote backup size mismatch (local ${local_size}, remote ${remote_size})"
remote_checksum="$(printf '%s' "$remote_checksum" | tr '[:upper:]' '[:lower:]')"
[[ "$remote_checksum" == "$checksum" ]] ||
  fail "Remote backup checksum metadata does not match the local checksum"

retention_minutes=$((LOCAL_BACKUP_RETENTION_DAYS * 1440))
find "$BACKUP_DIR" -type f \
  \( -name 'athletedb_*.sql.gz' -o -name 'athletedb_*.sql.gz.sha256' \) \
  -mmin "+${retention_minutes}" -delete

log "Backup uploaded and verified: ${s3_base}/${backup_name}"
date -Iseconds >"${STATUS_DIR}/last_success"
rm -f "${STATUS_DIR}/last_failure"
