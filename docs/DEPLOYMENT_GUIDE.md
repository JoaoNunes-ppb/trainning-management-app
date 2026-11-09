# Deployment Guide

## Local Docker Compose

```bash
cp .env.example .env
scripts/prepare-docker-ca.sh
docker compose up -d --build
docker compose ps
```

Open `http://localhost:3000`. The local stack builds PostgreSQL, the Spring Boot
app and the Nginx frontend. PostgreSQL (`5432`) and the backend (`8080`) are
also exposed for development.

## Production: Railway

Production runs on Railway; see the
[Railway Deployment Guide](RAILWAY_DEPLOYMENT_GUIDE.md) for full setup
(services, variables, domains, Wait for CI, backups) and the
[Operations Guide](OPERATIONS_GUIDE.md) for day-to-day tasks.

Deployment files:

- `backend/railway.toml`: backend Docker build and health check.
- `frontend/railway.toml`: frontend Docker build and health check.
- `frontend/Dockerfile.railway`: frontend/Caddy image.
- `frontend/Caddyfile.railway`: SPA serving and `/api` private proxy.

CI (`.github/workflows/ci.yml`) runs tests on pull requests and `main`; Railway
deploys after it passes when **Wait for CI** is enabled.

## Verification

```bash
curl -fsS https://YOUR_RAILWAY_DOMAIN/health
curl -fsS https://YOUR_RAILWAY_DOMAIN/health/backend
```

Verify login, application data, CSV export/import and Railway PostgreSQL
backups.
