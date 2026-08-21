#!/usr/bin/env bash
# Menjalankan seed SQL melalui service PostgreSQL Docker Compose.
# Jalankan dari server/VPS: bash scripts/run-seed-3-bulan.sh

set -euo pipefail

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
SQL_FILE="$SCRIPT_DIR/seed_full_3_months.sql"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-sekaladb}"

if [ ! -f "$SQL_FILE" ]; then
  echo "File seed tidak ditemukan: $SQL_FILE" >&2
  exit 1
fi

if ! docker compose ps --status running --services | grep -qx 'db'; then
  echo "Service database Docker Compose belum berjalan. Jalankan: docker compose up -d db" >&2
  exit 1
fi

echo "Menjalankan seed demo 3 bulan terakhir ke database '$POSTGRES_DB'..."
docker compose exec -T db psql \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -v ON_ERROR_STOP=1 \
  -f - < "$SQL_FILE"
