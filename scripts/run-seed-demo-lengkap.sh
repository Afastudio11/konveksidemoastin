#!/usr/bin/env bash
# Migrasi + seed demo lengkap 3 bulan: order, stok, pemakaian bahan, dan laporan keuangan.
# Upload folder project ke VPS lalu jalankan: bash scripts/run-seed-demo-lengkap.sh

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

run_sql() {
  local label="$1"
  local file="$2"
  echo "$label"
  docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f - < "$file"
}

run_sql "[1/5] Memasang modul stok bahan baku..." "database/20260826_add_raw_material_inventory.sql"
run_sql "[2/5] Memasang laporan keuangan dan relasi bahan order..." "database/20260826_add_financial_reports_and_order_materials.sql"
run_sql "[3/5] Mengisi seluruh data demo 3 bulan..." "scripts/seed_full_3_months.sql"
run_sql "[4/5] Mengisi stok dan histori bahan baku..." "database/seed_raw_material_inventory.sql"
run_sql "[5/5] Menghubungkan bahan baku ke setiap order demo..." "database/seed_financial_reports_and_order_materials.sql"

echo "Seed demo lengkap selesai. Restart aplikasi bila enum permission baru belum terbaca."
