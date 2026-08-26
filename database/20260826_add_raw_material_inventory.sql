-- Modul Stok Bahan Baku
-- Bisa dijalankan berulang kali dengan aman menggunakan psql.
-- docker compose exec -T db psql -U postgres -d sekaladb -v ON_ERROR_STOP=1 -f - < database/20260826_add_raw_material_inventory.sql

\set ON_ERROR_STOP on
BEGIN;

DO $$ BEGIN
  CREATE TYPE stock_movement_type AS ENUM ('in', 'out', 'adjustment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN ALTER TYPE menu_permission ADD VALUE IF NOT EXISTS 'inventory'; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'material_create'; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'material_update'; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'material_delete'; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'stock_in'; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'stock_out'; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE audit_action_type ADD VALUE IF NOT EXISTS 'stock_adjustment'; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE audit_entity_type ADD VALUE IF NOT EXISTS 'raw_material'; EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS raw_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  current_stock numeric(14, 2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  minimum_stock numeric(14, 2) NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  unit_price numeric(14, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  supplier_name text,
  storage_location text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
  type stock_movement_type NOT NULL,
  quantity numeric(14, 2) NOT NULL CHECK (quantity >= 0),
  previous_stock numeric(14, 2) NOT NULL,
  new_stock numeric(14, 2) NOT NULL CHECK (new_stock >= 0),
  reference text,
  notes text,
  movement_date timestamp NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS raw_materials_active_category_idx ON raw_materials (is_active, category);
CREATE INDEX IF NOT EXISTS raw_materials_name_idx ON raw_materials (name);
CREATE INDEX IF NOT EXISTS stock_movements_material_date_idx ON stock_movements (material_id, movement_date DESC);

COMMIT;
