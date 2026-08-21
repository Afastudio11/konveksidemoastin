# Tutorial Deployment Sekala Industry ke VPS

## Persiapan di Replit

File yang perlu didownload:
- `sekala-deploy-complete.tar.gz` (35MB) - Semua source code

---

## LANGKAH 1: Upload File ke VPS

```bash
# Dari komputer lokal setelah download dari Replit
scp sekala-deploy-complete.tar.gz root@sekalaindustry.com:/tmp/
```

Atau jika menggunakan FileZilla/WinSCP:
- Upload `sekala-deploy-complete.tar.gz` ke folder `/tmp/` di VPS

---

## LANGKAH 2: Deploy di VPS (Clean Deploy)

Login ke VPS via SSH:
```bash
ssh root@sekalaindustry.com
```

Jalankan perintah berikut satu per satu:

```bash
# 1. Masuk ke folder project
cd /var/www/sekala-industry

# 2. Stop aplikasi
pm2 stop all

# 3. Backup database (PENTING!)
pg_dump -U sekala_user -d sekala_db > /tmp/backup-$(date +%Y%m%d-%H%M%S).sql

# 4. Hapus semua file lama KECUALI .env dan node_modules
find . -mindepth 1 ! -name '.env' ! -name 'node_modules' -exec rm -rf {} + 2>/dev/null

# 5. Extract file baru
tar -xzf /tmp/sekala-deploy-complete.tar.gz

# 6. Install dependencies
npm install

# 7. Build aplikasi
npm run build

# 8. Sync database schema (tanpa menghapus data)
npm run db:push

# 9. Restart aplikasi
pm2 restart all

# 10. Cek status
pm2 status
pm2 logs --lines 50
```

---

## LANGKAH 3: Verifikasi

1. Buka browser: https://sekalaindustry.com
2. Login sebagai superadmin
3. Cek apakah semua data masih ada
4. Test fitur edit/hapus order (hanya muncul untuk superadmin)

---

## Script Otomatis (Opsional)

Buat file script untuk mempermudah deploy selanjutnya:

```bash
# Buat file deploy.sh di VPS
cat > /root/deploy-sekala.sh << 'EOF'
#!/bin/bash
set -e

echo "=== Sekala Industry Deployment Script ==="
cd /var/www/sekala-industry

echo "1. Stopping application..."
pm2 stop all

echo "2. Backing up database..."
pg_dump -U sekala_user -d sekala_db > /tmp/backup-$(date +%Y%m%d-%H%M%S).sql

echo "3. Removing old files (keeping .env)..."
find . -mindepth 1 ! -name '.env' ! -name 'node_modules' -exec rm -rf {} + 2>/dev/null || true

echo "4. Extracting new files..."
tar -xzf /tmp/sekala-deploy-complete.tar.gz

echo "5. Installing dependencies..."
npm install

echo "6. Building application..."
npm run build

echo "7. Syncing database schema..."
npm run db:push

echo "8. Restarting application..."
pm2 restart all

echo "9. Checking status..."
pm2 status

echo "=== Deployment Complete! ==="
EOF

chmod +x /root/deploy-sekala.sh
```

Untuk deploy selanjutnya, cukup jalankan:
```bash
# Upload file baru ke /tmp/
# Lalu jalankan:
/root/deploy-sekala.sh
```

---

## Troubleshooting

### Jika aplikasi tidak bisa start:
```bash
pm2 logs --lines 100
```

### Jika perlu rollback database:
```bash
# List backup files
ls -la /tmp/backup-*.sql

# Restore dari backup tertentu
psql -U sekala_user -d sekala_db < /tmp/backup-YYYYMMDD-HHMMSS.sql
```

### Jika perlu cek database connection:
```bash
# Cek .env file
cat /var/www/sekala-industry/.env | grep DATABASE

# Test koneksi
psql -U sekala_user -d sekala_db -c "SELECT COUNT(*) FROM orders;"
```

---

## Catatan Penting

1. **Jangan hapus file `.env`** - Berisi konfigurasi database dan JWT secret
2. **Selalu backup database** sebelum deploy
3. **`npm run db:push`** akan sync schema tanpa menghapus data yang sudah ada
4. Jika ingin reset database, gunakan: `npm run db:push --force` (HATI-HATI: menghapus semua data!)
