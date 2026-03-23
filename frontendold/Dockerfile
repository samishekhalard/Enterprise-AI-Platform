# ==============================================================================
# EMS Frontend (Angular 21) - Multi-stage Docker Build
# Build context: frontend/
# ==============================================================================

# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency files first (layer caching)
COPY package.json package-lock.json .npmrc ./

# Install dependencies (legacy-peer-deps required per .npmrc)
RUN npm ci

# Copy source code
COPY . .

# Build the Angular application for staging (uses environment.staging.ts)
RUN npx ng build --configuration staging

# Runtime stage - serve with nginx
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx content
RUN rm -rf ./*

# Copy built Angular app from builder
# Angular 21 with @angular/build:application outputs to dist/bitx-prodct/browser/
COPY --from=builder /app/dist/bitx-prodct/browser/ .

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add non-root user for security
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

# Expose port
EXPOSE 4200

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget -q --spider http://localhost:4200/ || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
