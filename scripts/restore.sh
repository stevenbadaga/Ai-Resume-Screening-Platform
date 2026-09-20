#!/usr/bin/env bash
#
# Database restore procedure (spec §9 Backup and Recovery).
#
# Restores a backup produced by scripts/backup.sh and verifies its SHA-256
# checksum first. Requires explicit confirmation because restoring REPLACES
# the current database contents.
#
# Usage:
#   ./scripts/restore.sh <backup-file.sql.gz> [--yes]
#
# Environment:
#   DATABASE_URL – postgres connection string of the target database
#   PGPASSWORD   – if DATABASE_URL does not embed the password

set -euo pipefail

BACKUP_FILE="${1:-}"
CONFIRM="${2:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./scripts/restore.sh <backup-file.sql.gz> [--yes]" >&2
  exit 1
fi
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  exit 1
fi
if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

# Verify checksum when a sidecar .sha256 exists (tamper check, §6.1 hygiene).
if [ -f "$BACKUP_FILE.sha256" ]; then
  echo "Verifying checksum ..."
  sha256sum -c "$BACKUP_FILE.sha256"
else
  echo "WARNING: no .sha256 checksum sidecar found — file integrity not verified."
fi

if [ "$CONFIRM" != "--yes" ]; then
  echo
  echo "This will REPLACE ALL DATA in the database pointed to by DATABASE_URL."
  read -r -p "Type the database name to continue: " CONFIRM_DB
  DB_NAME_FROM_URL="$(node -e 'const u=new URL(process.argv[1]);console.log(u.pathname.replace(/^\//,""))' "$DATABASE_URL")"
  if [ "$CONFIRM_DB" != "$DB_NAME_FROM_URL" ]; then
    echo "Confirmation does not match database name \"$DB_NAME_FROM_URL\" — aborting." >&2
    exit 1
  fi
fi

echo "Restoring $BACKUP_FILE ..."
gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q

echo "Restore complete. Run migrations if the backup predates the current schema:"
echo "  npx prisma migrate deploy"
