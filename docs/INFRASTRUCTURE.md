# Infrastructure

## Local development

`docker-compose.yml` builds the repository's development images:

| Service | Role | Host port |
|---|---|---|
| `postgres` | PostgreSQL 16 | `5432` |
| `app` | Spring Boot API | `8080` |
| `frontend` | React static files and API proxy through Nginx | `3000` |
| `backup` | Optional S3 backup worker | none |

Start the normal stack:

```bash
cp .env.example .env
docker compose up -d --build
```

The backup service is excluded unless the `backup` profile is enabled:

```bash
docker compose --profile backup up -d --build
```

Local PostgreSQL and logs use repository directories; the optional backup
worker writes to `./backups`.

## Production: Railway-first

Railway is the recommended production platform:

```text
Internet
   |
Railway HTTPS domain
   |
Caddy frontend service ── private Railway network ── Spring Boot backend ── Railway PostgreSQL
```

| Service | Role | Exposure |
|---|---|---|
| PostgreSQL | Railway database service with volume backups | private |
| backend | Spring Boot API from `/backend` | private |
| frontend | Caddy + React SPA from `/frontend` | public HTTPS |

Railway handles HTTPS, deployment health checks, service restarts, private
networking, and database provisioning. The frontend proxies `/api/*` to the
backend through `API_INTERNAL_URL`.

## Production fallback: AWS Lightsail

`docker-compose.prod.yml` is a standalone Compose file. It does not extend the
local file and does not build on the server. It pulls three public GHCR images
tagged with a Git commit SHA:

```text
Internet
   |
80/443
   |
Caddy web ── private Docker network ── Spring Boot app ── PostgreSQL
   |                                          |
   +──────── backup worker ───────────────────+
                    |
               private S3
```

| Service | Image/data | Exposure |
|---|---|---|
| `postgres` | PostgreSQL 16; `postgres_data` volume | private |
| `app` | `ghcr.io/...-app:${IMAGE_TAG}`; `app_logs` | private |
| `web` | `ghcr.io/...-web:${IMAGE_TAG}`; Caddy TLS volumes | 80/443 |
| `backup` | `ghcr.io/...-backup:${IMAGE_TAG}`; local/status volumes | outbound S3 |

All four containers run on one 1 GB Lightsail Ubuntu instance in `eu-west-1`.
Memory/CPU limits, restart policies, health checks, bounded JSON logs, and a
1 GB host swap file keep the small host predictable. Only 80/443 are public;
SSH is restricted to an administrator IP. PostgreSQL and the API have no
public host ports.

Every production command must select the environment explicitly:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

## Delivery

GitHub Actions provides:

1. `CI`: backend tests plus frontend tests/build for pull requests and `main`.
2. `Deploy production`: after successful CI on a `main` push, build and publish
   SHA-tagged app, web, and backup images to GHCR.
3. SSH deployment using GitHub production secrets `DEPLOY_HOST`,
   `DEPLOY_USER`, and `DEPLOY_SSH_KEY`.
4. A pre-deploy S3 backup, image pull, Compose update, HTTPS health check, and
   automatic rollback.

GHCR packages should be public so the host needs no long-lived registry token.
Application and S3 credentials remain only in the host's mode-600
`.env.production`.

## Persistence and recovery

- PostgreSQL data: Docker named volume `postgres_data`.
- Application logs: `app_logs`, with bounded Docker logging.
- TLS state: `caddy_data` and `caddy_config`.
- Recent backup copies: `local_backups`.
- Off-host recovery: private SSE-S3 backups with a 30-day lifecycle.
- Manual transfer: validated CSV ZIP export/import.

Named volumes survive container replacement and normal `docker compose down`.
Do not use `down --volumes` in production.
