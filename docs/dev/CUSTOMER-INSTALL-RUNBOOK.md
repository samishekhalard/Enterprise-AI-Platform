# EMSIST Customer Install Runbook

## 1. Purpose

Install EMSIST as an out-of-the-box deployable package with service discovery enabled by default.

This baseline assumes:

- `service-registry (eureka)` is a required runtime component.
- backend services and API gateway register/discover through Eureka.
- startup ordering is health-gated (`depends_on: condition: service_healthy`) for Eureka.

## 2. Prerequisites

- Docker Engine 24+
- Docker Compose v2+
- Minimum host sizing:
  - CPU: 8 vCPU
  - RAM: 16 GB
  - Disk: 80 GB SSD

## 3. Environment Files

Populate environment files before installation:

- Development: `.env.dev`
- Staging/customer-preprod: `.env.staging`

Required secrets at minimum:

- `SVC_TENANT_PASSWORD`
- `SVC_USER_PASSWORD`
- `SVC_LICENSE_PASSWORD`
- `SVC_NOTIFICATION_PASSWORD`
- `SVC_AUDIT_PASSWORD`
- `SVC_AI_PASSWORD`
- `KC_DB_PASSWORD`
- `KEYCLOAK_ADMIN_PASSWORD`
- `JASYPT_PASSWORD`

## 4. Install (Split-Tier Recommended)

Run from project root.

### 4.1 Development

```bash
docker compose -f docker-compose.dev-data.yml --env-file .env.dev up -d
docker compose -f docker-compose.dev-app.yml --env-file .env.dev up --build -d
```

### 4.2 Staging

```bash
docker compose -f docker-compose.staging-data.yml --env-file .env.staging up -d
docker compose -f docker-compose.staging-app.yml --env-file .env.staging up --build -d
```

## 5. Alternative (Single Wrapper)

### 5.1 Development

```bash
docker compose -f docker-compose.dev.yml --env-file .env.dev up --build -d
```

### 5.2 Staging

```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging up --build -d
```

## 6. Post-Install Health Verification

### 6.1 Core container status

```bash
docker compose -f docker-compose.dev-app.yml --env-file .env.dev ps
```

Expected key services include:

- `eureka`
- `api-gateway`
- `auth-facade`
- `tenant-service`
- `user-service`
- `license-service`
- `notification-service`
- `audit-service`
- `ai-service`
- `definition-service`

### 6.2 Registry health

Development:

```bash
curl -fsS http://localhost:28761/actuator/health
```

Staging:

```bash
curl -fsS http://localhost:8761/actuator/health
```

### 6.3 Registry discovery snapshot

Development:

```bash
curl -fsS http://localhost:28761/eureka/apps
```

Staging:

```bash
curl -fsS http://localhost:8761/eureka/apps
```

Confirm registered applications include gateway and active backend services.

### 6.4 Gateway health

Development:

```bash
curl -fsS http://localhost:28080/actuator/health
```

Staging:

```bash
curl -fsS http://localhost:8080/actuator/health
```

## 7. Shutdown

### 7.1 Stop app tier only

```bash
docker compose -f docker-compose.dev-app.yml --env-file .env.dev down
```

### 7.2 Stop data tier

```bash
docker compose -f docker-compose.dev-data.yml --env-file .env.dev down
```

Do not use `-v` in normal operations unless intentional data reset is required.

## 8. Operational Notes

- Eureka is not optional in this runtime baseline.
- If Eureka is unhealthy, gateway/backend startup is intentionally blocked by health-gated dependencies.
- If passwords are missing in `.env.*`, Compose defaults blank values and runtime behavior is unsafe; treat warnings as install blockers.
