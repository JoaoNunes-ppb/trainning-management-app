# Backup and Recovery

## Railway production backups

Enable backups on the Railway PostgreSQL service volume from the service
**Backups** tab. Use a daily schedule at minimum. Railway daily backups are kept
for 6 days; add weekly or monthly schedules if the extra storage cost is
acceptable.

Restore from the same **Backups** tab: choose the snapshot, click restore,
review Railway's staged volume change, deploy it, then verify login and
representative records. Restores replace current data, so take a manual backup
first when possible, and test a restore into a disposable environment monthly.

## CSV snapshots

CSV ZIP export/import from **Dados e Cópias** is for manual data transfer and
off-platform portability. Snapshots do not include accounts, passwords,
configuration, audit logs or Flyway history and do not replace database
backups. A good routine is a weekly manual download plus one before large
imports or risky changes. See [CSV Data Transfer](DATA_TRANSFER.md).

## Local development

Local data lives in `./pgdata` (not committed). Copy that directory or use a
CSV export if you need to preserve local data.
