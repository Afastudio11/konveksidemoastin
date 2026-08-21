-- Seed data demo lengkap untuk 3 bulan kalender terakhir (termasuk bulan ini).
-- Aman dijalankan berulang kali: hanya data dengan prefix DEMO-3B yang dihapus/dibuat ulang.
-- Jalankan melalui scripts/run-seed-3-bulan.sh atau psql dengan ON_ERROR_STOP=1.

\set ON_ERROR_STOP on
BEGIN;

SET LOCAL TIME ZONE 'Asia/Makassar';
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Bersihkan seed demo sebelumnya saja. Data operasional asli tidak disentuh.
DELETE FROM audit_logs
WHERE metadata ->> 'seedKey' = 'three-months-full';

DELETE FROM production_expenses
WHERE notes LIKE '[DEMO-3B]%';

DELETE FROM orders
WHERE invoice_number LIKE 'DEMO-3B/%';

DELETE FROM customers
WHERE email LIKE '%@seed.konveksi.invalid';

-- Akun ini membuat menu Manajemen User dapat langsung diuji.
INSERT INTO users (email, password, name, role, permissions, created_at, updated_at)
VALUES
  ('owner.demo@seed.konveksi.invalid', crypt('DemoKonveksi2026!', gen_salt('bf', 10)), 'Nadia Pratama', 'superadmin', '[]'::jsonb, localtimestamp - interval '3 months', localtimestamp),
  ('admin.demo@seed.konveksi.invalid', crypt('DemoKonveksi2026!', gen_salt('bf', 10)), 'Rizky Maulana', 'admin', '["dashboard", "orders", "customers", "expenses"]'::jsonb, localtimestamp - interval '3 months', localtimestamp),
  ('keuangan.demo@seed.konveksi.invalid', crypt('DemoKonveksi2026!', gen_salt('bf', 10)), 'Siti Rahma', 'admin', '["dashboard", "orders", "customers", "expenses"]'::jsonb, localtimestamp - interval '2 months', localtimestamp),
  ('produksi.demo@seed.konveksi.invalid', crypt('DemoKonveksi2026!', gen_salt('bf', 10)), 'Dimas Saputra', 'admin', '["dashboard", "orders", "customers"]'::jsonb, localtimestamp - interval '1 month', localtimestamp)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  updated_at = localtimestamp;

