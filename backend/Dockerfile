# ==============================================================
# AGROMAYA Backend REST API Gateway Dockerfile
# Node.js + Express + Prisma ORM + TypeScript
# ==============================================================

FROM node:20-alpine

WORKDIR /app

# Install openssl for Prisma binary engines on Alpine, plus curl
RUN apk add --no-cache openssl curl libc6-compat

# Install package dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application source code
COPY . .

# Build TypeScript to production dist
RUN npm run build || true

# Expose API port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Push database schema, initialize seed data if clean, and run server
CMD ["sh", "-c", "npx prisma db push && (npx tsx src/seed.ts || true) && npx tsx src/server.ts"]
