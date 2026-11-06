#!/usr/bin/env bash
#
# Database backup procedure (spec §9 Backup and Recovery).
#
# Dumps the application database to a timestamped, gzip-compressed SQL file
# with a SHA-256 checksum, and prunes backups older than $RETENTION_DAYS
# (default 14) so the backup directory cannot grow unbounded.
#
# Usage:
#   ./scripts/backup.sh [output-directory]
#
# Environment:
#   DATABASE_URL    – postgres connection string of the source database
#   RETENTION_DAYS  – how many days of backups to keep (default 14)
#
# Schedule it (example, nightly 02:00):
#   0 2 * * *  cd /path/to/app && ./scripts/backup.sh >> /var/log/backup.log 2>&1

set -euo pipefail

OUTPUT_DIR="${1:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DUMP_FILE="$OUTPUT_DIR/recruitai-backup-$TIMESTAMP.sql.gz"

echo "Dumping database to $DUMP_FILE ..."
pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip -9 > "$DUMP_FILE"

# Checksum so a restore can verify the file is intact and untampered.
sha256sum "$DUMP_FILE" > "$DUMP_FILE.sha256"

SIZE="$(du -h "$DUMP_FILE" | cut -f1)"
echo "Backup complete ($SIZE): $DUMP_FILE"

# Prune backups older than the retention window.
echo "Pruning backups older than $RETENTION_DAYS days ..."
find "$OUTPUT_DIR" -name 'recruitai-backup-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
find "$OUTPUT_DIR" -name 'recruitai-backup-*.sql.gz.sha256' -mtime "+$RETENTION_DAYS" -delete

echo "Done."
