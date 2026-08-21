# Tutorial Deploy Konveksi Industry ke VPS (Upload Manual dari Laptop)

## Informasi Server
- **Domain**: konveksiindustry.com
- **IP Server**: 72.60.76.117
- **SSH Access**: `ssh root@72.60.76.117`

---

## BAGIAN 1: PERSIAPAN DI LAPTOP

### Langkah 1.1: Build Aplikasi untuk Production

Buka terminal di folder project, lalu jalankan:

```bash
# Install dependencies (jika belum)
npm install

# Build frontend untuk production
npm run build
```

Ini akan membuat folder `dist/` yang berisi file-file frontend yang sudah dioptimasi.

### Langkah 1.2: Buat File Backend untuk Production

Buat file zip yang berisi semua file yang diperlukan:

```bash
# Di Windows (PowerShell):
Compress-Archive -Path dist, server, package.json, package-lock.json, drizzle.config.ts, drizzle -DestinationPath konveksi-industry.zip

# Di Mac/Linux:
zip -r konveksi-industry.zip dist server package.json package-lock.json drizzle.config.ts drizzle
```

---

## BAGIAN 2: PERSIAPAN VPS

### Langkah 2.1: Login ke VPS

```bash
ssh root@72.60.76.117
```

Masukkan password ketika diminta.

### Langkah 2.2: Update Sistem

```bash
apt update && apt upgrade -y
```

### Langkah 2.3: Install Node.js 20

```bash
# Install curl jika belum ada
apt install -y curl

# Download dan install NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Install Node.js
apt install -y nodejs

# Verifikasi instalasi
node --version
npm --version
```

### Langkah 2.4: Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### Langkah 2.5: Install Nginx

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### Langkah 2.6: Install PostgreSQL

```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### Langkah 2.7: Setup Database PostgreSQL

```bash
# Masuk ke PostgreSQL
sudo -u postgres psql

# Di dalam PostgreSQL shell, jalankan:
CREATE DATABASE konveksi_industry;
CREATE USER konveksi_user WITH ENCRYPTED PASSWORD 'password_anda_disini';
GRANT ALL PRIVILEGES ON DATABASE konveksi_industry TO konveksi_user;
\c konveksi_industry
GRANT ALL ON SCHEMA public TO konveksi_user;
\q
```

**PENTING**: Ganti `password_anda_disini` dengan password yang kuat!

### Langkah 2.8: Buat Folder Aplikasi

```bash
mkdir -p /var/www/konveksi-industry
```

---

## BAGIAN 3: UPLOAD FILE KE VPS

### Langkah 3.1: Upload dari Laptop

Buka terminal **BARU** di laptop Anda (jangan di VPS), lalu:

```bash
# Upload file zip ke VPS
scp konveksi-industry.zip root@72.60.76.117:/var/www/konveksi-industry/
```

### Langkah 3.2: Extract File di VPS

Kembali ke terminal VPS:

```bash
cd /var/www/konveksi-industry
apt install -y unzip
unzip konveksi-industry.zip
rm konveksi-industry.zip
```

### Langkah 3.3: Install Dependencies di VPS

```bash
cd /var/www/konveksi-industry
npm install --production
```

---

## BAGIAN 4: KONFIGURASI ENVIRONMENT

### Langkah 4.1: Buat File .env

```bash
nano /var/www/konveksi-industry/.env
```

Isi dengan:

```env
# Database
DATABASE_URL=postgresql://konveksi_user:password_anda_disini@localhost:5432/konveksi_industry

# Server
NODE_ENV=production
PORT=3001

