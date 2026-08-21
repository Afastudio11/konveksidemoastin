# Sekala Industry - Order Tracking & Payment System

## Overview
Sekala Industry Order Tracking System adalah sistem Order Tracking & Payment untuk Sekala Industry, sebuah perusahaan konveksi. Sistem ini memungkinkan:
- Admin untuk mengelola order, pelanggan, dan status produksi
- Customer untuk melacak status pesanan secara real-time
- Pembayaran online dengan berbagai metode (VA, QRIS, E-Wallet) - Mock Midtrans
- Otomatisasi invoice (HTML/PDF) dan notifikasi WhatsApp

## Recent Changes
- **10 Desember 2025**: SuperAdmin Customer Management & PDF Export
  - SuperAdmin dapat edit dan hapus data pelanggan (tombol muncul khusus superadmin)
  - Fitur export PDF data pelanggan menggunakan Puppeteer
  - Endpoint baru: GET /api/customers/export/pdf (superadmin only)
  - PUT /api/customers/:id untuk update customer dengan audit logging
  - DELETE /api/customers/:id untuk hapus customer dengan audit logging
  - Deployment package diperbaharui: sekala-deploy-complete.tar.gz
- **10 Desember 2025**: Permission System & User Management
  - Role sistem disederhanakan: hanya 'superadmin' dan 'admin' (production/viewer dihapus)
  - Super Admin dapat membuat akun Admin dengan permission menu yang disesuaikan
  - Permission disimpan sebagai JSON array di tabel users
  - Halaman User Management di /admin/users untuk kelola admin (khusus superadmin)
  - Menu filtering berdasarkan permission: dashboard, orders, customers, expenses, activity_logs, settings, user_management
  - API endpoints baru: GET/POST/PATCH/DELETE /api/users (superadmin only)
  - Super Admin otomatis dapat akses semua menu
  - Admin hanya dapat akses menu sesuai permission yang diberikan
- **3 Desember 2025**: Superadmin-Only Edit/Delete Orders
  - Tombol Edit dan Hapus order hanya muncul untuk superadmin (tidak untuk admin biasa)
  - PUT /api/orders/:id untuk edit order dengan audit logging
  - DELETE /api/orders/:id untuk hapus order dengan audit logging
  - Edit dialog: nama pelanggan, telepon, email, alamat, DP, catatan
  - Delete dengan konfirmasi dialog
  - Backend menggunakan requireRole('superadmin') untuk validasi
- **3 Desember 2025**: Product Category & Activity Logs Update
  - Kategori produk sekarang menggunakan enum: "konveksi" dan "percetakan"
  - Dashboard "Kategori Terlaris" menampilkan data berdasarkan kategori produk (bukan jenis produk)
  - Activity Log default filter 1 bulan terakhir saat pertama kali dibuka
  - Seed data: 300 customers, 300 orders, 300+ expenses, 100 audit logs
- **3 Desember 2025**: Activity Logging System (Fraud Prevention)
  - Tabel `audit_logs` untuk mencatat semua aktivitas admin
  - Audit logging untuk semua operasi CRUD: orders, expenses, customers
  - Tracking data before/after state untuk setiap perubahan
  - Capture metadata: IP address, user agent, timestamp, actor info
  - Halaman Activity Log di dashboard (khusus superadmin)
  - Filter berdasarkan: jenis aksi, jenis data, user, tanggal
  - Detail view untuk melihat perubahan sebelum/sesudah
  - Statistik aktivitas per kategori dan per user
  - API endpoints baru: GET /api/audit-logs (superadmin only)
- **3 Desember 2025**: Product Size Logic Fix
  - Form order sekarang menampilkan ukuran yang sesuai per kategori produk:
    - KONVEKSI: Ukuran baju (XS, S, M, L, XL, XXL, 3XL, 4XL, 5XL, 6XL)
    - PERCETAKAN: Ukuran kertas (A3, A4, A5, A6, F4/Folio, Letter, Custom)
    - MERCH: Input jumlah saja
  - Ukuran reset otomatis saat kategori produk berubah
  - Berlaku di form order customer dan form order admin
