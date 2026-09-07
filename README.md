# Athlete Management App

A web application for small coaching studios to manage coaches and athletes,
build and schedule workouts, record results, and transfer operational data.

## Features

- Weekly training calendar and coach/athlete filters.
- Exercise library and workout planning/results.
- Shared JWT-authenticated administration account.
- Validated CSV ZIP export/import for manual snapshots and transfer.
- Railway PostgreSQL backups in production, with an AWS/S3 fallback path.

The coach selector organizes data; it is not an authorization boundary. The
shared account can manage all athletes.

## Local quick start

Requirements: Git, Docker Engine/Desktop, and Docker Compose v2.

```bash
git clone <repository-url>
cd trainning-management-app
cp .env.example .env
# Replace every CHANGE_ME value in .env
scripts/prepare-docker-ca.sh
docker compose up -d --build
```

Open `http://localhost:3000`.

The preparation script exports the host trust store for Docker's npm build and
keeps local or corporate certificate authorities trusted without disabling TLS.

| Service | Address |
|---|---|
| Nginx frontend/API proxy | `http://localhost:3000` |
| Spring Boot API | `http://localhost:8080` |
| PostgreSQL | `localhost:5432` |

`docker-compose.yml` builds PostgreSQL, the app, and the Nginx frontend. The S3
backup worker is optional:

```bash
docker compose --profile backup up -d --build
```

Configure non-production S3 credentials in `.env` before enabling it.

## Architecture

```text
Local:       browser -> Nginx frontend -> Spring Boot -> PostgreSQL
Production:  Railway HTTPS -> Caddy frontend -> Spring Boot -> Railway PostgreSQL
```

Production is now Railway-first: Railway hosts PostgreSQL, builds the backend
and frontend services from this monorepo, provides HTTPS, and keeps the database
private. The previously implemented Lightsail/S3 Docker deployment remains as a
lower-cost fallback if operational complexity is acceptable.

## Production

Start with [Railway Deployment Guide](docs/RAILWAY_DEPLOYMENT_GUIDE.md). The
expected cost is roughly **$5-15/month**, depending on actual memory, CPU, disk,
and network usage. Use [AWS Deployment Guide](docs/AWS_DEPLOYMENT_GUIDE.md) only
if lowest cost is more important than simplicity.

## Tests

```bash
(cd backend && mvn test)
(cd frontend && npm ci --legacy-peer-deps && npm test && npm run build)
```

## Documentation

| Guide | Purpose |
|---|---|
| [Deployment](docs/DEPLOYMENT_GUIDE.md) | Local and production deployment overview |
| [Railway deployment](docs/RAILWAY_DEPLOYMENT_GUIDE.md) | Easiest production launch path |
| [AWS deployment](docs/AWS_DEPLOYMENT_GUIDE.md) | Lower-cost Lightsail/S3 fallback |
| [Operations](docs/OPERATIONS_GUIDE.md) | Monitoring, deployment, rollback, maintenance |
| [Backup and recovery](docs/BACKUP_SETUP.md) | Railway backups, CSV snapshots, and AWS fallback |
| [Infrastructure](docs/INFRASTRUCTURE.md) | Local and production topology |
| [CSV data transfer](docs/DATA_TRANSFER.md) | Manual export/import format and safety |
| [Security](docs/SECURITY.md) | Authentication and security controls |
| [API contract](docs/API_CONTRACT.md) | REST API |
| [Developer guide](docs/DEVELOPER_GUIDE.md) | Development workflow |

## Troubleshooting

```bash
docker compose ps
docker compose logs --tail=200 app frontend postgres
```

- Port conflicts: local development uses 3000, 8080, and 5432.
- Startup failures: confirm `.env` exists and database/app health checks pass.
- Production failures: use the exact production command shown above and see
  the [Operations Guide](docs/OPERATIONS_GUIDE.md).

Private project. All rights reserved.
