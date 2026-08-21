# Panduan Deploy Sekala Industry ke VPS Hostinger

## Persyaratan VPS
- VPS Hostinger dengan OS **Ubuntu 22.04** atau **Ubuntu 24.04**
- Minimal RAM: 2GB
- Minimal Storage: 20GB
- Akses SSH ke VPS

---

## BAGIAN 1: File yang Harus Diupload

### File/Folder yang DIUPLOAD:
```
sekala-industry/
├── server/                 # Backend Express.js (WAJIB)
├── src/                    # Frontend React (WAJIB)
├── public/                 # Assets public (WAJIB)
├── drizzle/                # Database migrations (WAJIB)
├── package.json            # Dependencies (WAJIB)
├── package-lock.json       # Lock file (WAJIB)
├── tsconfig.json           # TypeScript config (WAJIB)
├── tsconfig.app.json       # TypeScript app config (WAJIB)
├── tsconfig.node.json      # TypeScript node config (WAJIB)
├── vite.config.ts          # Vite config (WAJIB)
├── tailwind.config.ts      # Tailwind config (WAJIB)
├── postcss.config.js       # PostCSS config (WAJIB)
├── drizzle.config.ts       # Drizzle config (WAJIB)
├── components.json         # Shadcn config (WAJIB)
├── index.html              # Entry HTML (WAJIB)
└── .env                    # Environment variables (BUAT DI VPS)
```

### File/Folder yang TIDAK DIUPLOAD:
```
node_modules/               # Install ulang di VPS
dist/                       # Build ulang di VPS
.git/                       # Version control
*.log                       # Log files
bun.lock                    # Bun lock (pakai npm)
attached_assets/            # Asset temporary
*.tar.gz                    # Archive files
TUTORIAL*.md                # Tutorial files
replit.md                   # Replit-specific
```

---

## BAGIAN 2: Persiapan di Komputer Lokal

### Langkah 1: Download Project dari Replit

**Opsi A: Download ZIP**
1. Di Replit, klik menu **3 titik (⋮)** di sidebar kiri
2. Pilih **"Download as ZIP"**
3. Extract ZIP di komputer lokal
4. Hapus file/folder yang tidak perlu (lihat daftar di atas)

**Opsi B: Clone via Git (Jika terhubung ke GitHub)**
```bash
git clone https://github.com/USERNAME/REPO-NAME.git
cd REPO-NAME
```

### Langkah 2: Buat file .env.production
Buat file `.env.production` dengan isi:
```env
# Database PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/sekala_industry

# Server
NODE_ENV=production
API_PORT=3001

# JWT Secret (ganti dengan string random panjang)
JWT_SECRET=ganti_dengan_secret_key_yang_panjang_dan_random_123456
```

---

## BAGIAN 3: Setup VPS Hostinger

### Langkah 1: Login ke VPS via SSH

```bash
ssh root@IP_VPS_ANDA
```

Atau gunakan **Hostinger hPanel → VPS → Access → Terminal**

### Langkah 2: Update System

```bash
apt update && apt upgrade -y
```

### Langkah 3: Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
node --version  # Harus v20.x.x
npm --version
```

### Langkah 4: Install PostgreSQL

```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### Langkah 5: Setup Database PostgreSQL

```bash
# Masuk ke PostgreSQL
sudo -u postgres psql

# Di dalam psql, jalankan:
CREATE USER sekala_admin WITH PASSWORD 'password_aman_anda';
CREATE DATABASE sekala_industry OWNER sekala_admin;
GRANT ALL PRIVILEGES ON DATABASE sekala_industry TO sekala_admin;
\q
```

### Langkah 6: Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### Langkah 7: Install Nginx

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### Langkah 8: Install Chromium (untuk PDF generation)

```bash
apt install -y chromium-browser
# atau
apt install -y chromium
```

---

## BAGIAN 4: Upload dan Deploy Aplikasi

### Langkah 1: Buat Folder Aplikasi

```bash
mkdir -p /var/www/sekala-industry
cd /var/www/sekala-industry
```

### Langkah 2: Upload File ke VPS

**Opsi A: Menggunakan SCP (dari komputer lokal)**
```bash
# Di komputer lokal, jalankan:
scp -r ./sekala-industry/* root@IP_VPS_ANDA:/var/www/sekala-industry/
```

**Opsi B: Menggunakan FileZilla (SFTP)**
1. Buka FileZilla
2. Connect ke VPS dengan SFTP:
   - Host: sftp://IP_VPS_ANDA
   - Username: root
   - Password: password VPS
   - Port: 22
3. Upload semua file ke `/var/www/sekala-industry/`

**Opsi C: Menggunakan Git**
```bash
cd /var/www/sekala-industry
git clone https://github.com/USERNAME/REPO.git .
```

### Langkah 3: Setup Environment Variables

```bash
cd /var/www/sekala-industry

# Buat file .env
nano .env
```

