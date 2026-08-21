# Panduan Deploy Sekala Industry ke VPS

## LANGKAH 1: Download File dari Replit

Klik kanan file `sekala-deploy-new.tar.gz` di panel Files sebelah kiri, lalu pilih **Download**.

---

## LANGKAH 2: Upload ke VPS via SCP

Buka terminal di komputer Anda dan jalankan:

```bash
scp sekala-deploy-new.tar.gz root@72.60.76.117:/var/www/
```

---

## LANGKAH 3: SSH ke VPS dan Deploy

```bash
# Login ke VPS
ssh root@72.60.76.117

# Masuk ke direktori
cd /var/www

# Stop server dulu
pm2 stop sekala-api

# Backup folder lama (opsional, untuk jaga-jaga)
mv sekala-industry sekala-industry-backup-$(date +%Y%m%d)

# Buat folder baru dan extract
mkdir -p sekala-industry
tar xzvf sekala-deploy-new.tar.gz -C sekala-industry

# Masuk ke folder project
cd sekala-industry

# Buat file .env dengan database Anda
cat > .env << 'EOF'
DATABASE_URL=postgresql://sekala_user:SekalaPass123@localhost:5432/sekala_industry
JWT_SECRET=sekala-production-secret-key-2025
NODE_ENV=production
PORT=3001
EOF

# Install dependencies
npm install --production

# Push schema database (jika ada perubahan schema)
npm run db:push

# Start server dengan PM2
pm2 start npm --name "sekala-api" -- run start

# Pastikan auto-start saat reboot
pm2 save

# Cek status
pm2 status
pm2 logs sekala-api --lines 20
```

---

## LANGKAH 4: Konfigurasi Nginx (jika perlu)

Pastikan Nginx mengarah ke folder dist baru:

```bash
# Cek konfigurasi nginx
cat /etc/nginx/sites-available/sekala-industry

# Restart nginx
sudo systemctl restart nginx
```

---

## Hapus Backup Setelah Berhasil (Opsional)

```bash
rm -rf /var/www/sekala-industry-backup-*
rm /var/www/sekala-deploy-new.tar.gz
```

---

## Perubahan Terbaru (10 Desember 2025)

- **Fix bug navigasi logo**: Logo di sidebar admin sekarang mengarah ke menu pertama yang diizinkan, bukan langsung ke dashboard. Ini memperbaiki bug dimana admin tanpa akses dashboard bisa masuk dashboard lewat klik logo.

---

Jika ada error atau butuh bantuan saat proses deploy, kirimkan pesan errornya dan saya bantu selesaikan.
