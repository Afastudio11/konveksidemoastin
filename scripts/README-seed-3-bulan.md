# Seed Demo 3 Bulan

`seed_full_3_months.sql` mengisi data demo pada tiga bulan kalender terakhir, termasuk bulan berjalan. Data yang dibuat mencakup Dashboard, Orders, Pelanggan, Pengeluaran, Log Aktivitas, Manajemen User, pembayaran, invoice, riwayat produksi, tracking, pesan, dan testimoni.

Skrip bersifat idempoten: saat dijalankan ulang, hanya data demo berprefix `DEMO-3B` yang diganti. Data operasional yang sudah ada tidak dihapus.

## Upload dan jalankan di VPS

```bash
scp -r scripts root@IP_VPS:/var/www/sekala-industry/
ssh root@IP_VPS 'cd /var/www/sekala-industry && bash scripts/run-seed-3-bulan.sh'
```

Sesuaikan `root@IP_VPS` dan `/var/www/sekala-industry` dengan server Anda. Pastikan service `db` Docker Compose telah aktif.

## Akun demo

| Email | Password | Peran |
| --- | --- | --- |
| owner.demo@seed.konveksi.invalid | DemoKonveksi2026! | Superadmin |
| admin.demo@seed.konveksi.invalid | DemoKonveksi2026! | Admin |
| keuangan.demo@seed.konveksi.invalid | DemoKonveksi2026! | Admin |
| produksi.demo@seed.konveksi.invalid | DemoKonveksi2026! | Admin |
