# ============================================
# Stage 1: Install dependencies & Build frontend
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy all source code
COPY . .

# Build frontend (Vite)
RUN npm run build

# ============================================
# Stage 2: Production image
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy server source code
COPY server ./server

# Copy config files needed at runtime
COPY drizzle.config.ts ./
COPY drizzle ./drizzle

# Copy public assets
COPY public ./public

# Expose backend port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npx", "tsx", "server/src/index.ts"]
