# Panduan Deploy Sekala Industry ke VPS

## Persiapan

### File yang Perlu Diupload
- `sekala-deploy.tar.gz` - File aplikasi terkompresi

### Struktur File dalam tar.gz
```
sekala-deploy.tar.gz
├── dist/              # Frontend build (React)
├── server/            # Backend (Express.js)
├── database/          # Database backup
│   └── sekala_full_backup.sql
├── package.json
├── package-lock.json
└── drizzle.config.ts
```

---

## Langkah 1: Upload File ke VPS

Dari komputer lokal, jalankan:
```bash
scp sekala-deploy.tar.gz root@72.60.76.117:/var/www/sekala-industry/
```

---

## Langkah 2: Login ke VPS

```bash
ssh root@72.60.76.117
```

---

## Langkah 3: Backup Database Lama (Opsional tapi Direkomendasikan)

Sebelum mengganti database, backup dulu yang lama:
```bash
cd /var/www/sekala-industry
pg_dump -U postgres -d sekala_industry > backup_sebelum_update_$(date +%Y%m%d_%H%M%S).sql
```

---

## Langkah 4: Extract dan Update Aplikasi

```bash
cd /var/www/sekala-industry

# Hapus folder lama
rm -rf dist server database

# Extract file baru
tar -xzvf sekala-deploy.tar.gz

# Hapus file tar.gz
rm sekala-deploy.tar.gz

# Install dependencies
npm install --production
```

---

## Langkah 5: Update Database (PENTING!)

### Opsi A: Reset Database dan Import Semua Data Baru
Gunakan opsi ini jika ingin database sama persis dengan Replit.

```bash
# Masuk ke PostgreSQL
sudo -u postgres psql

# Hapus database lama dan buat baru
DROP DATABASE IF EXISTS sekala_industry;
CREATE DATABASE sekala_industry;

# Keluar dari psql
\q

# Import database baru
sudo -u postgres psql -d sekala_industry < database/sekala_full_backup.sql
```

### Opsi B: Update Schema Saja (Pertahankan Data Produksi)
Gunakan opsi ini jika ada data produksi yang tidak boleh hilang.

```bash
# Hanya update schema (struktur tabel) menggunakan Drizzle
export DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/sekala_industry"
npx drizzle-kit push --force
```

---

## Langkah 6: Restart Aplikasi

```bash
# Restart backend dengan PM2
pm2 restart sekala-backend

# Atau restart semua proses PM2
pm2 restart all

# Cek status
pm2 status

# Lihat log untuk memastikan tidak ada error
pm2 logs sekala-backend --lines 50
```

---

## Langkah 7: Restart Nginx

```bash
# Test konfigurasi nginx
nginx -t

# Restart nginx
systemctl restart nginx

# Cek status nginx
systemctl status nginx
```

---

## Langkah 8: Verifikasi

1. Buka website di browser
2. Login ke admin panel dengan:
   - Email: `superadmin@sekala.id`
   - Password: `super123`
3. Cek halaman Dashboard, Orders, Customers, Expenses, Activity Logs

---

## Ringkasan Perintah (Copy-Paste)

### Dari Komputer Lokal:
```bash
scp sekala-deploy.tar.gz root@72.60.76.117:/var/www/sekala-industry/
```

### Di VPS:
```bash
ssh root@72.60.76.117

cd /var/www/sekala-industry

# Backup database lama
pg_dump -U postgres -d sekala_industry > backup_$(date +%Y%m%d).sql

# Update aplikasi
rm -rf dist server database
tar -xzvf sekala-deploy.tar.gz
rm sekala-deploy.tar.gz
npm install --production

# Reset dan import database baru (jika mau data sama dengan Replit)
sudo -u postgres psql -c "DROP DATABASE IF EXISTS sekala_industry;"
sudo -u postgres psql -c "CREATE DATABASE sekala_industry;"
sudo -u postgres psql -d sekala_industry < database/sekala_full_backup.sql

# Restart aplikasi
pm2 restart sekala-backend
systemctl restart nginx
```

---

## Troubleshooting

### Error: Permission denied
```bash
chmod -R 755 /var/www/sekala-industry
chown -R www-data:www-data /var/www/sekala-industry
```

### Error: Database connection failed
Pastikan DATABASE_URL di environment sudah benar:
```bash
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/sekala_industry"
```

### Error: PM2 not found
```bash
npm install -g pm2
```

### Error: Port sudah digunakan
```bash
# Cek proses yang menggunakan port
lsof -i :3001
# Kill proses jika perlu
kill -9 <PID>
```

---

## Kredensial Default

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@sekala.id | super123 |
| Admin | admin@sekala.id | admin123 |

---

## Catatan Penting

1. **Backup Rutin**: Selalu backup database sebelum update
2. **Environment Variables**: Pastikan DATABASE_URL sudah dikonfigurasi dengan benar
3. **Log Monitoring**: Pantau log dengan `pm2 logs` untuk mendeteksi masalah
4. **SSL Certificate**: Pastikan SSL certificate masih valid
