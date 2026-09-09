#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORK="${ROOT}/scripts/tests/.backup-test.$$"
BIN="${WORK}/bin"
BACKUPS="${WORK}/backups"
STATUS="${WORK}/status"
REMOTE="${WORK}/remote"
CALLS="${WORK}/aws.calls"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$BIN" "$BACKUPS" "$REMOTE" "$STATUS"

cat >"${BIN}/pg_dump" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' 'CREATE TABLE backup_test(id integer);'
EOF

cat >"${BIN}/aws" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%q ' "$@" >>"$AWS_CALLS"
printf '\n' >>"$AWS_CALLS"
if [[ " $* " == *" s3api list-objects-v2 "* ]]; then
  remote_archive="$(find "$TEST_REMOTE_DIR" -name 'athletedb_*.sql.gz' -type f | head -n 1)"
  [[ -z "$remote_archive" ]] ||
    printf 'backups/athlete-manager/%s\n' "$(basename "$remote_archive")"
elif [[ " $* " == *" s3api head-object "* ]]; then
  if [[ " $* " == *" --query ContentLength "* ]]; then
    wc -c <"$(find "$TEST_BACKUP_DIR" -name 'athletedb_*.sql.gz' -type f | head -n 1)"
  elif [[ " $* " == *" --query Metadata.sha256 "* ]]; then
    awk '{print $1}' "$(find "$TEST_BACKUP_DIR" -name 'athletedb_*.sql.gz.sha256' -type f | head -n 1)"
  else
    printf '%s\n' '{}'
  fi
elif [[ " $* " == *" s3 cp s3://"* ]]; then
  args=("$@")
  for ((i = 0; i < ${#args[@]}; i++)); do
    if [[ "${args[$i]}" == cp ]]; then
      cp "$TEST_REMOTE_DIR/$(basename "${args[$((i + 1))]}")" "${args[$((i + 2))]}"
      break
    fi
  done
fi
EOF

chmod +x "${BIN}/pg_dump" "${BIN}/aws"
export PATH="${BIN}:${PATH}"
export AWS_CALLS="$CALLS"
export TEST_BACKUP_DIR="$BACKUPS"
export TEST_REMOTE_DIR="$REMOTE"

AWS_REGION=eu-west-1 \
S3_BUCKET=private-backups \
S3_PREFIX=backups/athlete-manager \
DB_PASS=test \
BACKUP_DIR="$BACKUPS" \
STATUS_DIR="$STATUS" \
"${ROOT}/scripts/backup.sh"

archive="$(find "$BACKUPS" -name 'athletedb_*.sql.gz' -type f)"
[[ -n "$archive" && -f "${archive}.sha256" ]]
(cd "$BACKUPS" && sha256sum -c "$(basename "${archive}.sha256")")
grep -q 's3 cp' "$CALLS"
grep -q 's3api head-object' "$CALLS"

cp "$archive" "${archive}.sha256" "$REMOTE/"
rm -f "$archive" "${archive}.sha256"
AWS_REGION=eu-west-1 \
S3_BUCKET=private-backups \
S3_PREFIX=backups/athlete-manager \
BACKUP_DIR="$BACKUPS" \
"${ROOT}/scripts/restore.sh" download latest
downloaded="$(find "$BACKUPS" -name 'athletedb_*.sql.gz' -type f)"
[[ -n "$downloaded" && -f "${downloaded}.sha256" ]]

if AWS_REGION=eu-west-1 DB_PASS=test BACKUP_DIR="$BACKUPS" \
  STATUS_DIR="$STATUS" \
  "${ROOT}/scripts/backup.sh" >/dev/null 2>&1; then
  echo "Expected missing S3_BUCKET to fail" >&2
  exit 1
fi
[[ -s "$STATUS/last_failure" ]]

echo "backup_s3_test: PASS"
