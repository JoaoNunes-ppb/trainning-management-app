# Infrastructure

## Local development

`docker-compose.yml` builds the repository's development images:

| Service | Role | Host port |
|---|---|---|
| `postgres` | PostgreSQL 16 | `5432` |
| `app` | Spring Boot API | `8080` |
| `frontend` | React static files and API proxy through Nginx | `3000` |

Start the normal stack:

```bash
cp .env.example .env
docker compose up -d --build
```

Local PostgreSQL data and logs use the repository directories `./pgdata` and `./logs`.

## Production: Railway

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

## Delivery

GitHub Actions runs `CI` (backend tests plus frontend tests/build) on pull
requests and `main`. Railway deploys from GitHub and, with **Wait for CI**
enabled, only after CI passes.

## Persistence and recovery

- PostgreSQL data: Railway PostgreSQL volume, with Railway volume backups.
- Application logs: stdout/stderr, shown in Railway deployment logs. Files under
  `/app/logs` are ephemeral and lost on redeploy.
- Manual transfer: validated CSV ZIP export/import.
