-- Seed pemakaian bahan baku per order untuk 3 bulan terakhir.
-- Idempotent: hanya histori dengan marker [DEMO-FINANCE] yang dibuat ulang.

\set ON_ERROR_STOP on
BEGIN;
SET LOCAL TIME ZONE 'Asia/Makassar';

DELETE FROM order_material_usages
WHERE notes LIKE '[DEMO-FINANCE]%';

DELETE FROM stock_movements
WHERE notes LIKE '[DEMO-FINANCE]%';

CREATE TEMP TABLE demo_material_plan (
  movement_id uuid PRIMARY KEY,
  order_id uuid NOT NULL,
  invoice_number text NOT NULL,
  order_date timestamp NOT NULL,
  material_id uuid NOT NULL,
  quantity numeric(14, 2) NOT NULL,
  unit_cost numeric(14, 2) NOT NULL,
  total_cost numeric(14, 2) NOT NULL,
  actor_id uuid
) ON COMMIT DROP;

WITH numbered_orders AS (
  SELECT id, invoice_number, created_at,
    row_number() OVER (ORDER BY created_at, invoice_number) AS order_no
  FROM orders
  WHERE invoice_number LIKE 'DEMO-3B/%'
), material_codes AS (
  SELECT ARRAY[
    'DEMO-KAIN-001', 'DEMO-KAIN-002', 'DEMO-KAIN-003', 'DEMO-KAIN-004',
    'DEMO-KAIN-005', 'DEMO-KAIN-006', 'DEMO-KAIN-007', 'DEMO-KAIN-008',
    'DEMO-BNG-001', 'DEMO-BNG-002', 'DEMO-BNG-003',
    'DEMO-AKS-001', 'DEMO-AKS-002', 'DEMO-AKS-003', 'DEMO-AKS-004', 'DEMO-AKS-005',
    'DEMO-SBL-001', 'DEMO-SBL-002', 'DEMO-SBL-003',
    'DEMO-BDR-001', 'DEMO-BDR-002',
    'DEMO-KMS-001', 'DEMO-KMS-002', 'DEMO-KMS-003'
  ]::text[] AS codes
), planned AS (
  SELECT
    gen_random_uuid() AS movement_id,
    o.id AS order_id,
    o.invoice_number,
    o.created_at AS order_date,
    rm.id AS material_id,
    CASE rm.unit
      WHEN 'pcs' THEN (8 + ((o.order_no * usage_no * 7) % 24))::numeric
      WHEN 'meter' THEN round((1.5 + ((o.order_no * usage_no) % 7) * 0.5)::numeric, 2)
      WHEN 'kg' THEN round((0.8 + ((o.order_no * usage_no) % 6) * 0.4)::numeric, 2)
      WHEN 'roll' THEN round((0.5 + ((o.order_no * usage_no) % 4) * 0.5)::numeric, 2)
      WHEN 'pack' THEN (1 + ((o.order_no * usage_no) % 3))::numeric
      WHEN 'lusin' THEN (1 + ((o.order_no * usage_no) % 2))::numeric
      ELSE (1 + ((o.order_no * usage_no) % 5))::numeric
    END AS quantity,
    rm.unit_price AS unit_cost,
    (SELECT id FROM users WHERE email = 'keuangan.demo@seed.konveksi.invalid' LIMIT 1) AS actor_id
  FROM numbered_orders o
  CROSS JOIN generate_series(1, CASE WHEN o.order_no % 4 = 0 THEN 3 ELSE 2 END) AS usage_no
  CROSS JOIN material_codes mc
  JOIN raw_materials rm
    ON rm.code = mc.codes[((o.order_no + usage_no * 5 - 2) % array_length(mc.codes, 1)) + 1]
)
INSERT INTO demo_material_plan (
  movement_id, order_id, invoice_number, order_date, material_id,
  quantity, unit_cost, total_cost, actor_id
)
SELECT movement_id, order_id, invoice_number, order_date, material_id,
  quantity, unit_cost, round(quantity * unit_cost, 2), actor_id
FROM planned;

-- Pembelian stok awal untuk menutup seluruh kebutuhan demo. Sesudah semua pemakaian,
-- saldo akhirnya kembali sama dengan current_stock pada seed inventori.
WITH totals AS (
  SELECT material_id, sum(quantity) AS total_quantity, min(order_date) AS first_date,
    max(actor_id::text)::uuid AS actor_id
  FROM demo_material_plan
  GROUP BY material_id
)
INSERT INTO stock_movements (
  material_id, type, quantity, previous_stock, new_stock,
  reference, notes, movement_date, created_by, created_at
)
SELECT rm.id, 'in'::stock_movement_type, totals.total_quantity,
  rm.current_stock, rm.current_stock + totals.total_quantity,
  'DEMO-MAT-RESTOCK', '[DEMO-FINANCE] Pembelian bahan untuk kebutuhan order demo.',
  totals.first_date - interval '2 days', totals.actor_id, totals.first_date - interval '2 days'
FROM totals
JOIN raw_materials rm ON rm.id = totals.material_id;

WITH movement_values AS (
  SELECT plan.*,
    sum(plan.quantity) OVER (PARTITION BY plan.material_id) AS total_quantity,
    sum(plan.quantity) OVER (
      PARTITION BY plan.material_id ORDER BY plan.order_date, plan.invoice_number, plan.movement_id
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_quantity
  FROM demo_material_plan plan
)
INSERT INTO stock_movements (
  id, material_id, type, quantity, previous_stock, new_stock,
  reference, notes, movement_date, created_by, created_at
)
SELECT values.movement_id, values.material_id, 'out'::stock_movement_type, values.quantity,
  rm.current_stock + values.total_quantity - values.running_quantity + values.quantity,
  rm.current_stock + values.total_quantity - values.running_quantity,
  values.invoice_number,
  '[DEMO-FINANCE] Pemakaian otomatis bahan baku untuk ' || values.invoice_number || '.',
  LEAST(values.order_date + interval '1 day', localtimestamp), values.actor_id,
  LEAST(values.order_date + interval '1 day', localtimestamp)
FROM movement_values values
JOIN raw_materials rm ON rm.id = values.material_id;

INSERT INTO order_material_usages (
  order_id, material_id, stock_movement_id, quantity, unit_cost, total_cost,
  notes, created_by, created_at
)
SELECT order_id, material_id, movement_id, quantity, unit_cost, total_cost,
  '[DEMO-FINANCE] Pemakaian bahan order demo.', actor_id,
  LEAST(order_date + interval '1 day', localtimestamp)
FROM demo_material_plan
ON CONFLICT (order_id, material_id) DO UPDATE SET
  stock_movement_id = EXCLUDED.stock_movement_id,
  quantity = EXCLUDED.quantity,
  unit_cost = EXCLUDED.unit_cost,
  total_cost = EXCLUDED.total_cost,
  notes = EXCLUDED.notes,
  created_by = EXCLUDED.created_by,
  created_at = EXCLUDED.created_at;

COMMIT;

\echo ''
\echo 'Seed laporan keuangan dan pemakaian bahan selesai.'
SELECT
  count(*) AS detail_pemakaian,
  count(DISTINCT order_id) AS order_dengan_bahan,
  COALESCE(sum(total_cost), 0) AS total_biaya_bahan
FROM order_material_usages
WHERE notes LIKE '[DEMO-FINANCE]%';