CREATE TEMP TABLE seed_customers (
  sequence_no integer PRIMARY KEY,
  id uuid NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  company_name text,
  address text NOT NULL,
  created_at timestamp NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_customers
SELECT
  n,
  gen_random_uuid(),
  (ARRAY['Andi Pratama', 'Siti Aisyah', 'Budi Santoso', 'Rina Kurniawati', 'Fajar Ramadhan', 'Dewi Lestari', 'Ahmad Fauzi', 'Nabila Putri', 'Yusuf Hidayat', 'Maya Sari', 'Rizal Akbar', 'Fitri Handayani'])[((n - 1) % 12) + 1]
    || CASE WHEN n > 12 THEN ' ' || n::text ELSE '' END,
  '089900' || lpad(n::text, 6, '0'),
  'pelanggan' || lpad(n::text, 3, '0') || '@seed.konveksi.invalid',
  CASE WHEN n % 3 = 0 THEN (ARRAY['PT Nusantara Prima', 'CV Berkah Mandiri', 'Koperasi Sejahtera', 'Yayasan Cendekia', 'Komunitas Olahraga Makassar'])[((n / 3 - 1) % 5) + 1] END,
  (ARRAY['Jl. Sultan Alauddin', 'Jl. Perintis Kemerdekaan', 'Jl. AP Pettarani', 'Jl. Veteran Selatan', 'Jl. Urip Sumoharjo'])[((n - 1) % 5) + 1]
    || ' No. ' || (10 + n)::text || ', Makassar',
  date_trunc('month', localtimestamp)::timestamp - interval '2 months'
    + ((n * 5) % 75) * interval '1 day'
FROM generate_series(1, 150) AS n;

INSERT INTO customers (id, name, phone, email, company_name, address, created_at, updated_at)
SELECT id, name, phone, email, company_name, address, created_at, created_at
FROM seed_customers;

CREATE TEMP TABLE seed_orders (
  sequence_no integer PRIMARY KEY,
  id uuid NOT NULL,
  customer_id uuid NOT NULL,
  invoice_number text NOT NULL,
  tracking_code text NOT NULL,
  created_at timestamp NOT NULL,
  payment_status payment_status NOT NULL,
  production_status production_status NOT NULL,
  production_progress integer NOT NULL,
  subtotal_amount numeric(12, 2),
  discount_amount numeric(12, 2) NOT NULL DEFAULT 0,
  ppn_amount numeric(12, 2) NOT NULL DEFAULT 0,
  include_ppn boolean NOT NULL DEFAULT false,
  total_amount numeric(12, 2),
  dp_amount numeric(12, 2),
  paid_dp_amount numeric(12, 2),
  remaining_amount numeric(12, 2),
  payment_deadline timestamp,
  production_deadline timestamp,
  notes text NOT NULL
) ON COMMIT DROP;

WITH generated AS (
  SELECT
    n,
    ((n - 1) / 100)::integer AS month_index,
    date_trunc('month', localtimestamp)::date - interval '2 months' + (((n - 1) / 100)::integer * interval '1 month') AS month_start,
    CASE ((n - 1) % 10)
      WHEN 0 THEN 'paid'::payment_status
      WHEN 1 THEN 'waiting_dp'::payment_status
      WHEN 2 THEN 'dp_paid'::payment_status
      WHEN 3 THEN 'waiting_pelunasan'::payment_status
      WHEN 4 THEN 'paid'::payment_status
      WHEN 5 THEN 'waiting_dp'::payment_status
      WHEN 6 THEN 'dp_paid'::payment_status
      WHEN 7 THEN 'paid'::payment_status
      WHEN 8 THEN 'waiting_pelunasan'::payment_status
      ELSE 'paid'::payment_status
    END AS payment_status,
    CASE ((n - 1) % 10)
      WHEN 0 THEN 10 WHEN 1 THEN 1 WHEN 2 THEN 3 WHEN 3 THEN 6 WHEN 4 THEN 9
      WHEN 5 THEN 2 WHEN 6 THEN 5 WHEN 7 THEN 8 WHEN 8 THEN 7 ELSE 10
    END AS status_rank
  FROM generate_series(1, 300) AS n
), dated AS (
  SELECT *,
    CASE WHEN month_index = 2 THEN extract(day FROM localtimestamp)::integer
         ELSE extract(day FROM (month_start + interval '1 month - 1 day'))::integer END AS days_in_scope
  FROM generated
)
INSERT INTO seed_orders (
  sequence_no, id, customer_id, invoice_number, tracking_code, created_at,
  payment_status, production_status, production_progress, payment_deadline, production_deadline, notes
)
SELECT
  n,
  gen_random_uuid(),
  (SELECT id FROM seed_customers WHERE sequence_no = (((n - 1) % 150) + 1)),
  'DEMO-3B/' || to_char(month_start, 'YYYYMM') || '/' || lpad(((n - 1) % 100 + 1)::text, 3, '0'),
  'DEMO3B-' || lpad(n::text, 4, '0'),
  LEAST(
    month_start::timestamp + (((n * 7) % days_in_scope) * interval '1 day') + ((8 + (n % 9)) * interval '1 hour'),
    localtimestamp
  ),
  payment_status,
  (ARRAY['pending', 'design', 'beli_bahan', 'potong_printing', 'jahit', 'bordir_sablon', 'qc', 'packing', 'selesai', 'dikirim']::production_status[])[status_rank],
  (ARRAY[0, 10, 20, 35, 50, 65, 75, 85, 95, 100])[status_rank],
  LEAST(month_start::timestamp + (((n * 7) % days_in_scope) * interval '1 day') + interval '3 days', localtimestamp + interval '3 days'),
  LEAST(month_start::timestamp + (((n * 7) % days_in_scope) * interval '1 day') + interval '21 days', localtimestamp + interval '21 days'),
  '[DEMO-3B] Pesanan ' || (ARRAY['seragam kerja', 'kaos event', 'polo perusahaan', 'jaket komunitas', 'jersey olahraga', 'goodie bag promosi'])[((n - 1) % 6) + 1] || '.'
FROM dated;

CREATE TEMP TABLE seed_order_items (
  order_id uuid NOT NULL,
  item_no integer NOT NULL,
  product_name text NOT NULL,
  product_type text NOT NULL,
  product_category product_category NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(12, 2) NOT NULL,
  subtotal numeric(12, 2) NOT NULL,
  size text NOT NULL,
  color text NOT NULL,
  notes text,
  created_at timestamp NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_order_items
SELECT
  o.id,
  item_no,
  (ARRAY['Kaos Cotton Combed 24s', 'Kaos Polo Lacoste', 'Kemeja Drill', 'Jaket Fleece', 'Jersey Dryfit', 'Rompi Safety', 'Goodie Bag Kanvas', 'Topi Bordir'])[((o.sequence_no + item_no - 2) % 8) + 1],
  (ARRAY['Sablon DTF', 'Bordir Komputer', 'Sablon Plastisol', 'Polos', 'Sablon Rubber'])[((o.sequence_no + item_no - 2) % 5) + 1],
  CASE WHEN (o.sequence_no + item_no) % 8 = 0 THEN 'percetakan'::product_category ELSE 'konveksi'::product_category END,
  24 + ((o.sequence_no * item_no * 7) % 177),
  55000 + (((o.sequence_no * 13000 + item_no * 17000) % 12) * 12500),
  (24 + ((o.sequence_no * item_no * 7) % 177)) * (55000 + (((o.sequence_no * 13000 + item_no * 17000) % 12) * 12500)),
  (ARRAY['S-XL', 'M-XXL', 'All Size', 'L-XXL'])[((o.sequence_no + item_no - 2) % 4) + 1],
  (ARRAY['Navy', 'Hitam', 'Putih', 'Abu-abu', 'Merah', 'Biru'])[((o.sequence_no + item_no - 2) % 6) + 1],
  CASE WHEN item_no = 1 THEN 'Item utama pesanan demo.' ELSE 'Tambahan variasi item pesanan demo.' END,
  o.created_at
FROM seed_orders o
CROSS JOIN LATERAL generate_series(1, CASE WHEN o.sequence_no % 3 = 0 THEN 3 WHEN o.sequence_no % 2 = 0 THEN 2 ELSE 1 END) AS item_no;

UPDATE seed_orders o
SET
  subtotal_amount = x.subtotal_amount,
  discount_amount = CASE WHEN o.sequence_no % 9 = 0 THEN round(x.subtotal_amount * 0.05, 2) ELSE 0 END,
  include_ppn = o.sequence_no % 5 = 0
FROM (
  SELECT order_id, sum(subtotal) AS subtotal_amount
  FROM seed_order_items
  GROUP BY order_id
) x
WHERE o.id = x.order_id;

UPDATE seed_orders
SET
  ppn_amount = CASE WHEN include_ppn THEN round((subtotal_amount - discount_amount) * 0.11, 2) ELSE 0 END,
  total_amount = subtotal_amount - discount_amount + CASE WHEN include_ppn THEN round((subtotal_amount - discount_amount) * 0.11, 2) ELSE 0 END;

UPDATE seed_orders
SET
  dp_amount = round(total_amount * CASE WHEN sequence_no % 4 = 0 THEN 0.5 ELSE 0.3 END, 2),
  paid_dp_amount = CASE WHEN payment_status IN ('dp_paid', 'waiting_pelunasan', 'paid') THEN round(total_amount * CASE WHEN sequence_no % 4 = 0 THEN 0.5 ELSE 0.3 END, 2) ELSE 0 END,
  remaining_amount = CASE
    WHEN payment_status = 'paid' THEN 0
    WHEN payment_status = 'waiting_dp' THEN total_amount
    ELSE total_amount - round(total_amount * CASE WHEN sequence_no % 4 = 0 THEN 0.5 ELSE 0.3 END, 2)
  END;

INSERT INTO orders (
  id, invoice_number, tracking_code, customer_id, subtotal_amount, ppn_amount, include_ppn, discount_amount,
  total_amount, dp_amount, paid_dp_amount, remaining_amount, payment_status, production_status, production_progress,
  payment_deadline, production_deadline, notes, created_by, paid_at, created_at, updated_at
)
SELECT
  o.id, o.invoice_number, o.tracking_code, o.customer_id, o.subtotal_amount, o.ppn_amount, o.include_ppn, o.discount_amount,
  o.total_amount, o.dp_amount, o.paid_dp_amount, o.remaining_amount, o.payment_status, o.production_status, o.production_progress,
  o.payment_deadline, o.production_deadline, o.notes, u.id,
  CASE WHEN o.payment_status = 'paid' THEN LEAST(o.created_at + interval '5 days', localtimestamp) END,
  o.created_at, o.created_at
FROM seed_orders o
CROSS JOIN (SELECT id FROM users WHERE email = 'owner.demo@seed.konveksi.invalid') u;

INSERT INTO order_items (order_id, product_name, product_type, product_category, quantity, unit_price, subtotal, size, color, notes, created_at)
SELECT order_id, product_name, product_type, product_category, quantity, unit_price, subtotal, size, color, notes, created_at
FROM seed_order_items;

-- Riwayat produksi dari status awal sampai status terbaru, agar halaman detail/tracking lengkap.
INSERT INTO order_status_history (order_id, status, progress, notes, updated_by, created_at)
SELECT
  o.id,
  stages.status,
  (ARRAY[0, 10, 20, 35, 50, 65, 75, 85, 95, 100])[stages.stage_no],
  (ARRAY[
    'Pesanan diterima dan menunggu proses.',
    'Desain sedang disiapkan.',
    'Bahan produksi sedang dibeli.',
    'Proses potong dan printing dimulai.',
    'Produk masuk tahap jahit.',
    'Bordir atau sablon sedang dikerjakan.',
    'Produk masuk pemeriksaan kualitas.',
    'Pesanan sedang dikemas.',
    'Produksi telah selesai.',
    'Pesanan telah dikirim ke pelanggan.'
  ])[stages.stage_no],
  u.id,
  LEAST(o.created_at + ((stages.stage_no - 1) * interval '1 day'), localtimestamp)
FROM seed_orders o
CROSS JOIN (SELECT id FROM users WHERE email = 'produksi.demo@seed.konveksi.invalid') u
CROSS JOIN LATERAL unnest(ARRAY['pending', 'design', 'beli_bahan', 'potong_printing', 'jahit', 'bordir_sablon', 'qc', 'packing', 'selesai', 'dikirim']::production_status[]) WITH ORDINALITY AS stages(status, stage_no)
WHERE stages.stage_no <= CASE o.production_status
  WHEN 'pending' THEN 1 WHEN 'design' THEN 2 WHEN 'beli_bahan' THEN 3 WHEN 'potong_printing' THEN 4 WHEN 'jahit' THEN 5
  WHEN 'bordir_sablon' THEN 6 WHEN 'qc' THEN 7 WHEN 'packing' THEN 8 WHEN 'selesai' THEN 9 ELSE 10
END;

-- DP untuk pesanan yang sudah membayar DP/pelunasan.
INSERT INTO payments (order_id, amount, payment_method, payment_channel, transaction_id, paid_at, status, created_at, updated_at)
SELECT
  o.id, o.dp_amount,
  (ARRAY['transfer', 'qris', 'cash'])[((o.sequence_no - 1) % 3) + 1],
  (ARRAY['BCA', 'Mandiri', 'BRI', 'BNI', 'QRIS'])[((o.sequence_no - 1) % 5) + 1],
  'DEMO3B-DP-' || lpad(o.sequence_no::text, 4, '0'),
  LEAST(o.created_at + interval '1 day', localtimestamp), 'paid', o.created_at, o.created_at
FROM seed_orders o
WHERE o.payment_status IN ('dp_paid', 'waiting_pelunasan', 'paid');

-- Pelunasan untuk pesanan berstatus lunas.
INSERT INTO payments (order_id, amount, payment_method, payment_channel, transaction_id, paid_at, status, created_at, updated_at)
SELECT
  o.id, o.total_amount - o.dp_amount,
  (ARRAY['transfer', 'qris', 'cash'])[((o.sequence_no) % 3) + 1],
  (ARRAY['BCA', 'Mandiri', 'BRI', 'BNI', 'QRIS'])[((o.sequence_no) % 5) + 1],
  'DEMO3B-PL-' || lpad(o.sequence_no::text, 4, '0'),
  LEAST(o.created_at + interval '5 days', localtimestamp), 'paid', o.created_at, o.created_at
FROM seed_orders o
WHERE o.payment_status = 'paid';

-- Invoice order, DP, dan pelunasan mengaktifkan seluruh variasi halaman invoice/pembayaran.
INSERT INTO payment_invoices (invoice_number, order_id, payment_id, invoice_type, amount, paid_amount, remaining_amount, payment_method, notes, created_at)
SELECT
  'ORD-DEMO3B-' || lpad(o.sequence_no::text, 4, '0'), o.id, NULL, 'order', o.total_amount,
  CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE o.paid_dp_amount END,
  o.remaining_amount, NULL, '[DEMO-3B] Invoice total pesanan.', o.created_at
FROM seed_orders o;

INSERT INTO payment_invoices (invoice_number, order_id, payment_id, invoice_type, amount, paid_amount, remaining_amount, payment_method, notes, created_at)
SELECT
  'DP-DEMO3B-' || lpad(o.sequence_no::text, 4, '0'), o.id, p.id, 'dp', o.dp_amount,
  o.paid_dp_amount, o.dp_amount - o.paid_dp_amount, p.payment_method, '[DEMO-3B] Tagihan uang muka.', o.created_at
FROM seed_orders o
LEFT JOIN payments p ON p.transaction_id = 'DEMO3B-DP-' || lpad(o.sequence_no::text, 4, '0');

INSERT INTO payment_invoices (invoice_number, order_id, payment_id, invoice_type, amount, paid_amount, remaining_amount, payment_method, notes, created_at)
SELECT
  'PL-DEMO3B-' || lpad(o.sequence_no::text, 4, '0'), o.id, p.id, 'pelunasan', o.total_amount - o.dp_amount,
  CASE WHEN o.payment_status = 'paid' THEN o.total_amount - o.dp_amount ELSE 0 END,
  CASE WHEN o.payment_status = 'paid' THEN 0 ELSE o.total_amount - o.dp_amount END,
  p.payment_method, '[DEMO-3B] Tagihan pelunasan.', o.created_at
FROM seed_orders o
LEFT JOIN payments p ON p.transaction_id = 'DEMO3B-PL-' || lpad(o.sequence_no::text, 4, '0')
WHERE o.payment_status IN ('waiting_pelunasan', 'paid');

-- Dua biaya produksi per order untuk menu Pengeluaran dan analitik laba.
INSERT INTO production_expenses (
  date, customer_id, order_id, project_name, item_name, vendor_name, quantity, unit_price, total_value,
  work_status, vendor_payment_status, notes, created_by, created_at, updated_at
)
SELECT
  LEAST(o.created_at + (expense_no * interval '1 day'), localtimestamp), o.customer_id, o.id,
  o.invoice_number,
  CASE expense_no WHEN 1 THEN 'Kain dan bahan utama' ELSE 'Sablon / bordir / finishing' END,
  CASE expense_no WHEN 1 THEN (ARRAY['CV Textile Makassar', 'Toko Kain Nusantara', 'UD Bahan Jaya'])[((o.sequence_no - 1) % 3) + 1]
                  ELSE (ARRAY['Sablon Prima', 'Bordir Mitra', 'Finishing Makassar'])[((o.sequence_no - 1) % 3) + 1] END,
  1,
  round(o.total_amount * CASE WHEN expense_no = 1 THEN 0.28 ELSE 0.12 END, 2),
  round(o.total_amount * CASE WHEN expense_no = 1 THEN 0.28 ELSE 0.12 END, 2),
  CASE WHEN o.production_progress >= 95 THEN 'selesai'::work_status ELSE 'proses'::work_status END,
  CASE WHEN o.payment_status = 'paid' AND o.production_progress >= 75 THEN 'lunas'::vendor_payment_status ELSE 'belum'::vendor_payment_status END,
  '[DEMO-3B] Biaya produksi pesanan ' || o.invoice_number || '.', u.id,
  LEAST(o.created_at + (expense_no * interval '1 day'), localtimestamp), LEAST(o.created_at + (expense_no * interval '1 day'), localtimestamp)
FROM seed_orders o
CROSS JOIN (SELECT id FROM users WHERE email = 'keuangan.demo@seed.konveksi.invalid') u
CROSS JOIN generate_series(1, 2) AS expense_no;

-- Log pesan mewakili notifikasi order dan status pengiriman.
INSERT INTO message_logs (order_id, customer_id, message_type, recipient, content, status, sent_at, delivered_at, created_at)
SELECT
  o.id, c.id, 'order_confirmation', c.phone,
  '[DEMO-3B] Pesanan ' || o.invoice_number || ' telah kami terima. Kode lacak: ' || o.tracking_code || '.',
  'delivered', o.created_at, o.created_at + interval '5 minutes', o.created_at
FROM seed_orders o
JOIN customers c ON c.id = o.customer_id;

INSERT INTO message_logs (order_id, customer_id, message_type, recipient, content, status, sent_at, delivered_at, created_at)
SELECT
  o.id, c.id, 'shipping_update', c.phone,
  '[DEMO-3B] Pesanan ' || o.invoice_number || ' sudah selesai dan dalam proses pengiriman.',
  'delivered', LEAST(o.created_at + interval '10 days', localtimestamp), LEAST(o.created_at + interval '10 days 5 minutes', localtimestamp), LEAST(o.created_at + interval '10 days', localtimestamp)
FROM seed_orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.production_status IN ('selesai', 'dikirim');

INSERT INTO testimonials (order_id, customer_id, rating, quality_rating, speed_rating, comment, suggestions, allow_publish, created_at)
SELECT
  o.id, o.customer_id,
  CASE WHEN o.sequence_no % 7 = 0 THEN 4 ELSE 5 END,
  5, CASE WHEN o.sequence_no % 5 = 0 THEN 4 ELSE 5 END,
  (ARRAY['Hasil jahitan rapi dan sesuai desain. Terima kasih!', 'Pesanan datang tepat waktu, kualitas bahan sangat baik.', 'Tim responsif dan proses produksi transparan.', 'Sablon dan bordirnya bagus, akan pesan kembali.'])[((o.sequence_no - 1) % 4) + 1],
  CASE WHEN o.sequence_no % 4 = 0 THEN 'Semoga pilihan warna bisa semakin banyak.' END,
  true,
  LEAST(o.created_at + interval '14 days', localtimestamp)
FROM seed_orders o
WHERE o.payment_status = 'paid' AND o.production_status IN ('selesai', 'dikirim') AND o.sequence_no % 3 = 0;

-- Audit log untuk menu Log Aktivitas: pembuatan order, biaya, status, dan pembayaran.
INSERT INTO audit_logs (actor_id, actor_role, actor_name, action_type, entity_type, entity_id, summary, after_state, metadata, ip_address, user_agent, created_at)
SELECT
  u.id, u.role, u.name,
  action.action_type::audit_action_type,
  action.entity_type::audit_entity_type,
  CASE action.entity_type WHEN 'order' THEN o.id::text WHEN 'expense' THEN 'expense-demo-' || o.sequence_no ELSE 'payment-demo-' || o.sequence_no END,
  action.summary || ' ' || o.invoice_number || '.',
  jsonb_build_object('invoiceNumber', o.invoice_number, 'trackingCode', o.tracking_code, 'seed', true),
  jsonb_build_object('seedKey', 'three-months-full', 'seedVersion', 1),
  '127.0.0.1', 'Seed Data 3 Bulan',
  LEAST(o.created_at + (action.action_no * interval '2 hours'), localtimestamp)
FROM seed_orders o
CROSS JOIN (SELECT id, role, name FROM users WHERE email = 'owner.demo@seed.konveksi.invalid') u
CROSS JOIN (VALUES
  (1, 'order_create', 'order', 'Membuat order demo'),
  (2, 'expense_create', 'expense', 'Menambah biaya produksi demo'),
  (3, 'order_status_update', 'order', 'Memperbarui status produksi demo'),
  (4, 'order_payment_update', 'payment', 'Memperbarui pembayaran demo')
) AS action(action_no, action_type, entity_type, summary);

INSERT INTO audit_logs (actor_id, actor_role, actor_name, action_type, entity_type, entity_id, summary, metadata, ip_address, user_agent, created_at)
SELECT
  u.id, u.role, u.name, 'login', 'session', 'seed-login-' || n,
  'Login pengguna demo ke sistem.', jsonb_build_object('seedKey', 'three-months-full', 'seedVersion', 1),
  '127.0.0.1', 'Seed Data 3 Bulan',
  LEAST(date_trunc('month', localtimestamp) - interval '2 months' + (n * interval '2 days'), localtimestamp)
FROM generate_series(1, 45) AS n
CROSS JOIN (SELECT id, role, name FROM users WHERE email = 'admin.demo@seed.konveksi.invalid') u;

COMMIT;

\echo ''
\echo 'Seed DEMO-3B selesai.'
SELECT
  (SELECT count(*) FROM customers WHERE email LIKE '%@seed.konveksi.invalid') AS customers,
  (SELECT count(*) FROM orders WHERE invoice_number LIKE 'DEMO-3B/%') AS orders,
  (SELECT count(*) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.invoice_number LIKE 'DEMO-3B/%') AS order_items,
  (SELECT count(*) FROM production_expenses WHERE notes LIKE '[DEMO-3B]%') AS expenses,
  (SELECT count(*) FROM audit_logs WHERE metadata ->> 'seedKey' = 'three-months-full') AS audit_logs;
