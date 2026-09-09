# CSV Data Transfer

The authenticated **Dados e Cópias** screen exports and imports all operational
data as a portable ZIP package. This feature is intended for manual snapshots
and moving data between installations.

## Package format

Format version 1 contains `manifest.json` plus these UTF-8, comma-delimited CSV
files:

| File | Contents |
|---|---|
| `coaches.csv` | Coaches |
| `athletes.csv` | Athletes and their assigned coach IDs |
| `exercises.csv` | Shared exercise library and modality fields |
| `workouts.csv` | Workout schedule, athlete, status, and notes |
| `workout_exercises.csv` | Planned exercises and expected values |
| `exercise_results.csv` | Recorded results |

UUIDs are preserved to maintain relationships. Dates use `yyyy-MM-dd`, times
use ISO local time, decimals use a dot, booleans use `true`/`false`, and empty
optional fields represent `null`. Standard CSV quoting preserves commas,
quotes, Unicode, and multiline notes.

Authentication accounts, passwords, audit logs, Flyway history, and deployment
configuration are never included.

## Import safety

Import is deliberately a full replacement:

1. The server checks the ZIP structure, manifest version, exact headers,
   record counts, types, duplicate IDs/order positions, enums, and every
   relationship.
2. The UI displays the validated record counts and requires explicit
   confirmation.
3. Operational tables are replaced in one database transaction. Any database
   error rolls back the complete operation.
4. The shared login remains unchanged.

ZIP path traversal, duplicate/unexpected entries, oversized entries, and
archives over 20 MB are rejected. Validation errors identify the CSV file,
row, and field where possible.

Download a current export before importing another snapshot.

## Backup policy

CSV snapshots complement rather than replace PostgreSQL backups. Keep the
Railway PostgreSQL volume backup schedule enabled in production. If using the
AWS fallback, keep the automated daily `pg_dump` upload to private S3
configured. Test a database restore periodically; an untested backup should not
be treated as recoverable.