- **3 Desember 2025**: Dashboard & Payment Page Improvements
  - Dashboard: revenue sekarang hanya dihitung dari order yang lunas penuh (paymentStatus = 'paid')
  - Field baru `paidAt` di tabel orders untuk tracking kapan order menjadi lunas
  - Monthly revenue menggunakan tanggal lunas (paidAt), default 30 hari terakhir
  - Menambah statistik: pendingAmount (nominal tertahan), paidDpAmount (DP terbayar)
  - Payment page: hapus metode pembayaran mandiri, customer harus hubungi admin via WhatsApp
  - Halaman Expenses: button hanya menampilkan "Tambah Pengeluaran"
  - Form order: sistem pilihan produk kategori KONVEKSI, PERCETAKAN, MERCH dengan dropdown
- **3 Desember 2025**: Monthly Expense Tracking with Auto-Lock
  - Halaman Expenses sekarang menampilkan data per bulan (bulan ini + bulan lalu)
  - Navigasi bulan dengan tombol Prev/Next, dibatasi hanya 2 bulan terakhir
  - Auto-lock pada tanggal 1 setiap bulan: data bulan lalu menjadi read-only
  - Server-side enforcement: POST/PATCH/DELETE return 403 untuk bulan terkunci
  - UI menyembunyikan tombol edit/hapus untuk data bulan terkunci dengan indikator Lock
  - Export PDF tersedia untuk semua bulan termasuk yang terkunci
  - Data sample 300 expense records (100 per bulan untuk Oct, Nov, Dec 2025)
- **3 Desember 2025**: Bug Fixes & Console Error Resolution
  - Fixed payment status badge labels: waiting_dp → "Menunggu DP", dp_paid → "DP Dibayar"
  - Added autocomplete attributes to admin login form inputs
  - Fixed React fetchPriority warning in Testimonials carousel component
  - All API endpoints verified working (auth, dashboard, orders, customers, expenses)
- **2 Desember 2025**: UI Improvements & Sample Data
  - Removed gradient from "Form Pesanan Baru" header - now solid accent color
  - Hidden WhatsApp floating button on admin pages (only visible on public pages)
  - Seeded database with 300 sample orders (100 per month for Oct, Nov, Dec 2025)
  - Sample data includes: customers, orders, order items, payments, expenses
- **2 Desember 2025**: Date Filtering & Admin Enhancements
  - Added date/month/year filtering to Dashboard with stats filtered by selected time period
  - Implemented date filtering for Orders page by creation date range
  - Added client-side sorting to Customers page (name, phone, email, registration date)
  - Implemented project deletion feature in Expenses page with confirmation dialog
  - Fixed timezone issues in date filtering using SQL DATE() with AT TIME ZONE 'Asia/Jakarta'
  - All date comparisons now properly handle WIB (Western Indonesia Time) for accurate calendar-day filtering
- **2 Desember 2025**: Beban Pengeluaran Produksi
  - Tabel baru `production_expenses` untuk tracking pengeluaran proyek
  - API endpoints CRUD untuk pengeluaran (/api/expenses)
  - Halaman admin Expenses dengan data table, filter, dan form add/edit
  - Fitur tracking: tanggal, pelanggan/project, vendor, qty, harga, status kerja, status pembayaran vendor
  - Menu Pengeluaran di sidebar admin
- **2 Desember 2025**: Manual Payment Flow (2 Tahap)
  - Payment status baru: waiting_dp, dp_paid, waiting_pelunasan, paid
  - Tombol konfirmasi manual untuk DP dan Pelunasan di OrderDetail
  - Bank details pada invoice: Bank BRI A/n: PT Virotek Karya Kreasi No. Rek: 024001000578560
