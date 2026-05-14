# ─── Stage 1: Build ───────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

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
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/epub2 ./node_modules/epub2

EXPOSE 4000
CMD ["node", "dist/main"]