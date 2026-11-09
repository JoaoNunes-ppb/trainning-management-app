# Railway Deployment Guide

Railway is the production platform for this application. It provides GitHub
deployments, HTTPS, private networking and managed PostgreSQL, with no server
administration.

## Sizing and cost

The app is used by 3-4 coaches and roughly 100-200 clients. **One replica of each
service** (backend, frontend, PostgreSQL) is enough; do not add replicas.

The Hobby plan is **$5/month** and includes **$5/month of usage credit**.
Expect roughly **$5-15/month** in total (RAM, CPU, volume and egress are
metered). Check **Usage** in the dashboard after the first week.

## Architecture

```text
Browser
  |
Railway HTTPS domain
  |
frontend service (Caddy + React SPA)
  |
/api over Railway private network
  |
backend service (Spring Boot)
  |
Railway PostgreSQL
```

The database stays private. Only the frontend is public.

## 1. Create the project

1. Create a Railway project from the GitHub repository.
2. Add a PostgreSQL database from Railway's templates.
3. Add the backend service from the same repository:
   - root directory: `/backend`;
   - config file: `/backend/railway.toml`.
4. Add the frontend service from the same repository:
   - root directory: `/frontend`;
   - config file: `/frontend/railway.toml`.

Name the services `backend`, `frontend` and `Postgres`. If the names differ,
adjust the variable references below (they are case-sensitive).

## 2. Backend variables

```env
SPRING_PROFILES_ACTIVE=prod
PORT=8080
DB_HOST=${{ Postgres.PGHOST }}
DB_PORT=${{ Postgres.PGPORT }}
DB_NAME=${{ Postgres.PGDATABASE }}
DB_USER=${{ Postgres.PGUSER }}
DB_PASS=${{ Postgres.PGPASSWORD }}
JWT_SECRET=CHANGE_ME_AT_LEAST_32_CHARACTERS
JWT_EXPIRATION=2592000000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=CHANGE_ME_STRONG_PASSWORD
CORS_ALLOWED_ORIGINS=https://${{ frontend.RAILWAY_PUBLIC_DOMAIN }}
JAVA_TOOL_OPTIONS=-Xmx384m
```

Notes:

- **Never leave `ADMIN_PASSWORD` as `admin`** (or any guessable value). Generate a
  strong one and store it in a password manager. `ADMIN_USERNAME` and
  `ADMIN_PASSWORD` are required by the `prod` profile.
- `JWT_SECRET` must be at least 32 characters: `openssl rand -base64 48`.
- `JWT_EXPIRATION` is in milliseconds. The default in `application-prod.yml` is
  also `2592000000` (30 days), so coaches only sign in again about once a month.
- `JAVA_TOOL_OPTIONS=-Xmx384m` caps the JVM heap so the backend stays within a
  small memory footprint (and cost). Raise it only if you see out-of-memory
  errors in the logs.
- Seal the sensitive variables (`JWT_SECRET`, `ADMIN_PASSWORD`).

## 3. Frontend variables

```env
PORT=8080
API_INTERNAL_URL=http://backend.railway.internal:8080
```

`frontend/Dockerfile.railway` builds the React app and serves it with
`frontend/Caddyfile.railway`, which listens on `$PORT` (8080), proxies `/api/*`
and `/health/backend` to `API_INTERNAL_URL`, and answers `/health` itself.
The backend must listen on the same port as in `API_INTERNAL_URL`; it does, as
`application-prod.yml` uses `server.port: ${PORT:8080}`.

## 4. Networking and domains

On the frontend service open **Settings -> Networking -> Public Networking** and
generate a Railway domain (HTTPS is automatic). Keep the backend and PostgreSQL
without public domains. Enable temporary database public access only for
maintenance, then remove it.

### Optional: custom domain

1. Add the domain under the frontend service's **Networking -> Custom Domain**
   and create the DNS record Railway shows.
2. Wait for the certificate to be issued.
3. Update the backend variable `CORS_ALLOWED_ORIGINS` to the custom HTTPS origin
   (e.g. `https://app.example.com`; comma-separate several origins) and let
   the backend redeploy.

## 5. Deploy only after CI passes

On **both** the backend and frontend services enable
**Settings -> Source -> Wait for CI**. Railway then deploys a push to `main` only
after the GitHub Actions `CI` workflow succeeds. Failed CI means no deployment.

## 6. Health checks

`railway.toml` files configure:

| Service | Health path |
|---|---|
| backend | `/actuator/health` |
| frontend | `/health` |

After deploying, verify:

```bash
curl -fsS https://YOUR_RAILWAY_DOMAIN/health
curl -fsS https://YOUR_RAILWAY_DOMAIN/health/backend
```

Then log in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

## 7. Logs

The application writes to stdout/stderr; read it in the service's **Deployments
-> View Logs** in Railway. The `logging.file.path: /app/logs` setting in
`application-prod.yml` also writes files, but the container filesystem is
ephemeral: they disappear on every redeploy/restart, so do not rely on them.

## 8. Backups

On the PostgreSQL service open **Backups** and enable a **daily** schedule
(Railway keeps daily backups for 6 days; add weekly/monthly if the extra
storage is acceptable). Also download a CSV ZIP from **Dados e Cópias**
weekly as a portable off-platform copy. See [Operations Guide](OPERATIONS_GUIDE.md).

## 9. Optional: import existing data

To bring over data from a local or previous instance, export a CSV ZIP from
**Dados e Cópias** there, then import it in the Railway app's **Dados e Cópias**
page. CSV transfer does not include accounts or configuration; see
[CSV Data Transfer](DATA_TRANSFER.md). Export a fresh ZIP from the target
first.

## 10. Updates and local testing

A normal update: merge to `main` -> CI runs -> Railway builds and waits for
health checks -> the new deployment becomes active (the old one stays until
then).

Local development is unchanged:

```bash
cp .env.example .env
scripts/prepare-docker-ca.sh
docker compose up -d --build
```

Open `http://localhost:3000`.
