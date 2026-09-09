# Railway Deployment Guide

Railway is the recommended easiest production path for this small four-user
application. It avoids server administration, manual HTTPS, Docker host setup,
firewalls, and separate AWS S3/IAM work.

## Expected cost

Railway's Hobby plan is currently **$5/month** and includes **$5/month of usage
credit**. Usage above that is metered for RAM, CPU, volume storage, and egress.
For this app, expect roughly **$5-15/month** unless memory/CPU usage grows.

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

The database stays private. The frontend is the only public service users need
to open.

## 1. Create the project

1. Create or open a Railway account.
2. Create a new Railway project from the GitHub repository.
3. Add a PostgreSQL database service from Railway's database templates.
4. Add a backend service from the same repository:
   - root directory: `/backend`;
   - config file: `/backend/railway.toml`.
5. Add a frontend service from the same repository:
   - root directory: `/frontend`;
   - config file: `/frontend/railway.toml`.

If Railway names the services differently from `backend`, `frontend`, or
`Postgres`, adjust the variable references below to match the actual service
names.

## 2. Backend variables

Set these on the backend service:

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

Generate secrets locally, for example:

```bash
openssl rand -base64 48
```

Seal sensitive Railway variables where appropriate.

## 3. Frontend variables

Set these on the frontend service:

```env
PORT=8080
API_INTERNAL_URL=http://backend.railway.internal:8080
```

The Railway frontend image uses `frontend/Dockerfile.railway` and
`frontend/Caddyfile.railway`. Caddy serves the compiled React app and proxies
`/api/*` plus `/health/backend` to the backend over Railway private networking.

## 4. Networking and domains

On the frontend service, go to **Settings -> Networking -> Public Networking**
and generate a Railway domain. Railway automatically provides HTTPS.

Use the generated domain first. Later, add a custom domain if desired and update
the backend `CORS_ALLOWED_ORIGINS` to the custom HTTPS origin.

Do not enable public networking for PostgreSQL. Only enable temporary database
public access for maintenance when absolutely necessary, then remove it.

## 5. Health checks

Railway configs set:

| Service | Health path |
|---|---|
| backend | `/actuator/health` |
| frontend | `/health` |

After deployment, also check:

```bash
curl -fsS https://YOUR_RAILWAY_DOMAIN/health
curl -fsS https://YOUR_RAILWAY_DOMAIN/health/backend
```

## 6. Backups and recovery

Enable Railway volume backups on the PostgreSQL service:

- schedule: daily;
- retention: Railway daily backups are kept for 6 days;
- optionally add weekly/monthly backups if Railway allows them on the selected
  plan and the extra storage cost is acceptable.

Use the app's **Dados e Cópias** CSV ZIP export regularly as a portable backup
outside Railway. A good routine is:

- Railway daily database backup for platform recovery;
- weekly manual CSV ZIP download for simple off-platform portability;
- CSV export before large imports or risky data changes.

To restore a Railway backup, use the PostgreSQL service **Backups** tab,
restore the selected snapshot, review the staged change, and deploy it. Then
verify login and representative records.

## 7. Deployment flow

Railway can auto-deploy from GitHub. A normal production update is:

1. Push/merge to `main`.
2. Railway builds the backend and frontend services.
3. Railway waits for health checks.
4. The new deployment becomes active.

The existing GitHub Actions CI can still run tests on pull requests and `main`.
The AWS/GHCR SSH deployment workflow is not needed for Railway.

## 8. Local testing remains unchanged

Use Docker locally:

```bash
cp .env.example .env
scripts/prepare-docker-ca.sh
docker compose up -d --build
```

Open `http://localhost:3000`.

## 9. AWS fallback

If Railway becomes too expensive, use
[AWS Deployment Guide](AWS_DEPLOYMENT_GUIDE.md). That path is cheaper but more
operationally complex.