- **2 Desember 2025**: Perbaikan Logo dan Invoice
  - Logo asli (logo.png) digunakan di semua halaman admin (login, dashboard)
  - Invoice menggunakan logo asli dengan format base64 untuk PDF
  - Informasi kontak invoice diperbarui dengan data yang benar:
    - Telp: 0857-5477-7068
    - Email: sekalaindustry@gmail.com
    - Alamat: Jl. Maccini Sawah No 48, Maccini, Kota Makassar, Sulawesi Selatan
  - PDF generation diperbaiki dengan menambahkan chromium system package
- **2 Desember 2025**: Perbaikan Alur Pembayaran
  - Pembayaran 2 tahap: DP dan Pelunasan dengan invoice terpisah
  - dpAmount = jumlah DP yang ditetapkan (tidak berubah setelah order dibuat)
  - Sudah Dibayar = dihitung dari tabel payments
  - Invoice type: pembayaran pertama → DP, pembayaran terakhir → Pelunasan
  - Validasi pelunasan sebelum status bisa diubah ke "Dikirim"
  - Format harga dengan titik pemisah ribuan (1.000.000)
  - Input ukuran dengan tabel (S, M, L, XL, XXL)
- **2 Desember 2025**: Fitur Invoice Pembayaran Otomatis
  - Tabel payment_invoices untuk menyimpan invoice DP dan pelunasan
  - Auto-generate invoice saat pembayaran berhasil (manual/webhook)
  - Format nomor invoice: INV-DP-YYMMDD-XXX dan INV-PEL-YYMMDD-XXX
  - Download invoice HTML dan PDF dengan autentikasi
  - UI di OrderDetail untuk melihat dan download invoice pembayaran
- **2 Desember 2025**: Pengembangan fitur dasar
  - Implementasi invoice generation (HTML/PDF dengan Puppeteer)
  - Mock Midtrans payment gateway (VA, QRIS, GoPay, ShopeePay)
  - Halaman pembayaran untuk customer (/pay)
  - WhatsApp automation service placeholder (Fonnte template)
  - Integrasi payment dengan tracking dan invoice

