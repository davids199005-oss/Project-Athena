# ─── Stage 1: Build ───────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

COPY ./frontend/package*.json ./
RUN npm ci

COPY ./frontend .
RUN npm run build -- --configuration production

# ─── Stage 2: Nginx static ────────────────────────────────
FROM nginx:1.27-alpine AS production

COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
COPY ./frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]