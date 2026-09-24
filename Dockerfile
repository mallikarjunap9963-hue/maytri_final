# ---------- STAGE 1: Build Vite SPA ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Backend public URL baked into the bundle (Dokploy Build Arg).
# Example: https://api.yourdomain.com (no trailing slash, no /api suffix)
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- STAGE 2: Serve with nginx ----------
FROM nginx:1.27-alpine AS runner

# wget for container healthcheck
RUN apk add --no-cache wget

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Vite output
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/healthz | grep -q OK || exit 1
