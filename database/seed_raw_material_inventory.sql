-- Seed fake Stok Bahan Baku + histori transaksi 3 bulan.
-- Aman dijalankan ulang: hanya data dengan marker [DEMO-STOK] yang diganti.

\set ON_ERROR_STOP on
BEGIN;

SET LOCAL TIME ZONE 'Asia/Makassar';

-- Movement ikut terhapus melalui ON DELETE CASCADE. Data asli tidak disentuh.
DELETE FROM raw_materials
WHERE notes LIKE '[DEMO-STOK]%';

CREATE TEMP TABLE seed_inventory_source (
  sequence_no integer PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  final_stock numeric(14, 2) NOT NULL,
  minimum_stock numeric(14, 2) NOT NULL,
  unit_price numeric(14, 2) NOT NULL,
  supplier_name text,
  storage_location text
) ON COMMIT DROP;

INSERT INTO seed_inventory_source VALUES
  (1,  'DEMO-KAIN-001', 'Cotton Combed 24s Navy',       'Kain',     'kg',     85, 20, 112000, 'CV Textile Makassar', 'Gudang A - Rak 01'),
  (2,  'DEMO-KAIN-002', 'Cotton Combed 30s Putih',      'Kain',     'kg',     64, 20, 118000, 'CV Textile Makassar', 'Gudang A - Rak 02'),
  (3,  'DEMO-KAIN-003', 'Kain Drill American Khaki',    'Kain',     'meter', 120, 35,  52000, 'Toko Kain Nusantara', 'Gudang A - Rak 03'),
  (4,  'DEMO-KAIN-004', 'Lacoste CVC Pique Hitam',      'Kain',     'kg',     18, 20, 135000, 'Toko Kain Nusantara', 'Gudang A - Rak 04'),
  (5,  'DEMO-KAIN-005', 'Fleece Cotton Hitam',          'Kain',     'kg',      0, 15, 128000, 'CV Textile Makassar', 'Gudang A - Rak 05'),
  (6,  'DEMO-KAIN-006', 'Dryfit Milano Merah',           'Kain',     'kg',     42, 20,  98000, 'PT Sport Textile',    'Gudang A - Rak 06'),
  (7,  'DEMO-KAIN-007', 'Taslan Balon Waterproof',       'Kain',     'meter',  12, 15,  67000, 'PT Sandang Jaya',     'Gudang A - Rak 07'),
  (8,  'DEMO-KAIN-008', 'Rib Kaos 2x2 Navy',             'Kain',     'kg',     35, 10,  92000, 'CV Textile Makassar', 'Gudang A - Rak 08'),
  (9,  'DEMO-BNG-001',  'Benang Jahit Polyester Putih', 'Benang',   'roll',   72, 20,   8500, 'UD Benang Jaya',      'Gudang B - Rak 01'),
  (10, 'DEMO-BNG-002',  'Benang Obras Hitam',           'Benang',   'roll',   14, 18,  12500, 'UD Benang Jaya',      'Gudang B - Rak 01'),
  (11, 'DEMO-BNG-003',  'Benang Bordir Rayon Emas',      'Benang',   'roll',    0, 10,  18000, 'Mitra Bordir Sulsel',  'Ruang Bordir - Rak 01'),
  (12, 'DEMO-AKS-001',  'Resleting YKK 60 cm',          'Aksesori', 'pcs',   240, 50,   7500, 'Mitra Aksesori',      'Gudang B - Rak 02'),
  (13, 'DEMO-AKS-002',  'Kancing Kemeja 11 mm',         'Aksesori', 'lusin',  45, 15,   9500, 'Mitra Aksesori',      'Gudang B - Rak 03'),
  (14, 'DEMO-AKS-003',  'Label Woven Custom',           'Aksesori', 'pcs',   480,100,   2200, 'Labelindo',           'Gudang B - Rak 04'),
  (15, 'DEMO-AKS-004',  'Karet Pinggang 3 cm',          'Aksesori', 'roll',   28, 30,  48000, 'UD Aksesori Garment', 'Gudang B - Rak 05'),
  (16, 'DEMO-AKS-005',  'Velcro Hitam 2,5 cm',          'Aksesori', 'roll',    0, 10,  32000, 'UD Aksesori Garment', 'Gudang B - Rak 06'),
  (17, 'DEMO-SBL-001',  'Tinta Plastisol Putih',        'Sablon',   'kg',      7,  8, 185000, 'Sablon Prima',        'Ruang Sablon - Rak 01'),
  (18, 'DEMO-SBL-002',  'Powder DTF Premium',           'Sablon',   'kg',     12,  5, 145000, 'Sablon Prima',        'Ruang Sablon - Rak 02'),
  (19, 'DEMO-SBL-003',  'Film DTF 60 cm',               'Sablon',   'roll',    3,  5, 425000, 'Digital Print Jaya',   'Ruang Sablon - Rak 03'),
  (20, 'DEMO-BDR-001',  'Backing Bordir Tear Away',     'Bordir',   'roll',   22,  8,  76000, 'Mitra Bordir Sulsel',  'Ruang Bordir - Rak 02'),
  (21, 'DEMO-BDR-002',  'Kain Keras Bordir',            'Bordir',   'meter',   0, 12,  18000, 'Mitra Bordir Sulsel',  'Ruang Bordir - Rak 03'),
  (22, 'DEMO-KMS-001',  'Plastik Packing 30x40',        'Kemasan',  'pack',   28, 10,  68000, 'UD Packaging Jaya',   'Gudang C - Rak 01'),
  (23, 'DEMO-KMS-002',  'Kardus Pengiriman Ukuran M',   'Kemasan',  'pcs',    36, 25,   6500, 'UD Packaging Jaya',   'Gudang C - Rak 02'),
  (24, 'DEMO-KMS-003',  'Lakban Bening 48 mm',          'Kemasan',  'roll',    8, 10,  12000, 'UD Packaging Jaya',   'Gudang C - Rak 03');

