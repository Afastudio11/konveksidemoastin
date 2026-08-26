-- Modul pemakaian bahan per order dan laporan keuangan.
-- Aman dijalankan berulang kali dengan psql.

\set ON_ERROR_STOP on
BEGIN;

DO $$ BEGIN
  ALTER TYPE menu_permission ADD VALUE IF NOT EXISTS 'financial_reports';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS order_material_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
  stock_movement_id uuid REFERENCES stock_movements(id) ON DELETE SET NULL,
  quantity numeric(14, 2) NOT NULL CHECK (quantity > 0),
  unit_cost numeric(14, 2) NOT NULL CHECK (unit_cost >= 0),
  total_cost numeric(14, 2) NOT NULL CHECK (total_cost >= 0),
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_material_usages_order_idx
  ON order_material_usages (order_id);
CREATE INDEX IF NOT EXISTS order_material_usages_material_date_idx
  ON order_material_usages (material_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS order_material_usages_order_material_unique
  ON order_material_usages (order_id, material_id);

COMMIT;
