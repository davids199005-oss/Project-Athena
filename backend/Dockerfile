# ─── Stage 1: Build ───────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

# patches needed BEFORE npm ci — postinstall runs patch-package
COPY ./backend/package*.json ./
COPY ./backend/patches ./patches
RUN npm ci

COPY ./backend .
RUN npm run build

# ─── Stage 2: Production ──────────────────────────────────
FROM node:24-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/patches ./patches
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/main"]