INSERT INTO raw_materials (
  code, name, category, unit, current_stock, minimum_stock, unit_price,
  supplier_name, storage_location, notes, created_by, created_at, updated_at
)
SELECT
  source.code, source.name, source.category, source.unit, source.final_stock,
  source.minimum_stock, source.unit_price, source.supplier_name, source.storage_location,
  '[DEMO-STOK] Seed fake inventori 3 bulan', admin_user.id,
  date_trunc('month', localtimestamp) - interval '2 months' + ((source.sequence_no % 5) + 1) * interval '1 day',
  localtimestamp
FROM seed_inventory_source source
LEFT JOIN LATERAL (
  SELECT id FROM users WHERE role = 'superadmin' ORDER BY created_at LIMIT 1
) admin_user ON true;

-- Empat movement konsisten: stok awal -> keluar -> masuk -> keluar.
WITH seeded AS (
  SELECT source.*, material.id AS material_id,
         (SELECT id FROM users WHERE role = 'superadmin' ORDER BY created_at LIMIT 1) AS actor_id
  FROM seed_inventory_source source
  JOIN raw_materials material ON material.code = source.code
)
INSERT INTO stock_movements (
  material_id, type, quantity, previous_stock, new_stock,
  reference, notes, movement_date, created_by, created_at
)
SELECT material_id, 'adjustment'::stock_movement_type, final_stock + 25, 0, final_stock + 25,
       'STOK-AWAL-DEMO', 'Stok awal hasil opname gudang',
       date_trunc('month', localtimestamp) - interval '2 months' + ((sequence_no % 5) + 1) * interval '1 day', actor_id,
       date_trunc('month', localtimestamp) - interval '2 months' + ((sequence_no % 5) + 1) * interval '1 day'
FROM seeded
UNION ALL
SELECT material_id, 'out'::stock_movement_type, 15, final_stock + 25, final_stock + 10,
       'PROD-DEMO-' || lpad(sequence_no::text, 3, '0'), 'Pemakaian bahan untuk produksi bulan pertama',
       date_trunc('month', localtimestamp) - interval '2 months' + ((sequence_no % 8) + 14) * interval '1 day', actor_id,
       date_trunc('month', localtimestamp) - interval '2 months' + ((sequence_no % 8) + 14) * interval '1 day'
FROM seeded
UNION ALL
SELECT material_id, 'in'::stock_movement_type, 10, final_stock + 10, final_stock + 20,
       'PO-DEMO-' || lpad(sequence_no::text, 3, '0'), 'Pembelian stok dari supplier bulan kedua',
       date_trunc('month', localtimestamp) - interval '1 month' + ((sequence_no % 12) + 3) * interval '1 day', actor_id,
       date_trunc('month', localtimestamp) - interval '1 month' + ((sequence_no % 12) + 3) * interval '1 day'
FROM seeded
UNION ALL
SELECT material_id, 'out'::stock_movement_type, 20, final_stock + 20, final_stock,
       'ORDER-DEMO-' || lpad(sequence_no::text, 3, '0'), 'Pemakaian bahan untuk order bulan berjalan',
       LEAST(date_trunc('month', localtimestamp) + ((sequence_no % 12) + 1) * interval '1 day', localtimestamp), actor_id,
       LEAST(date_trunc('month', localtimestamp) + ((sequence_no % 12) + 1) * interval '1 day', localtimestamp)
FROM seeded;

COMMIT;

\echo ''
\echo 'Seed stok bahan baku selesai.'
SELECT
  count(*) AS total_bahan,
  count(*) FILTER (WHERE current_stock > 0 AND current_stock <= minimum_stock) AS stok_menipis,
  count(*) FILTER (WHERE current_stock <= 0) AS stok_habis,
  COALESCE(sum(current_stock * unit_price), 0) AS nilai_persediaan
FROM raw_materials
WHERE notes LIKE '[DEMO-STOK]%';

SELECT count(*) AS total_histori_transaksi
FROM stock_movements movement
JOIN raw_materials material ON material.id = movement.material_id
WHERE material.notes LIKE '[DEMO-STOK]%';