## User Preferences
- Bahasa: Indonesia
- Framework: React + Vite + TypeScript
- UI Library: Shadcn/UI
- Backend: Express.js + TypeScript
- Database: PostgreSQL dengan Drizzle ORM
- Styling: Tailwind CSS
- Warna brand: Biru (#1e3a8a) dan Hijau Neon (#CCFF00)

## Project Architecture

### Frontend (`/src`)
- `/pages` - Halaman aplikasi
  - `/admin` - Halaman admin (Dashboard, Orders, Customers)
  - `Index.tsx` - Landing page
  - `Tracking.tsx` - Halaman tracking customer
  - `Payment.tsx` - Halaman pembayaran customer
- `/components` - Komponen React
  - `/ui` - Komponen Shadcn/UI
  - `/admin` - Komponen admin (AdminLayout)
- `/lib` - Utilities dan API client

### Backend (`/server`)
- `/src/routes` - API routes
  - `auth.ts` - Autentikasi (login/register)
  - `orders.ts` - CRUD orders
  - `customers.ts` - CRUD customers
  - `tracking.ts` - Public tracking API
  - `dashboard.ts` - Dashboard stats
  - `payments.ts` - Payment gateway (mock Midtrans)
  - `invoice.ts` - Invoice generation (HTML/PDF)
  - `testimonials.ts` - Customer feedback
- `/src/services` - Business logic
  - `invoice.ts` - Invoice generation service
  - `midtrans.ts` - Mock Midtrans payment gateway
  - `whatsapp.ts` - WhatsApp automation (Fonnte placeholder)
- `/src/db` - Database schema dan connection
- `/src/middleware` - Auth middleware

### Database Schema
- `users` - Admin/operator users
- `customers` - Customer data
- `orders` - Order data dengan tracking
- `order_items` - Detail produk dalam order
- `order_status_history` - Riwayat status produksi
- `payments` - Data pembayaran
- `payment_invoices` - Invoice untuk DP dan Pelunasan
- `production_expenses` - Pengeluaran produksi per project
- `message_logs` - Log pesan WhatsApp
- `testimonials` - Feedback customer

## Status Produksi (10 Tahap)
1. Pending - Menunggu
2. Design - Proses desain
3. Beli Bahan - Pembelian material
4. Potong/Printing - Pemotongan/printing
5. Jahit - Proses jahit
6. Bordir/Sablon - Finishing
7. QC - Quality Control
8. Packing - Pengemasan
9. Selesai - Produksi selesai
10. Dikirim - Sudah dikirim

## Payment Methods (Mock Midtrans)
- Bank Transfer: BCA, BNI, BRI, Mandiri, Permata (Virtual Account)
- QRIS - Scan dengan semua e-wallet/mobile banking
- GoPay
- ShopeePay

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key untuk JWT (opsional, ada default)
- `API_PORT` - Port untuk API server (default: 3001)

## Scripts
- `npm run dev` - Jalankan frontend + backend
- `npm run dev:frontend` - Jalankan frontend saja
- `npm run dev:backend` - Jalankan backend saja
- `npm run db:push` - Push schema ke database
- `npm run db:seed` - Seed admin user

## Default Credentials

### Super Admin (Master)
- Email: superadmin@sekala.id
- Password: super123
- Hak akses: Dapat menambah, edit, dan hapus admin lain

### Admin Biasa
- Dapat dibuat oleh Super Admin
- Hak akses: Kelola pesanan, pelanggan, pengeluaran, ganti password sendiri

## User Roles
- **superadmin**: Master admin, bisa kelola semua user (tambah/edit/hapus admin)
- **admin**: Admin biasa, akses penuh ke fitur bisnis (orders, customers, expenses)
- **production**: Akses terbatas untuk tim produksi
- **viewer**: Akses hanya lihat (read-only)

## Public Pages
- `/` - Landing page
- `/track` - Lacak pesanan
- `/track/:trackingCode` - Detail tracking
- `/pay` - Halaman pembayaran
- `/pay/:trackingCode` - Pembayaran untuk order tertentu

## Admin Pages
- `/admin/login` - Login admin
- `/admin/dashboard` - Dashboard statistik
- `/admin/orders` - Kelola orders
- `/admin/orders/new` - Buat order baru
- `/admin/orders/:id` - Detail order
- `/admin/customers` - Kelola customers
- `/admin/expenses` - Kelola pengeluaran produksi

## API Endpoints
### Public
- `GET /api/track/:trackingCode` - Tracking pesanan
- `POST /api/testimonials` - Submit testimoni
- `GET /api/testimonials/published` - Testimoni published
- `GET /api/payments/methods` - List metode pembayaran
- `POST /api/payments/create` - Buat transaksi pembayaran
- `GET /api/payments/status/:trackingCode` - Status pembayaran
- `POST /api/payments/simulate/:transactionId` - Simulasi pembayaran (demo)
- `GET /api/invoice/public/:trackingCode/html` - Invoice HTML
- `GET /api/invoice/public/:trackingCode/pdf` - Invoice PDF

### Authenticated (Bearer Token)
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Order detail
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update status
- `PATCH /api/orders/:id/payment` - Update payment
- `GET /api/customers` - List customers
- `GET /api/dashboard/stats` - Dashboard stats
- `POST /api/payments/manual` - Pembayaran manual
- `GET /api/invoice/:orderId/html` - Invoice HTML (admin)
- `GET /api/invoice/:orderId/pdf` - Invoice PDF (admin)
- `GET /api/expenses` - List pengeluaran produksi
- `GET /api/expenses/:id` - Detail pengeluaran
- `POST /api/expenses` - Create pengeluaran
- `PATCH /api/expenses/:id` - Update pengeluaran
- `DELETE /api/expenses/:id` - Hapus pengeluaran
- `GET /api/expenses/customers` - List customers untuk dropdown
- `GET /api/expenses/orders/:customerId` - List orders per customer

## Future Enhancements (Pending Integration)
- Integrasi Midtrans real (production keys)
- WhatsApp automation real (Fonnte/Qontak API keys)
- Export laporan Excel
- Multi-user admin dengan role-based access
