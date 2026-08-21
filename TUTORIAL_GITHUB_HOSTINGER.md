# 📘 Tutorial Pull dari GitHub & Upload ke Hostinger

Panduan lengkap untuk pull update terbaru dari GitHub, build, dan upload ke Hostinger.

---

## 📋 Workflow Lengkap

```
GitHub → Pull ke Komputer → Build → Upload ke Hostinger
```

---

## 1. Pull Update dari GitHub

### Di Terminal/Command Prompt (Komputer Anda):

```bash
# 1. Masuk ke folder project
cd nama-folder-project

# 2. Pull update terbaru dari GitHub
git pull origin main
```

**Catatan:**
- Ganti `main` dengan `master` jika branch utama Anda adalah `master`
- Pastikan Anda sudah clone repository sebelumnya
- Jika belum clone, jalankan: `git clone https://github.com/username/nama-repo.git`

### Output yang Benar:

```
remote: Enumerating objects: 5, done.
remote: Counting objects: 100% (5/5), done.
remote: Compressing objects: 100% (3/3), done.
remote: Total 3 (delta 2), reused 0 (delta 0)
Unpacking objects: 100% (3/3), done.
From https://github.com/username/nama-repo
 * branch            main       -> FETCH_HEAD
Updating abc1234..def5678
Fast-forward
 src/components/Testimonials.tsx | 34 +++++++++++++++++-----------------
 1 file changed, 17 insertions(+), 17 deletions(-)
```

---

## 2. Install Dependencies (Jika Ada Update Baru)

```bash
# Install/Update semua dependencies
npm install
```

**Output:**
```
added 382 packages, and audited 383 packages in 26s
```

---

## 3. Build Project untuk Production

```bash
# Build project
npm run build
```

**Output Sukses:**
```
> vite_react_shadcn_ts@0.0.0 build
> vite build

vite v5.4.20 building for production...
✓ 1724 modules transformed.
dist/index.html                   4.76 kB │ gzip:   1.56 kB
dist/assets/logo-DIj_RbdJ.png    36.88 kB
dist/assets/index-BBoeWKVt.css   70.59 kB │ gzip:  12.63 kB
dist/assets/index-_pCxjyKO.js   418.49 kB │ gzip: 131.07 kB
✓ built in 9.51s
```

### ✅ Periksa Hasil Build:

```bash
# Lihat isi folder dist
ls dist/
```

Harus ada:
- `index.html`
- Folder `assets/`
- Folder `galeri-customer/` (foto pelanggan)

---

## 4. Upload ke Hostinger

### Opsi A: Via cPanel File Manager (Paling Mudah)

#### Langkah 1: Login ke cPanel Hostinger
1. Buka `https://hpanel.hostinger.com` atau akses cPanel Anda
2. Login dengan kredensial Hostinger

#### Langkah 2: Backup File Lama (Opsional tapi Disarankan)
1. Buka **File Manager**
2. Masuk ke folder `public_html`
3. Select semua file → Klik **Compress** → Beri nama `backup-[tanggal].zip`
4. Download backup (untuk jaga-jaga)

#### Langkah 3: Hapus File Website Lama
1. Di folder `public_html`, **JANGAN hapus:**
   - File `.htaccess` (PENTING!)
   - Folder `cgi-bin` (jika ada)
   - File konfigurasi lain yang bukan milik website React
   
2. **Hapus file website lama:**
   - `index.html` (yang lama)
   - Folder `assets/` (yang lama)
   - Folder `galeri-customer/` (yang lama)
   - File lain yang berhubungan dengan website React

#### Langkah 4: Upload File Baru dari Folder `dist`
1. Klik tombol **Upload** di File Manager
2. **Pilih SEMUA file dan folder di DALAM folder `dist`**
3. Tunggu upload selesai (2-10 menit tergantung internet)

#### Langkah 5: Verifikasi Upload
Pastikan struktur di `public_html` seperti ini:

```
public_html/
├── .htaccess              ← JANGAN DIHAPUS!
├── index.html             ← File baru dari dist
├── galeri-customer/       ← Foto pelanggan
├── assets/                ← CSS & JS baru
└── (file lain jika ada)
```

---

### Opsi B: Via FTP/SFTP (Lebih Cepat untuk Update Rutin)

#### Setup FTP (Cukup Sekali Saja):

1. **Download FileZilla** (gratis): https://filezilla-project.org/

2. **Dapatkan Kredensial FTP dari Hostinger:**
   - Login ke Hostinger hPanel
   - **Files** → **FTP Accounts**
   - Lihat/buat akun FTP:
     - **Host:** `ftp.namadomainanda.com` atau IP hosting
     - **Username:** username FTP Anda
     - **Password:** password FTP Anda
     - **Port:** 21 (FTP) atau 22 (SFTP)

3. **Koneksi di FileZilla:**
   - Buka FileZilla
   - Masukkan Host, Username, Password, Port
   - Klik **Quickconnect**

#### Upload File (Setiap Kali Update):

1. **Panel Kiri** (Local): Navigasi ke folder `dist` di komputer
2. **Panel Kanan** (Server): Navigasi ke `public_html`
3. **Backup dulu** (optional): Download file lama
4. **Delete file lama** di server (kecuali `.htaccess`)
5. **Drag & drop** semua isi folder `dist` ke `public_html`

---

### Opsi C: Via Terminal SSH (Advanced - Jika Hostinger Support SSH)

**Catatan:** Tidak semua paket Hostinger support SSH. Cek dulu di hPanel.