# JWT Secret (ganti dengan string acak yang panjang)
JWT_SECRET=ganti_dengan_secret_key_yang_sangat_panjang_dan_acak_123456789
```

Tekan `Ctrl+X`, lalu `Y`, lalu `Enter` untuk menyimpan.

### Langkah 4.2: Setup Database Schema

```bash
cd /var/www/konveksi-industry
npx drizzle-kit push
```

---

## BAGIAN 5: SETUP PM2 UNTUK BACKEND

### Langkah 5.1: Buat File Konfigurasi PM2

```bash
nano /var/www/konveksi-industry/ecosystem.config.cjs
```

Isi dengan:

```javascript
module.exports = {
  apps: [{
    name: 'konveksi-backend',
    script: 'server/src/index.ts',
    interpreter: 'npx',
    interpreter_args: 'tsx',
    cwd: '/var/www/konveksi-industry',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

Simpan file dengan `Ctrl+X`, `Y`, `Enter`.

### Langkah 5.2: Install tsx secara global

```bash
npm install -g tsx
```

### Langkah 5.3: Jalankan Backend dengan PM2

```bash
cd /var/www/konveksi-industry
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### Langkah 5.4: Cek Status Backend

```bash
pm2 status
pm2 logs konveksi-backend
```

---

## BAGIAN 6: KONFIGURASI NGINX

### Langkah 6.1: Hapus Konfigurasi Default

```bash
rm /etc/nginx/sites-enabled/default
```

### Langkah 6.2: Buat Konfigurasi Baru

```bash
nano /etc/nginx/sites-available/konveksi-industry
```

Isi dengan:

```nginx
server {
    listen 80;
    server_name konveksiindustry.com www.konveksiindustry.com;

    # Frontend (React)
    root /var/www/konveksi-industry/dist;
    index index.html;

    # Handle React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;
    gzip_disable "MSIE [1-6]\.";

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/konveksi-industry_access.log;
    error_log /var/log/nginx/konveksi-industry_error.log;
}
```

Simpan dengan `Ctrl+X`, `Y`, `Enter`.

### Langkah 6.3: Aktifkan Konfigurasi

```bash
ln -s /etc/nginx/sites-available/konveksi-industry /etc/nginx/sites-enabled/

# Test konfigurasi
nginx -t

# Restart Nginx
systemctl restart nginx
```

---

## BAGIAN 7: SETUP SSL (HTTPS)

### Langkah 7.1: Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### Langkah 7.2: Dapatkan Sertifikat SSL

```bash
certbot --nginx -d konveksiindustry.com -d www.konveksiindustry.com
```

Ikuti instruksi yang muncul:
1. Masukkan email Anda
2. Setujui Terms of Service
3. Pilih untuk redirect HTTP ke HTTPS (opsi 2)

### Langkah 7.3: Test Auto-Renewal

```bash
certbot renew --dry-run
```

---

## BAGIAN 8: KONFIGURASI DNS DOMAIN

Di panel domain Anda (Hostinger, Namecheap, dll), tambahkan DNS record:

| Type | Name | Value |
|------|------|-------|
| A | @ | 72.60.76.117 |
| A | www | 72.60.76.117 |

**Catatan**: Perubahan DNS bisa memakan waktu 1-48 jam untuk propagasi.

---

## BAGIAN 9: FIREWALL (OPSIONAL TAPI DIREKOMENDASIKAN)

```bash
# Install UFW
apt install -y ufw

# Allow SSH, HTTP, HTTPS
ufw allow ssh
ufw allow 'Nginx Full'

# Enable firewall
ufw enable

# Cek status
ufw status
```

---

## BAGIAN 10: PERINTAH BERGUNA

### Restart Backend
```bash
pm2 restart konveksi-backend
```

### Lihat Log Backend
```bash
pm2 logs konveksi-backend
```

### Restart Nginx
```bash
systemctl restart nginx
```

### Lihat Log Nginx
```bash
tail -f /var/log/nginx/konveksi-industry_error.log
```

### Update Aplikasi (setelah upload file baru)
```bash
cd /var/www/konveksi-industry
pm2 restart konveksi-backend
systemctl restart nginx
```

---

## TROUBLESHOOTING

### Error: "502 Bad Gateway"
Backend tidak berjalan. Cek dengan:
```bash
pm2 status
pm2 logs konveksi-backend
```

### Error: "Connection refused" di API
Pastikan backend berjalan di port 3001:
```bash
pm2 restart konveksi-backend
```

### Error: Database connection
Cek koneksi database:
```bash
sudo -u postgres psql -c "SELECT 1"
```

Cek file .env sudah benar.

### Halaman tidak update setelah upload baru
Clear cache browser atau buka di incognito mode.

---

## CHECKLIST FINAL

- [ ] VPS sudah di-update
- [ ] Node.js terinstall
- [ ] PM2 terinstall
- [ ] Nginx terinstall
- [ ] PostgreSQL terinstall dan database dibuat
- [ ] File aplikasi sudah diupload dan di-extract
- [ ] Dependencies terinstall
- [ ] File .env sudah dibuat dengan benar
- [ ] Database schema sudah di-push
- [ ] PM2 menjalankan backend
- [ ] Nginx dikonfigurasi dengan benar
- [ ] SSL sudah aktif
- [ ] DNS sudah dikonfigurasi

---

## KONTAK SUPPORT

Jika ada masalah, cek:
1. `pm2 logs konveksi-backend` - untuk error backend
2. `tail -f /var/log/nginx/konveksi-industry_error.log` - untuk error Nginx
3. `journalctl -u nginx` - untuk log sistem Nginx

---

**Tutorial dibuat untuk Konveksi Industry**
**Domain: konveksiindustry.com**
**Server: 72.60.76.117**