Isi dengan:
```env
DATABASE_URL=postgresql://sekala_admin:password_aman_anda@localhost:5432/sekala_industry
NODE_ENV=production
API_PORT=3001
JWT_SECRET=ganti_dengan_secret_key_panjang_random_anda
```

Simpan: `Ctrl+X`, lalu `Y`, lalu `Enter`

### Langkah 4: Install Dependencies

```bash
cd /var/www/sekala-industry
npm install
```

### Langkah 5: Setup Database Schema

```bash
npm run db:push
npm run db:seed
```

### Langkah 6: Build Frontend

```bash
npm run build
```

### Langkah 7: Buat Script Start Production

Buat file `ecosystem.config.cjs`:
```bash
nano ecosystem.config.cjs
```

Isi dengan:
```javascript
module.exports = {
  apps: [
    {
      name: 'sekala-backend',
      script: 'npx',
      args: 'tsx server/src/index.ts',
      cwd: '/var/www/sekala-industry',
      env: {
        NODE_ENV: 'production',
        API_PORT: 3001
      }
    },
    {
      name: 'sekala-frontend',
      script: 'npx',
      args: 'vite preview --host 0.0.0.0 --port 5000',
      cwd: '/var/www/sekala-industry',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

### Langkah 8: Start Aplikasi dengan PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## BAGIAN 5: Setup Nginx sebagai Reverse Proxy

### Langkah 1: Buat Konfigurasi Nginx

```bash
nano /etc/nginx/sites-available/sekala-industry
```

Isi dengan:
```nginx
server {
    listen 80;
    server_name sekalaindustry.com www.sekalaindustry.com;

    # Frontend (React)
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Langkah 2: Aktifkan Konfigurasi

```bash
ln -s /etc/nginx/sites-available/sekala-industry /etc/nginx/sites-enabled/
nginx -t  # Test konfigurasi
systemctl restart nginx
```

### Langkah 3: Setup Firewall

```bash
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw enable
```

---

## BAGIAN 6: Setup SSL (HTTPS)

### Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### Generate SSL Certificate

```bash
certbot --nginx -d sekalaindustry.com -d www.sekalaindustry.com
```

Ikuti instruksi di layar, masukkan email dan setujui terms.

---

## BAGIAN 7: Testing

### Cek Status Aplikasi

```bash
pm2 status
pm2 logs
```

### Cek Website

1. Buka browser
2. Akses: `https://sekalaindustry.com`
3. Login dengan:
   - Email: `superadmin@sekala.id`
   - Password: `super123`

---

## BAGIAN 8: Maintenance

### Restart Aplikasi

```bash
pm2 restart all
```

### Lihat Logs

```bash
pm2 logs sekala-backend
pm2 logs sekala-frontend
```

### Update Aplikasi

```bash
cd /var/www/sekala-industry
git pull origin main  # atau upload file baru
npm install
npm run build
pm2 restart all
```

### Backup Database

```bash
pg_dump -U sekala_admin sekala_industry > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
psql -U sekala_admin sekala_industry < backup_20251203.sql
```

---

## Troubleshooting

### Error: EACCES permission denied

```bash
chown -R $USER:$USER /var/www/sekala-industry
chmod -R 755 /var/www/sekala-industry
```

### Error: Port already in use

```bash
lsof -i :3001
lsof -i :5000
kill -9 PID_NUMBER
```

### Error: Database connection failed

```bash
# Cek PostgreSQL berjalan
systemctl status postgresql

# Cek koneksi database
psql -U sekala_admin -d sekala_industry -h localhost
```

### Error: Puppeteer/Chromium tidak jalan

```bash
apt install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 libgtk-3-0 libnspr4 libnss3 libxcomposite1 libxdamage1 libxrandr2 xdg-utils
```

---

## Ringkasan Perintah Penting

```bash
# Start aplikasi
pm2 start ecosystem.config.cjs

# Stop aplikasi
pm2 stop all

# Restart aplikasi
pm2 restart all

# Lihat status
pm2 status

# Lihat logs
pm2 logs

# Restart Nginx
systemctl restart nginx

# Restart PostgreSQL
systemctl restart postgresql
```

---

## Checklist Deployment

- [ ] VPS Ubuntu sudah ready
- [ ] Node.js 20 terinstall
- [ ] PostgreSQL terinstall dan database dibuat
- [ ] File aplikasi sudah diupload
- [ ] File .env sudah dibuat dengan DATABASE_URL yang benar
- [ ] npm install berhasil
- [ ] npm run db:push berhasil
- [ ] npm run db:seed berhasil
- [ ] npm run build berhasil
- [ ] PM2 sudah running
- [ ] Nginx sudah dikonfigurasi
- [ ] SSL sudah aktif
- [ ] Website bisa diakses

---

**Selamat! Aplikasi Sekala Industry Anda sudah live di VPS Hostinger!**