```bash
# 1. Login via SSH
ssh username@namadomainanda.com

# 2. Masuk ke folder website
cd public_html

# 3. Backup file lama
tar -czf backup-$(date +%Y%m%d).tar.gz * --exclude=backup-*.tar.gz

# 4. Hapus file lama (HATI-HATI!)
rm -rf assets/ galeri-customer/ index.html

# 5. Upload file baru (dari komputer)
# Gunakan scp atau rsync dari komputer lokal:
# scp -r dist/* username@namadomainanda.com:~/public_html/
```

---

## 5. Testing Website

### ✅ Checklist Testing:

1. **Buka website:** `https://namadomainanda.com`
2. **Clear cache browser:** Ctrl + Shift + Delete (atau Cmd + Shift + Delete di Mac)
3. **Atau buka Incognito/Private Mode**

### Test:
- [ ] Halaman utama loading
- [ ] Logo muncul
- [ ] **Galeri Customer muncul semua** ✅ (FIXED!)
- [ ] Menu navigasi berfungsi
- [ ] Scroll smooth
- [ ] Animasi galeri jalan
- [ ] Tombol WhatsApp berfungsi
- [ ] Refresh halaman tidak error 404

---

## 6. Troubleshooting

### ❌ Problem 1: Gambar Galeri Masih Tidak Muncul

**Penyebab:** 
- Folder `galeri-customer` tidak ter-upload
- Build belum di-pull dari GitHub

**Solusi:**
```bash
# 1. Pull update terbaru (yang sudah fix)
git pull origin main

# 2. Build ulang
npm run build

# 3. Cek folder dist
ls dist/galeri-customer/

# 4. Upload ulang ke Hostinger
```

### ❌ Problem 2: Perubahan Tidak Keliatan

**Solusi:**
1. Clear cache browser (Ctrl + Shift + Delete)
2. Buka browser incognito/private
3. Tunggu 1-5 menit (Hostinger perlu waktu update cache)
4. Pastikan file ter-upload dengan benar

### ❌ Problem 3: Error 404 Saat Refresh

**Solusi:**
- File `.htaccess` terhapus atau salah konfigurasi
- Buat file `.htaccess` di `public_html`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

Options -Indexes
AddDefaultCharset UTF-8
```

### ❌ Problem 4: Website Blank/Putih

**Solusi:**
1. Tekan F12 di browser → tab **Console**
2. Lihat error yang muncul
3. Biasanya: file tidak ter-upload atau path salah
4. Re-upload folder `assets/` dan `galeri-customer/`

---

## 🔄 Workflow Update Rutin (Ringkasan)

Setiap kali ada update dari GitHub:

```bash
# 1. Pull update
git pull origin main

# 2. Install dependencies (jika ada update package.json)
npm install

# 3. Build
npm run build

# 4. Upload folder dist ke Hostinger
# - Via cPanel File Manager, atau
# - Via FTP/FileZilla
```

---

## 📊 Struktur Folder Final

### Di Komputer Lokal (Setelah Pull & Build):

```
project/
├── src/                    ← Source code
├── public/                 ← Assets public
│   └── galeri-customer/    ← ✅ Foto pelanggan (FIXED!)
├── dist/                   ← ⭐ INI YANG DI-UPLOAD!
│   ├── index.html
│   ├── galeri-customer/    ← Auto ter-copy dari public/
│   └── assets/
├── package.json
└── ...
```

### Di Hostinger (public_html):

```
public_html/
├── .htaccess               ← Config penting
├── index.html              ← Dari dist/
├── galeri-customer/        ← Foto pelanggan ✅
│   ├── IMG-20251008-WA0002_1759894910497.jpg
│   ├── IMG-20251008-WA0003_1759894910497.jpg
│   └── ... (17 foto lainnya)
└── assets/                 ← CSS & JS dari dist/
```

---

## 💡 Tips Pro

### 1. Gunakan Git Tag untuk Versioning

```bash
# Sebelum push ke GitHub
git tag -a v1.1.0 -m "Fix galeri customer"
git push origin v1.1.0
```

### 2. Buat Script Otomatis (Opsional)

Buat file `deploy.sh`:

```bash
#!/bin/bash
echo "🚀 Starting deployment..."

# Pull update
git pull origin main

# Install dependencies
npm install

# Build
npm run build

echo "✅ Build selesai! Upload folder 'dist' ke Hostinger"
```

Jalankan:
```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. Versi Cepat dengan rsync (Jika Ada SSH)

```bash
# Sync langsung ke server (one-command deploy)
rsync -avz --delete dist/ username@domain.com:~/public_html/
```

---

## 🆘 Butuh Bantuan?

1. **Cek Console Browser:** F12 → Console → Lihat error
2. **Cek Error Log Hostinger:** cPanel → Error Logs
3. **Contact Support Hostinger:** Chat/ticket

---

## ✅ Checklist Deployment

Setiap kali update:

- [ ] Pull dari GitHub (`git pull origin main`)
- [ ] Install dependencies jika perlu (`npm install`)
- [ ] Build project (`npm run build`)
- [ ] Backup file lama di Hostinger (opsional)
- [ ] Upload folder `dist` ke `public_html`
- [ ] Pastikan `.htaccess` tidak terhapus
- [ ] Test website di browser (clear cache dulu)
- [ ] Cek galeri customer muncul semua ✅
- [ ] Test navigasi & fitur lain

---

## 🎉 Selesai!

Website Sekala Industry sudah update dengan versi terbaru dari GitHub!

**Update Terbaru:** Masalah gambar galeri customer sudah FIXED! 🎊

---

**Dibuat:** 9 Oktober 2025  
**Fix:** Gambar galeri customer sekarang di `public/galeri-customer/`  
**Platform:** React + Vite + GitHub + Hostinger
