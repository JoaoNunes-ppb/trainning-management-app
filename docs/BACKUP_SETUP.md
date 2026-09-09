# Backup and Recovery

## Railway production backups

For the recommended Railway deployment, enable backups on the Railway
PostgreSQL service volume from the service **Backups** tab. Use a daily
schedule at minimum. Railway daily backups are kept for 6 days; add weekly or
monthly schedules if the extra storage cost is acceptable.

Restore from the same Railway **Backups** tab: choose the snapshot, click
restore, review Railway's staged volume change, deploy it, then verify login
and representative records.

CSV ZIP export/import remains available from **Dados e Cópias** for manual data
transfer and off-platform portability. CSV snapshots do not include accounts,
passwords, configuration, audit logs, or Flyway history and do not replace
database backups. See [CSV Data Transfer](DATA_TRANSFER.md).

## AWS fallback backups

Automated production backups are gzipped PostgreSQL dumps with SHA-256
sidecars. They run at **00:00 Europe/Lisbon**, upload to a private S3 bucket
with SSE-S3 encryption, and are deleted from S3 after 30 days. Local container
copies default to three days.

## Configure S3

From a trusted machine with an authenticated AWS CLI:

```bash
AWS_REGION=eu-west-1 \
S3_BUCKET=example-athlete-manager-backups \
bash deploy/aws/setup-s3.sh
```

The script creates or configures:

- S3 Block Public Access;
- SSE-S3 (`AES256`) encryption;
- a 30-day lifecycle for `backups/athlete-manager/`;
- a least-privilege IAM user able to list that prefix and get, put, or delete
  only its objects.

Create one access key and place it only in `.env.production` on the server.
Restrict that file to the deployment user:

```bash
chmod 600 .env.production
```

Set `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`,
`S3_PREFIX`, and `LOCAL_BACKUP_RETENTION_DAYS`.

## Production operation

Use this prefix for every production command:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml
```

Run and verify an on-demand backup:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml \
  run --rm --no-deps --entrypoint /usr/local/bin/backup.sh backup

docker compose --env-file .env.production -f docker-compose.prod.yml \
  run --rm --no-deps --entrypoint /usr/local/bin/restore.sh backup list
```

Inspect scheduling and status:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec backup crontab -l
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200 backup
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

The backup health check fails while `/status/last_failure` exists. A successful
backup verifies the uploaded size and checksum metadata and clears that marker.

## Local opt-in backup profile

Normal local startup builds only PostgreSQL, the app, and the Nginx frontend:

```bash
docker compose up -d --build
```

To test S3 backup behavior locally, add the required AWS and S3 values to
`.env`, then explicitly enable the profile:

```bash
docker compose --profile backup up -d --build
docker compose --profile backup run --rm \
  --entrypoint /usr/local/bin/backup.sh backup
```

Never use production access keys for routine development.

## Restore maintenance procedure

A restore replaces the database. Schedule maintenance, notify users, and first
confirm the selected archive and checksum exist. The restore script verifies
the gzip and SHA-256 sidecar and creates a local pre-restore safety dump.

Restore the latest S3 backup:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml stop web app backup

docker compose --env-file .env.production -f docker-compose.prod.yml \
  run --rm --no-deps -e RESTORE_CONFIRM=YES \
  --entrypoint /usr/local/bin/restore.sh backup s3 latest

docker compose --env-file .env.production -f docker-compose.prod.yml start app web backup
deploy/scripts/health-check.sh
```

For a named S3 archive, replace `latest` with its filename. To restore an
already downloaded local archive:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml \
  run --rm --no-deps -e RESTORE_CONFIRM=YES \
  --entrypoint /usr/local/bin/restore.sh backup \
  local /backups/athletedb_YYYYMMDD_HHMMSS.sql.gz
```

Afterward, verify login and representative record counts. Keep the
`athletedb_pre_restore_*.sql.gz` safety copy until validation is complete.
Perform a restore drill into a disposable environment at least monthly.
