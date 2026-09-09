#!/usr/bin/env bash
set -Eeuo pipefail

log() {
  printf '[%s] %s\n' "$(date -Iseconds)" "$*" >&2
}

fail() {
  log "ERROR: $*" >&2
  exit 1
}

DOWNLOAD_DIR=""
cleanup() {
  [[ -z "$DOWNLOAD_DIR" ]] || rm -rf "$DOWNLOAD_DIR"
}
trap cleanup EXIT

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

usage() {
  cat <<EOF
Usage:
  $0 list
  $0 download [latest|BACKUP_NAME]
  $0 s3 [latest|BACKUP_NAME]
  $0 local [latest|PATH]

The s3 and local commands restore a verified backup. Set RESTORE_CONFIRM=YES
for non-interactive restores; interactive restores require typing the database name.
EOF
}

require_db_config() {
  [[ -n "${DB_PASS:-}" ]] || fail "Required environment variable is not set: DB_PASS"
}

require_s3_config() {
  [[ -n "${AWS_REGION:-}" ]] || fail "Required environment variable is not set: AWS_REGION"
  [[ -n "${S3_BUCKET:-}" ]] || fail "Required environment variable is not set: S3_BUCKET"
  [[ "$S3_BUCKET" != s3://* && "$S3_BUCKET" != */* ]] ||
    fail "S3_BUCKET must be a bucket name, not a URI or path"
}

is_backup_name() {
  [[ "$1" =~ ^athletedb_[0-9]{8}_[0-9]{6}\.sql\.gz$ ]]
}

latest_local() {
  local latest
  latest="$(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'athletedb_*.sql.gz' \
    ! -name '*_pre_restore_*' -print | sort | tail -n 1)"
  [[ -n "$latest" ]] || fail "No local backups found in ${BACKUP_DIR}"
  printf '%s\n' "$latest"
}

remote_names() {
  local key keys
  require_s3_config
  if ! keys="$(aws --region "$AWS_REGION" s3api list-objects-v2 \
    --bucket "$S3_BUCKET" \
    --prefix "${S3_PREFIX}/athletedb_" \
    --query 'Contents[].Key' \
    --output text)"; then
    fail "Could not list backups in s3://${S3_BUCKET}/${S3_PREFIX}/"
  fi
  while IFS= read -r key; do
    key="${key#"${S3_PREFIX}/"}"
    if is_backup_name "$key"; then
      printf '%s\n' "$key"
    fi
  done < <(printf '%s\n' "$keys" | tr '\t' '\n')
}

latest_remote_name() {
  local latest
  latest="$(remote_names | sort | tail -n 1)"
  [[ -n "$latest" ]] || fail "No S3 backups found at s3://${S3_BUCKET}/${S3_PREFIX}/"
  printf '%s\n' "$latest"
}

verify_backup() {
  local archive="$1"
  local sidecar="${archive}.sha256"
  local actual_checksum extra listed_name expected_checksum

  [[ -s "$archive" ]] || fail "Backup is missing or empty: $archive"
  [[ -s "$sidecar" ]] || fail "Checksum sidecar is missing or empty: $sidecar"
  gzip -t "$archive" || fail "Backup is not a valid gzip file: $archive"
  read -r expected_checksum listed_name extra <"$sidecar" ||
    fail "Could not read checksum sidecar: $sidecar"
  [[ "$expected_checksum" =~ ^[[:xdigit:]]{64}$ &&
    "$listed_name" == "$(basename "$archive")" &&
    -z "$extra" ]] ||
    fail "Checksum sidecar has an invalid format or filename"
  actual_checksum="$(sha256sum "$archive" | awk '{print $1}')"
  [[ "$actual_checksum" == "$expected_checksum" ]] ||
    fail "Checksum verification failed for $archive"
}

download_backup() {
  local requested="${1:-latest}"
  local download_dir name

  require_s3_config
  if [[ "$requested" == latest ]]; then
    name="$(latest_remote_name)"
  else
    is_backup_name "$requested" || fail "Invalid backup name: $requested"
    name="$requested"
  fi

  mkdir -p "$BACKUP_DIR"
  download_dir="${BACKUP_DIR}/.restore-download.$$"
  DOWNLOAD_DIR="$download_dir"
  rm -rf "$download_dir"
  mkdir -m 0700 "$download_dir"
  log "Downloading s3://${S3_BUCKET}/${S3_PREFIX}/${name}"
  if ! aws --region "$AWS_REGION" s3 cp \
    "s3://${S3_BUCKET}/${S3_PREFIX}/${name}" "${download_dir}/${name}" \
    --only-show-errors; then
    rm -rf "$download_dir"
    fail "Failed to download S3 backup ${name}"
  fi
  if ! aws --region "$AWS_REGION" s3 cp \
    "s3://${S3_BUCKET}/${S3_PREFIX}/${name}.sha256" "${download_dir}/${name}.sha256" \
    --only-show-errors; then
    rm -rf "$download_dir"
    fail "Failed to download checksum for S3 backup ${name}"
  fi
  verify_backup "${download_dir}/${name}"
  mv "${download_dir}/${name}" "${BACKUP_DIR}/${name}"
  mv "${download_dir}/${name}.sha256" "${BACKUP_DIR}/${name}.sha256"
  rmdir "$download_dir"
  DOWNLOAD_DIR=""
  printf '%s\n' "${BACKUP_DIR}/${name}"
}

confirm_restore() {
  local answer
  [[ "${RESTORE_CONFIRM:-}" == YES ]] && return
  [[ -t 0 ]] || fail "Refusing non-interactive restore without RESTORE_CONFIRM=YES"
  printf "Type '%s' to confirm replacing database '%s': " "$DB_NAME" "$DB_NAME" >&2
  read -r answer
  [[ "$answer" == "$DB_NAME" ]] || fail "Restore cancelled"
}

database_exists() {
  local result
  if ! result="$(PGPASSWORD="$DB_PASS" psql \
    --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
    --dbname=postgres --tuples-only --no-align \
    --command="SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'")"; then
    fail "Could not determine whether database ${DB_NAME} exists"
  fi
  [[ "$result" == 1 ]]
}

create_safety_backup() {
  local timestamp safety_name partial
  database_exists || {
    log "Database ${DB_NAME} does not exist; no pre-restore safety backup is needed"
    return
  }

  timestamp="$(date -u +%Y%m%d_%H%M%S)"
  safety_name="athletedb_pre_restore_${timestamp}.sql.gz"
  partial="${BACKUP_DIR}/${safety_name}.partial"
  log "Creating pre-restore safety backup ${safety_name}"
  if ! PGPASSWORD="$DB_PASS" pg_dump \
    --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
    --dbname="$DB_NAME" --no-owner --no-privileges |
    gzip -c >"$partial"; then
    rm -f "$partial"
    fail "Pre-restore safety backup failed; database was not changed"
  fi
  [[ -s "$partial" ]] || {
    rm -f "$partial"
    fail "Pre-restore safety backup is empty; database was not changed"
  }
  mv "$partial" "${BACKUP_DIR}/${safety_name}"
  (
    cd "$BACKUP_DIR"
    sha256sum "$safety_name" >"${safety_name}.sha256"
  )
}

restore_from_file() {
  local archive="$1"

  require_db_config
  verify_backup "$archive"
  confirm_restore
  create_safety_backup

  log "Replacing database ${DB_NAME} from $(basename "$archive")"
  PGPASSWORD="$DB_PASS" dropdb \
    --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
    --if-exists --force "$DB_NAME"
  PGPASSWORD="$DB_PASS" createdb \
    --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
    --owner="$DB_USER" "$DB_NAME"
  if ! gzip -dc "$archive" |
    PGPASSWORD="$DB_PASS" psql \
      --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
      --dbname="$DB_NAME" --set=ON_ERROR_STOP=1; then
    fail "Restore failed; safety backup remains in ${BACKUP_DIR}"
  fi
  log "Restore completed successfully"
}

require_command gzip
require_command sha256sum

BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-athlete}"
DB_NAME="${DB_NAME:-athletedb}"
[[ "$DB_NAME" =~ ^[A-Za-z0-9_-]+$ ]] ||
  fail "DB_NAME may contain only letters, numbers, underscores, and hyphens"
S3_PREFIX="${S3_PREFIX:-backups/athlete-manager}"
S3_PREFIX="${S3_PREFIX#/}"
S3_PREFIX="${S3_PREFIX%/}"
[[ -n "$S3_PREFIX" ]] || fail "S3_PREFIX must not be empty"

command="${1:-}"
case "$command" in
  list)
    printf '%s\n' '=== Local backups ==='
    find "$BACKUP_DIR" -maxdepth 1 -type f -name '*.sql.gz' -print 2>/dev/null |
      sort || true
    printf '\n%s\n' '=== S3 backups ==='
    require_command aws
    remote_names
    ;;
  download)
    require_command aws
    download_backup "${2:-latest}" >/dev/null
    log "Backup downloaded and verified"
    ;;
  s3)
    require_command aws
    require_command createdb
    require_command dropdb
    require_command pg_dump
    require_command psql
    restore_from_file "$(download_backup "${2:-latest}")"
    ;;
  local)
    require_command createdb
    require_command dropdb
    require_command pg_dump
    require_command psql
    if [[ "${2:-latest}" == latest ]]; then
      restore_from_file "$(latest_local)"
    else
      restore_from_file "$2"
    fi
    ;;
  -h | --help | help)
    usage
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac
