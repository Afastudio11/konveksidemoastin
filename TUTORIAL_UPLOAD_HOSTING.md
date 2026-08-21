# 📘 Tutorial Upload Website Konveksi Industry ke Web Hosting

Panduan lengkap untuk mengupload website React + Vite ke web hosting pribadi Anda (cPanel/Shared Hosting).

---

## 📋 Daftar Isi
1. [Persiapan Sebelum Upload](#1-persiapan-sebelum-upload)
2. [Build Website untuk Production](#2-build-website-untuk-production)
3. [Upload ke Web Hosting](#3-upload-ke-web-hosting)
4. [Konfigurasi Web Server](#4-konfigurasi-web-server)
5. [Testing dan Troubleshooting](#5-testing-dan-troubleshooting)

---

## 1. Persiapan Sebelum Upload

### ✅ Checklist Yang Dibutuhkan:
- [ ] Akses ke cPanel web hosting Anda
- [ ] Domain sudah terhubung ke hosting
- [ ] Node.js terinstall di komputer Anda (untuk build)
- [ ] Semua dependencies terinstall

### 🔧 Cek Instalasi Dependencies

```bash
# Pastikan semua package terinstall
npm install
```

**Output yang benar:**
```
added 382 packages, and audited 383 packages in 31s
```

---

## 2. Build Website untuk Production

### Langkah 1: Build Project

Jalankan perintah build di terminal/command prompt:

```bash
npm run build
```

**Proses yang terjadi:**
- Vite akan mengoptimasi semua file JavaScript & CSS
- Mengkompress gambar dan asset
- Membuat file production di folder `dist`
- Membuat hash untuk cache busting

**Output sukses:**
```
✓ built in 5.23s
✓ dist/index.html
✓ dist/assets/...
```

### Langkah 2: Test Build Secara Lokal

Sebelum upload, pastikan build berjalan dengan baik:

```bash
npm run preview
```

Buka browser ke `http://localhost:4173` dan cek apakah website berfungsi normal.

### Langkah 3: Periksa Folder `dist`

Setelah build, Anda akan memiliki folder `dist` dengan struktur seperti ini:

```
dist/
├── index.html
├── galeri-customer/        # ✅ Foto-foto pelanggan Anda (FIXED!)
│   ├── IMG-20251008-WA0002_1759894910497.jpg
│   ├── IMG-20251008-WA0003_1759894910497.jpg
│   ├── IMG-20251008-WA0004_1759894910498.jpg
│   └── ... (17 foto lainnya)
├── assets/                 # File CSS, JS, dan gambar yang sudah dioptimasi
│   ├── index-[hash].css
│   ├── index-[hash].js
│   ├── logo-[hash].png
│   └── ...
└── (file public lainnya jika ada)
```

**✅ PERBAIKAN TERBARU (9 Oktober 2025):**
Folder gambar customer telah dipindahkan dari `attached_assets/` ke `galeri-customer/` di dalam folder `public/`. Ini memastikan semua foto pelanggan otomatis ter-copy saat build dan muncul sempurna di hosting!

---

## 3. Upload ke Web Hosting

### Metode A: Via cPanel File Manager (Paling Mudah)

#### Langkah 1: Login ke cPanel
1. Buka `https://domainanda.com/cpanel` atau `https://cpanel.hostinganda.com`
2. Login dengan username dan password hosting

#### Langkah 2: Buka File Manager
1. Cari menu **"File Manager"**
2. Klik untuk membuka

#### Langkah 3: Navigasi ke Folder Web
1. Masuk ke folder **`public_html`** (untuk domain utama)
   - Atau `public_html/subfolder` jika menggunakan subdomain/subfolder

#### Langkah 4: Hapus File Default (Jika Ada)
1. Hapus file seperti `index.html`, `index.php` yang sudah ada
2. **PENTING:** Jangan hapus file `.htaccess` jika sudah ada (kita akan edit nanti)

#### Langkah 5: Upload Semua File dari Folder `dist`
1. Klik tombol **"Upload"** di File Manager
2. **Pilih SEMUA file dan folder di DALAM folder `dist`**
   - **PENTING:** Upload ISI folder `dist`, bukan folder `dist` itu sendiri
3. File yang harus di upload:
   - ✅ `index.html`
   - ✅ Folder `assets/`
   - ✅ Folder `attached_assets/` (foto pelanggan)
   - ✅ Folder `public/` (jika ada)
   - ✅ Semua file lainnya

#### Langkah 6: Tunggu Upload Selesai
Upload mungkin memakan waktu 2-10 menit tergantung kecepatan internet.

---

### Metode B: Via FTP/SFTP (Alternatif)

Jika Anda lebih nyaman menggunakan FTP client seperti FileZilla:

#### Langkah 1: Setup FTP Client
1. Download [FileZilla](https://filezilla-project.org/) (gratis)
2. Buka FileZilla
3. Masukkan kredensial FTP dari cPanel:
   - **Host:** `ftp.domainanda.com` atau IP hosting
   - **Username:** Username cPanel Anda
   - **Password:** Password cPanel Anda
   - **Port:** 21 (FTP) atau 22 (SFTP)

#### Langkah 2: Upload File
1. Panel kiri: Navigasi ke folder `dist` di komputer Anda
2. Panel kanan: Navigasi ke `public_html` di server
3. Pilih SEMUA isi folder `dist`
4. Drag & drop ke `public_html`

---

## 4. Konfigurasi Web Server

### ⚠️ PENTING: Konfigurasi .htaccess untuk React Router

Website React menggunakan **Single Page Application (SPA)** routing. Tanpa konfigurasi khusus, halaman akan error 404 saat di-refresh atau akses langsung.

#### Langkah 1: Buat/Edit File `.htaccess`

Di folder `public_html`, buat file bernama `.htaccess` dengan isi:

```apache
# Enable Rewrite Engine
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l

  # Redirect all requests to index.html
  RewriteRule . /index.html [L]
</IfModule>

# Disable directory browsing
Options -Indexes

# Set default charset
AddDefaultCharset UTF-8

# Compress files for faster loading
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching for static files
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>
```

#### Cara Membuat `.htaccess` di cPanel:

1. Di File Manager, klik **"+ File"** atau **"New File"**
2. Nama file: `.htaccess` (dengan titik di depan)
3. Klik kanan file > **"Edit"**
4. Copy-paste kode di atas
5. **Save Changes**

---

## 5. Testing dan Troubleshooting

### ✅ Cek Website Anda

1. Buka browser
2. Akses `https://domainanda.com`
3. Website Konveksi Industry harus muncul

### 🔍 Test Checklist:

- [ ] Halaman utama loading dengan benar
- [ ] Logo dan gambar muncul
- [ ] Galeri Costumer (foto pelanggan) muncul
- [ ] Menu navigasi berfungsi (Beranda, Tentang, Pricelist, Kontak)
- [ ] Scroll halaman smooth
- [ ] Animasi berjalan (galeri foto, dll)
- [ ] Form kontak berfungsi (jika ada)
- [ ] Tombol WhatsApp berfungsi
- [ ] Coba refresh halaman (tidak error 404)

---

### ❌ Troubleshooting Masalah Umum

#### Problem 1: Halaman Blank/Putih
**Solusi:**
1. Cek di browser, tekan `F12` > tab **Console**
2. Lihat error yang muncul
3. Biasanya masalah: path file salah

**Fix:**
- Pastikan `index.html` ada di root `public_html`
- Cek folder `assets` dan `attached_assets` ter-upload

#### Problem 2: Gambar Tidak Muncul
**Solusi:**
1. Cek folder `attached_assets` sudah ter-upload
2. Cek folder `public` sudah ter-upload
3. Cek case-sensitive: nama file harus SAMA PERSIS
   - Linux server case-sensitive: `Logo.png` ≠ `logo.png`

#### Problem 3: Error 404 Saat Refresh atau Buka Link Langsung
**Solusi:**
- File `.htaccess` belum dibuat atau salah konfigurasi
- Buat file `.htaccess` dengan kode di atas

#### Problem 4: CSS Tidak Load / Tampilan Berantakan
**Solusi:**
1. Clear cache browser (Ctrl + Shift + Delete)
2. Coba akses dengan browser incognito/private
3. Pastikan folder `assets` dengan file CSS dan JS ter-upload

#### Problem 5: Animasi Scrolling Tidak Jalan
**Solusi:**
- Pastikan file JavaScript di folder `assets` ter-upload
- Cek browser console untuk error
- Clear cache dan reload

---

## 📊 Struktur File Final di Hosting

Struktur file di `public_html` harus seperti ini:

```
public_html/
├── .htaccess                    # ← File konfigurasi (WAJIB)
├── index.html                   # ← File utama
├── attached_assets/             # ← Foto pelanggan
│   ├── IMG-20251008-WA0002_1759894910497.jpg
│   ├── IMG-20251008-WA0003_1759894910497.jpg
│   ├── IMG-20251008-WA0004_1759894910498.jpg
│   └── ... (semua foto pelanggan)
├── assets/                      # ← File CSS, JS, gambar optimized
│   ├── index-abc123.css
│   ├── index-xyz789.js
│   ├── hero-bg-def456.jpg
│   └── ... (file lainnya)
└── public/                      # ← Logo dan gambar lain (jika ada)
    ├── bantaeng.png
    ├── bpjs.png
    └── ...
```

---

## 🚀 Tips Optimasi Setelah Upload

### 1. Enable HTTPS/SSL
- Di cPanel > **SSL/TLS Status**
- Install SSL gratis (Let's Encrypt)
- Force HTTPS di `.htaccess`:

```apache
# Tambahkan di .htaccess PALING ATAS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### 2. Enable Gzip Compression
Sudah termasuk di `.htaccess` di atas.

### 3. Setup Custom Domain
1. cPanel > **Addon Domains** atau **Parked Domains**
2. Tambahkan domain/subdomain
3. Arahkan ke folder yang sama

---

## 📝 Catatan Penting

### Dependencies Yang Sudah Terinstall di Build:

Semua library berikut sudah ter-bundle dalam file `dist/assets/*.js`:
- ✅ React & React DOM
- ✅ React Router
- ✅ Radix UI Components
- ✅ Tailwind CSS
- ✅ Lucide Icons
- ✅ Embla Carousel
- ✅ React Hook Form
- ✅ Zod validation
- ✅ Dan semua dependencies lainnya

**Anda TIDAK perlu install apapun di server hosting!**
File build sudah self-contained dan siap pakai.

### File Yang TIDAK Perlu Di-Upload:

❌ **JANGAN upload folder ini:**
- `node_modules/` - Sudah dibundle
- `src/` - Source code tidak dibutuhkan
- `.git/` - Version control tidak perlu
- `package.json` - Tidak dibutuhkan di server
- `package-lock.json` - Tidak dibutuhkan di server
- `vite.config.ts` - Config development saja
- `tsconfig.json` - TypeScript config tidak perlu

✅ **HANYA upload folder `dist` isinya saja!**

---

## 🆘 Butuh Bantuan?

Jika mengalami kesulitan:

1. **Cek Console Browser**
   - Tekan `F12` di browser
   - Lihat tab **Console** untuk error
   - Lihat tab **Network** untuk file yang gagal load

2. **Cek Error Log di cPanel**
   - cPanel > **Error Log**
   - Lihat error terakhir

3. **Hubungi Support Hosting**
   - Berikan info: "Website React tidak load"
   - Tanyakan apakah `mod_rewrite` aktif

---

## ✅ Checklist Final

Sebelum selesai, pastikan:

- [x] Folder `dist` sudah di-build (`npm run build`)
- [x] Semua isi `dist` sudah di-upload ke `public_html`
- [x] File `.htaccess` sudah dibuat dengan konfigurasi benar
- [x] Website bisa diakses di browser
- [x] Semua halaman berfungsi (navigasi, scroll, animasi)
- [x] Gambar dan foto pelanggan muncul
- [x] Tidak ada error di browser console
- [x] Website bisa di-refresh tanpa error 404
- [x] SSL/HTTPS sudah aktif (opsional tapi disarankan)

---

## 🎉 Selamat!

Website Konveksi Industry Anda sudah online dan bisa diakses publik!

**URL Website:** `https://domainanda.com`

Untuk update konten di masa depan:
1. Edit di local (Replit atau komputer)
2. Build ulang: `npm run build`
3. Upload folder `dist` yang baru
4. Selesai!

---

**Dibuat untuk:** Konveksi Industry  
**Tanggal:** 8 Oktober 2025  
**Platform:** React + Vite + Tailwind CSS  
**Hosting:** cPanel/Shared Hosting  

---

> 💡 **Pro Tip:** Simpan tutorial ini untuk referensi di masa depan saat ingin update website!
