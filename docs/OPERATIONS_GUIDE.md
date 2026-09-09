# Operations Guide

## Railway operations

For the recommended Railway deployment, routine operations are handled in the
Railway dashboard:

- confirm the frontend, backend, and PostgreSQL services are deployed;
- open the frontend public domain and check `/health` and `/health/backend`;
- review backend/frontend deployment logs after each change;
- keep PostgreSQL public networking disabled except for temporary maintenance;
- enable daily PostgreSQL volume backups and periodically export a CSV ZIP from
  **Dados e Cópias**.

Railway auto-deploys from GitHub when configured. Roll back from the deployment
history if a release breaks the app. Restore database snapshots from the
PostgreSQL service **Backups** tab.

## AWS fallback operations

Run AWS fallback production commands from `~/trainning-management-app`. Always
use:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml
```

## Routine checks

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200
curl -fsS https://YOUR_DOMAIN/health/backend
df -h
free -h
docker system df
```

Expected services are `postgres`, `app`, `web`, and `backup`, all healthy.
Review backup logs for a successful midnight Europe/Lisbon upload.

## Logs and restarts

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f app
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f web
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f backup
docker compose --env-file .env.production -f docker-compose.prod.yml restart app
```

Docker JSON logs are size-limited by Compose. Application logs are stored in
the `app_logs` volume.

## Deployments

Normal production delivery is automatic after CI succeeds on a `main` push.
The workflow publishes GHCR images tagged with that commit SHA and calls:

```bash
deploy/scripts/remote-deploy.sh COMMIT_SHA
```

The script takes a pre-deployment backup when the stack exists, validates
configuration, pulls images, starts services, checks HTTPS, and rolls back if
health checks fail.

For an authorized manual deployment:

```bash
deploy/scripts/remote-deploy.sh COMMIT_SHA
```

Do not use mutable tags such as `latest`. To roll back explicitly:

```bash
deploy/scripts/rollback.sh PREVIOUS_COMMIT_SHA
```

## Backups

Run a manual backup before risky maintenance:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml \
  run --rm --no-deps --entrypoint /usr/local/bin/backup.sh backup
```

List local and S3 backups:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml \
  run --rm --no-deps --entrypoint /usr/local/bin/restore.sh backup list
```

The automated job runs at 00:00 Europe/Lisbon. S3 objects are private,
SSE-S3-encrypted, and expire after 30 days. The IAM access key is kept only in
`.env.production`. CSV ZIP export through **Dados e Cópias** remains useful for
manual snapshots and transfers, but is not a full database backup.

## Restore maintenance

Restores replace the database. Announce downtime, verify the selected backup,
and stop traffic and scheduled backups:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml stop web app backup

docker compose --env-file .env.production -f docker-compose.prod.yml \
  run --rm --no-deps -e RESTORE_CONFIRM=YES \
  --entrypoint /usr/local/bin/restore.sh backup s3 latest

docker compose --env-file .env.production -f docker-compose.prod.yml start app web backup
deploy/scripts/health-check.sh
```

The restore verifies the checksum and creates a pre-restore safety dump. After
startup, test authentication and representative data. Retain the safety dump
until acceptance is complete. See [Backup and Recovery](BACKUP_SETUP.md).

## Changing production configuration

1. Back up `.env.production` securely.
2. Edit it on the server; keep permissions at `600`.
3. Run:

```bash
deploy/scripts/validate-env.sh
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
deploy/scripts/health-check.sh
```

Never commit or copy AWS, database, JWT, or admin secrets into GitHub.

## Incident checklist

1. Confirm DNS resolves to the Lightsail static IP.
2. Check Lightsail networking and UFW: only public 80/443; SSH only from the
   administrator CIDR.
3. Inspect Compose status and service logs.
4. Check disk, memory, swap, AWS billing, and S3 access.
5. If a new release caused the incident, use the previous SHA rollback.
6. If data is damaged, enter maintenance mode and restore a verified backup.

## Monthly maintenance

- Review AWS charges, any promotional credit balance/expiry, and billing alerts.
- Check Lightsail CPU, burst capacity, disk, memory, and swap.
- Apply host security updates and verify Docker starts after reboot.
- Confirm recent S3 backups and run a disposable restore drill.
- Review firewall rules, SSH keys, IAM access keys, and GitHub production
  secrets.
- Confirm HTTPS renewal, DNS, GHCR package visibility, CI, and deployments.
- Export a manual CSV ZIP snapshot when operationally appropriate.
