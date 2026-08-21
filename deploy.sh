#!/bin/bash
# ============================================
# 🚀 Deploy Script - Sekala Industry
# Domain: demokonveksi.astintech.id
# VPS: 76.13.23.178
# ============================================
# Jalankan script ini di VPS:
#   bash deploy.sh
# ============================================

set -e

# Konfigurasi
APP_DIR="/var/www/sekala-konveksi"
REPO_URL="https://github.com/Afastudio11/konveksidemoastin.git"
DOMAIN="demokonveksi.astintech.id"

echo "============================================"
echo "🚀 Deploying Sekala Industry"
echo "   Domain: $DOMAIN"
echo "============================================"
echo ""

# ============================================
# Step 1: Clone / Update repository
# ============================================
if [ -d "$APP_DIR" ]; then
    echo "📁 Folder sudah ada, updating..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "📥 Cloning repository..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

echo "✅ Repository ready"
echo ""

# ============================================
# Step 2: Buat file .env jika belum ada
# ============================================
if [ ! -f ".env" ]; then
    echo "📝 Membuat file .env..."
    
    # Generate random password dan secret
    DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
    JWT_SEC=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
    
    cat > .env << EOF
DB_PASSWORD=${DB_PASS}
JWT_SECRET=${JWT_SEC}
EOF
    
    echo "✅ .env created"
    echo "   DB_PASSWORD: $DB_PASS"
    echo "   JWT_SECRET: $JWT_SEC"
    echo ""
    echo "⚠️  SIMPAN PASSWORD DI ATAS! Tidak akan ditampilkan lagi."
    echo ""
else
    echo "✅ .env sudah ada, skip..."
fi

# ============================================
# Step 3: Deteksi Traefik network
# ============================================
echo "🔍 Mencari Traefik network..."

# Cek berbagai kemungkinan nama network
TRAEFIK_NETWORK=""
for net in "traefik-network" "traefik_default" "proxy" "traefik" "web"; do
    if docker network ls --format '{{.Name}}' | grep -q "^${net}$"; then
        TRAEFIK_NETWORK="$net"
        break
    fi
done

if [ -z "$TRAEFIK_NETWORK" ]; then
    echo "⚠️  Traefik network tidak ditemukan!"
    echo "   Membuat network 'traefik-network'..."
    docker network create traefik-network
    TRAEFIK_NETWORK="traefik-network"
fi

echo "✅ Menggunakan network: $TRAEFIK_NETWORK"

# Update docker-compose.yml jika network beda
if [ "$TRAEFIK_NETWORK" != "traefik-network" ]; then
    echo "📝 Menyesuaikan network di docker-compose.yml..."
    sed -i "s/traefik-network/${TRAEFIK_NETWORK}/g" docker-compose.yml
fi
echo ""

# ============================================
# Step 4: Build & Deploy
# ============================================
echo "🔨 Building & deploying containers..."
docker compose up -d --build

echo ""
echo "⏳ Menunggu database ready..."
sleep 10

# ============================================
# Step 5: Setup database (pertama kali)
# ============================================
echo "🗄️  Pushing database schema..."
docker compose exec -T app npx drizzle-kit push --force 2>/dev/null || {
    echo "⏳ Database belum ready, menunggu 15 detik lagi..."
    sleep 15
    docker compose exec -T app npx drizzle-kit push --force
}

echo ""
echo "🌱 Seeding initial data..."
docker compose exec -T app npx tsx server/src/seed.ts 2>/dev/null || echo "   (Seed script tidak ada atau sudah dijalankan)"

echo ""

# ============================================
# Step 6: Verifikasi
# ============================================
echo "============================================"
echo "✅ DEPLOYMENT SELESAI!"
echo "============================================"
echo ""
echo "📊 Status containers:"
docker compose ps
echo ""
echo "🌐 Website: https://$DOMAIN"
echo ""
echo "🔑 Login Admin:"
echo "   Email: superadmin@sekala.id"
echo "   Password: super123"
echo ""
echo "📝 Perintah berguna:"
echo "   Logs:     docker compose logs -f app"
echo "   Restart:  docker compose restart app"
echo "   Update:   git pull && docker compose up -d --build"
echo "   Backup:   docker compose exec db pg_dump -U postgres sekaladb > backup.sql"
echo ""
