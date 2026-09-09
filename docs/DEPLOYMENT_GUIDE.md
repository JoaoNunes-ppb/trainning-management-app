# Deployment Guide

## Local Docker Compose

Copy the local template, replace its placeholder secrets, and build the three
normal services:

```bash
cp .env.example .env
scripts/prepare-docker-ca.sh
docker compose up -d --build
docker compose ps
```

Open `http://localhost:3000`. The local stack builds PostgreSQL, the Spring
Boot app, and the Nginx frontend. PostgreSQL (`5432`) and the backend (`8080`)
are also exposed for development.

S3 backup is opt-in locally:

```bash
docker compose --profile backup up -d --build
```

Add non-production AWS/S3 values to `.env` before enabling that profile.

## Recommended production model: Railway

Railway is now the recommended production deployment because it is simpler than
managing a server. It provides GitHub deployments, HTTPS, private service
networking, and PostgreSQL provisioning.

Use:

- backend service root: `/backend`;
- frontend service root: `/frontend`;
- PostgreSQL service: Railway database template;
- public service: frontend only;
- backend/database access: private Railway network.

See [Railway Deployment Guide](RAILWAY_DEPLOYMENT_GUIDE.md).

## Railway files

- `backend/railway.toml`: backend Docker build and health check.
- `frontend/railway.toml`: frontend Docker build and health check.
- `frontend/Dockerfile.railway`: Railway frontend/Caddy image.
- `frontend/Caddyfile.railway`: SPA serving and `/api` private proxy.

## AWS fallback files

- `.env.production.example`: production variable template.
- `docker-compose.prod.yml`: standalone production stack.
- `deploy/aws/bootstrap-host.sh`: Docker, swap, updates, and host firewall.
- `deploy/aws/setup-s3.sh`: private encrypted bucket, lifecycle, and IAM user.
- `deploy/scripts/validate-env.sh`: secrets and Compose validation.
- `deploy/scripts/remote-deploy.sh`: backup, deploy, health check, rollback.
- `deploy/scripts/rollback.sh`: restore a previous SHA.
- `deploy/scripts/health-check.sh`: container and HTTPS validation.

These are retained for the lower-cost Lightsail/S3 fallback. They are not
required for a Railway launch.

## Railway environment

Backend:

```env
SPRING_PROFILES_ACTIVE=prod
PORT=8080
DB_HOST=${{ Postgres.PGHOST }}
DB_PORT=${{ Postgres.PGPORT }}
DB_NAME=${{ Postgres.PGDATABASE }}
DB_USER=${{ Postgres.PGUSER }}
DB_PASS=${{ Postgres.PGPASSWORD }}
JWT_SECRET=CHANGE_ME_AT_LEAST_32_CHARACTERS
JWT_EXPIRATION=86400000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=CHANGE_ME_STRONG_PASSWORD
CORS_ALLOWED_ORIGINS=https://${{ frontend.RAILWAY_PUBLIC_DOMAIN }}
```

Frontend:

```env
PORT=8080
API_INTERNAL_URL=http://backend.railway.internal:8080
```

## AWS fallback environment

On the host:

```bash
cd ~/trainning-management-app
cp .env.production.example .env.production
chmod 600 .env.production
```

Replace every `CHANGE_ME`. `DOMAIN` is a hostname without `https://`;
`CORS_ALLOWED_ORIGINS` includes its HTTPS origin; `IMAGE_TAG` is an existing
successful commit SHA. The least-privilege S3 access key belongs only in this
file.

All production Compose commands must use:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml
```

Validate and start:

```bash
deploy/scripts/validate-env.sh
docker compose --env-file .env.production -f docker-compose.prod.yml pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
deploy/scripts/health-check.sh
```

## Railway domains and HTTPS

Generate a Railway domain on the frontend service. Railway automatically
provides HTTPS. A custom domain can be added later with Railway's DNS records.

## AWS fallback DNS and HTTPS

Point an `A` record at the Lightsail static IP. Public inbound access is limited
to TCP 80/443; restrict SSH 22 to the administrator's IP. Caddy automatically
obtains and renews certificates once DNS and ports are correct. UDP 443 may be
allowed for HTTP/3.

## GitHub production environment for AWS fallback

Make the `-app`, `-web`, and `-backup` GHCR packages public. Configure:

| Secret | Purpose |
|---|---|
| `DEPLOY_HOST` | Static IP or host name |
| `DEPLOY_USER` | SSH deployment user |
| `DEPLOY_SSH_KEY` | Private SSH key |

The workflow uses GitHub's short-lived token to publish images. Do not add
`.env.production` or its S3 key to GitHub.

## Railway verification

```bash
curl -fsS https://YOUR_RAILWAY_DOMAIN/health
curl -fsS https://YOUR_RAILWAY_DOMAIN/health/backend
```

Verify login, application data, CSV export/import, and Railway PostgreSQL
backups.

## AWS fallback verification

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100
curl -fsS https://YOUR_DOMAIN/health/backend
```

Verify login, application data, HTTPS, a manual backup, and a restore drill.
For daily operation and recovery, see [Operations Guide](OPERATIONS_GUIDE.md)
and [Backup and Recovery](BACKUP_SETUP.md).
