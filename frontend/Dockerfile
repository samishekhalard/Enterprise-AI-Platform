# ==============================================================================
# EMS Frontend (Angular 21) - Multi-stage Docker Build
# Build context: frontend/
# ==============================================================================

# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency files first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build:prod

# Runtime stage - serve with nginx
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx content
RUN rm -rf ./*

# Angular output path for @angular/build:application
COPY --from=builder /app/dist/frontend/browser/ .

# nginx SPA + API proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Run as non-root
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 4200

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:4200/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
