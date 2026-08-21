# 📤 Tutorial Upload Website ke Hostinger via GitHub

## 🎯 Ringkasan Langkah
1. Push kode ke GitHub (dari Replit)
2. Koneksi GitHub ke Hostinger
3. Deploy otomatis dari GitHub

---

## 📝 LANGKAH 1: Push Kode ke GitHub

### A. Commit & Push dari Replit

Jalankan perintah ini di terminal Replit:

```bash
# 1. Add semua file
git add .

# 2. Commit dengan pesan
git commit -m "Ready for Hostinger deployment"

# 3. Push ke GitHub
git push origin main
```

**Atau jika branch-nya "master":**
```bash
git push origin master
```

---

## 🔗 LANGKAH 2: Setup GitHub di Hostinger

### A. Buka Panel Hostinger

1. Login ke **Hostinger** (hpanel.hostinger.com)
2. Pilih website: **sekalaindustry.com**
3. Klik menu **"Tingkat lanjut"** (Advanced)
4. Pilih **"GIT"**

### B. Koneksi ke Repository GitHub

Di halaman GIT Hostinger:

1. **Branch**: `main` (atau `master`)
2. **Clone URL**: `https://github.com/Afastudio11/stylish-konveksi-craft.git`
3. **Repository path**: `/public_html` 
4. Klik **"Setup"** atau **"Clone Repository"**

### C. Setup GitHub Authentication

Hostinger akan minta akses GitHub:

**Opsi 1: Personal Access Token (Recommended)**
1. Buka GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Pilih scope: `repo` (Full control of private repositories)
4. Copy token
5. Paste di Hostinger

**Opsi 2: SSH Key**
1. Hostinger akan generate SSH key
2. Copy public key dari Hostinger
3. Tambahkan ke GitHub → Settings → SSH and GPG keys → New SSH key

---

## ⚙️ LANGKAH 3: Setup Deployment Path

### A. Configure Deployment ke Folder Dist

Setelah repository ter-clone, Anda perlu setup agar file dari folder `dist/` yang di-deploy:

**Di Hostinger GIT Settings:**
1. Klik **"Actions after pull"** atau **"Post-deployment script"**
2. Tambahkan script ini:

```bash
# Copy file dari dist ke public_html
cp -r dist/* /home/u123456789/domains/sekalaindustry.com/public_html/
```

**ATAU lebih simple, set Repository path langsung ke:**
`/public_html` 

Dan setelah pull, jalankan:
```bash
# Pindah file dari dist ke root
mv dist/* .
```

### B. Alternatif: Manual Setup

Jika tidak ada opsi post-deployment script:

1. Clone ke folder custom: `/domains/sekalaindustry.com/git-repo`
2. Setelah clone selesai, akses via **SSH** atau **File Manager**
3. Copy manual file dari `/git-repo/dist/*` ke `/public_html/`

---

## 🚀 LANGKAH 4: Deploy & Test

### A. Deploy Pertama Kali

1. Setelah setup selesai, klik **"Pull"** di Hostinger GIT panel
2. Tunggu proses selesai
3. File akan ter-copy ke public_html

### B. Test Website

1. Buka browser
2. Akses: **https://sekalaindustry.com**
3. Website Anda seharusnya sudah live! 🎉

---

## 🔄 Update Website di Masa Depan

Setiap kali ada perubahan:

### 1. Build ulang project
```bash
bun run build
```

### 2. Push ke GitHub
```bash
git add .
git commit -m "Update website"
git push origin main
```

### 3. Pull di Hostinger
- Buka Hostinger GIT panel
- Klik tombol **"Pull"**
- Website otomatis terupdate!

**ATAU setup Auto-Deploy:**
- Di Hostinger GIT panel, aktifkan **"Auto deploy"**
- Setiap push ke GitHub, Hostinger otomatis pull & deploy

---

## 🛠️ Troubleshooting

### Problem: File tidak muncul di website

**Solusi:**
1. Pastikan file ada di folder `dist/`
2. Cek path deployment sudah benar
3. Pastikan file ter-copy ke `/public_html/`

### Problem: Website masih tampil halaman lama

**Solusi:**
1. Clear cache browser (Ctrl + Shift + R)
2. Cek di Hostinger → Cache Manager → Clear cache
3. Tunggu 1-2 menit untuk propagasi

### Problem: Error 404 di Hostinger

**Solusi:**
Tambahkan file `.htaccess` di public_html:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 📞 Butuh Bantuan?

- **GitHub Repository**: https://github.com/Afastudio11/stylish-konveksi-craft
- **Hostinger Support**: https://www.hostinger.co.id/bantuan
- **Domain**: sekalaindustry.com

---

## ✅ Checklist Deployment

- [ ] Build project: `bun run build`
- [ ] Push ke GitHub: `git push origin main`
- [ ] Setup GIT di Hostinger
- [ ] Clone repository
- [ ] Setup deployment path ke dist/
- [ ] Pull & Deploy
- [ ] Test website di browser
- [ ] Setup auto-deploy (opsional)

**Selamat! Website Anda sudah live! 🎊**
