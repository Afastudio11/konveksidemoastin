#!/usr/bin/env bash
# Migrasi dan seed fake Stok Bahan Baku melalui Docker Compose.

set -euo pipefail

SCRIPT_DIR="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_DIR="$(dirname -- "$SCRIPT_DIR")"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-sekaladb}"

cd "$PROJECT_DIR"

if ! docker compose ps --status running --services | grep -qx 'db'; then
  echo "Service database belum berjalan. Jalankan: docker compose up -d db" >&2
  exit 1
fi

echo "Memasang tabel inventori..."
docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f - \
  < database/20260826_add_raw_material_inventory.sql

echo "Mengisi seed fake stok bahan baku..."
docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f - \
  < database/seed_raw_material_inventory.sql

echo "Seed inventori selesai."
