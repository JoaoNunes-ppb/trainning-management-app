# Operations Guide

Day-to-day operations for the Railway deployment. Initial setup is in the
[Railway Deployment Guide](RAILWAY_DEPLOYMENT_GUIDE.md).

## Routine checks

- In Railway, confirm `frontend`, `backend` and `Postgres` show as active.
- `curl -fsS https://YOUR_DOMAIN/health` and `.../health/backend` return OK.
- Check **Usage** for unexpected memory/cost growth.
- PostgreSQL must have no public networking enabled.

## Logs

Open the service (backend or frontend) -> **Deployments** -> **View Logs**.
Use the search/filter box for errors. Logs go to stdout; files under
`/app/logs` are ephemeral and lost on redeploy.

## Deploying, redeploying and rolling back

- **Deploy:** merge to `main`. With **Wait for CI** enabled, Railway deploys
  only after CI passes.
- **Redeploy / restart:** service -> **Deployments** -> menu on the latest
  deployment -> **Redeploy** (or **Restart**). Use it after changing variables
  if Railway did not already redeploy.
- **Rollback:** service -> **Deployments**, choose the last good deployment ->
  **Rollback**. Then fix forward in Git (revert the commit) so `main` matches.
  Rollback does not revert database data.

## Backups and restore

Enable a daily schedule on the PostgreSQL service **Backups** tab (kept 6 days).
Take a manual backup there, and a CSV ZIP export from **Dados e Cópias**, before
risky changes.

To restore a database backup:

1. Announce downtime; stop the backend service (or accept brief errors).
2. PostgreSQL service -> **Backups** -> choose the snapshot -> **Restore**.
3. Review the staged volume change and **Deploy** it.
4. Start/redeploy the backend, log in, and check representative records.

Restore replaces the current data. CSV ZIP export is a convenience copy, not a
full backup (no accounts, config or Flyway history). See
[Backup and Recovery](BACKUP_SETUP.md).

## Rotating secrets

1. Generate a new value (`openssl rand -base64 48`).
2. Update it on the backend service **Variables** and deploy.
3. `JWT_SECRET`: all users must log in again.
4. `ADMIN_PASSWORD`: used by the backend when seeding the admin account; check
   login after the redeploy and, if the old password still works, change it
   through the app.
5. Database password: rotate in Railway's PostgreSQL service; backend variables
   reference it (`${{ Postgres.PGPASSWORD }}`) and pick it up on redeploy.

Never commit secrets to Git.

## Incident checklist

1. Check Railway status and the service's deployment state.
2. Read the backend and frontend logs.
3. Test `/health` and `/health/backend` to find which tier fails.
4. If a new release caused it, roll back.
5. If data is damaged, restore a verified backup.
6. Check variables (especially `CORS_ALLOWED_ORIGINS` and `API_INTERNAL_URL`).

## Monthly maintenance

- Review Railway usage and invoice.
- Confirm daily backups exist and test a restore into a disposable environment.
- Download a CSV ZIP snapshot.
- Review dependency updates and that CI is green.
- Rotate the admin password if staff changed.
- Check memory use; raise `-Xmx` in `JAVA_TOOL_OPTIONS` only if needed.
