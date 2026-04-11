# EMSIST

**Enterprise Management System for Integrated Service Transformation**

A multi-tenant on primise cloud Enterprise Management System

## Features

- **Zero-Redirect Auth** — Native UX via BFF pattern (users never see Keycloak)
- **Multi-Tenant** — Tenant isolation with per-tenant configuration
- **AI Services** — Multi-provider support (OpenAI, Anthropic, Gemini, Ollama)
- **BPMN Workflows** — Tenant-scoped process objects and orchestration
- **Enterprise Ready** — Licensing, audit trails, notifications

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Java 23, Spring Boot 3.4.1 |
| Frontend | Angular 21, PrimeNG 21, Signals |
| Graph DB | Neo4j 5.x (auth-facade only) |
| Relational | PostgreSQL 16 (all other services) |
| Identity | Keycloak 24 |
| Cache | Valkey 8 |
| Messaging | Kafka (Confluent 7.5) |

## Quick Start

**Prerequisites:** Docker 24+, Docker Compose v2

```bash
# 1) Clone
git clone https://github.com/thinkplus-git/EMSIST.git
cd EMSIST

# 2) Create runtime environment file
cp .env.example .env
# Edit .env and replace all CHANGE_ME values

# 3) Start full stack (staging profile / standard ports)
docker compose --env-file .env -f docker-compose.staging.yml up --build -d
```

Access: `http://localhost:4200`

### Development Environment (shifted ports to avoid conflicts)

```bash
cp .env.example .env.dev
./scripts/dev-up.sh
```

Access: `http://localhost:24200`

The development topology is split into four stacks:

1. `docker-compose.dev-postgres.yml` - PostgreSQL, Valkey, Kafka, backup-cron
2. `docker-compose.dev-neo4j.yml` - Neo4j
3. `docker-compose.dev-keycloak.yml` - Keycloak and `keycloak-init`
4. `docker-compose.dev-services.yml` - Eureka, backend services, MailHog, frontend

Use `./scripts/dev-up.sh` for the correct startup order. If you need to run the
stacks manually, use:

```bash
docker compose -f docker-compose.dev-postgres.yml --env-file .env.dev up -d
docker compose -f docker-compose.dev-neo4j.yml --env-file .env.dev up -d
docker compose -f docker-compose.dev-keycloak.yml --env-file .env.dev up -d

# wait for keycloak-init to exit successfully
docker compose -f docker-compose.dev-keycloak.yml ps keycloak-init

docker compose -f docker-compose.dev-services.yml --env-file .env.dev up --build -d
```

`docker-compose.dev.yml` remains as the compatibility compose entry point for
combined `ps`, `logs`, and `config` commands. Use `./scripts/dev-up.sh` for
ordered startup and shutdown.

### Port Mapping

| Service | Dev Port | Staging Port |
|---------|----------|--------------|
| Frontend | 24200 | 4200 |
| Eureka | 28761 | 8761 |
| API Gateway | 28080 | 8080 |
| Auth Facade | 28081 | 8081 |
| Tenant Service | 28082 | 8082 |
| User Service | 28083 | 8083 |
| License Service | 28085 | 8085 |
| Notification Service | 28086 | 8086 |
| Audit Service | 28087 | 8087 |
| AI Service | 28088 | 8088 |
| Process Service | 28089 | 8089 |
| PostgreSQL | 25432 | 5432 |
| Neo4j (HTTP) | 27474 | 7474 |
| Neo4j (Bolt) | 27687 | 7687 |
| Valkey | 26379 | 6379 |
| Keycloak | 28180 | 8180 |
| MailHog (UI) | 28025 | 8025 |

### Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| Keycloak Admin | admin | (set in .env file) |
| Superadmin | superadmin | (set in .env file) |
| PostgreSQL | postgres | (set in .env file) |
| Neo4j | neo4j | (set in .env file) |

## Project Structure

```
EMSIST/
├── backend/              # Spring Boot microservices
│   ├── api-gateway/      # API routing (8080)
│   ├── auth-facade/      # Authentication BFF (8081)
│   ├── tenant-service/   # Tenant management (8082)
│   ├── user-service/     # User profiles (8083)
│   ├── license-service/  # Licensing (8085)
│   ├── notification-service/ # Notifications (8086)
│   ├── audit-service/    # Audit logging (8087)
│   ├── ai-service/       # AI/ML services (8088)
│   ├── process-service/  # BPMN workflows (8089)
│   └── common/           # Shared DTOs and utilities
├── frontend/             # Angular 21 application
├── infrastructure/       # Docker, Keycloak init
│   ├── docker/           # init-db.sql, prometheus
│   └── keycloak/         # Realm bootstrap script
├── docs/                 # Architecture documentation
│   ├── arc42/            # Architecture (12 sections)
│   ├── adr/              # Decision records
│   ├── lld/              # Low-level designs
│   ├── data-models/      # Graph and relational schemas
│   └── governance/       # Agent principles and frameworks
├── scripts/              # Dev and staging startup scripts
├── .github/workflows/    # CI pipelines
└── .githooks/            # Pre-commit enforcement
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/arc42/) | arc42 documentation (12 sections) |
| [ADRs](docs/adr/) | Architecture Decision Records |
| [Data Models](docs/data-models/) | Graph and relational schemas |
| [Runbooks](runbooks/) | Operations and security playbooks |
| [Governance](docs/governance/) | Agent principles and frameworks |

## Services

| Service | Port | Database | Description |
|---------|------|----------|-------------|
| api-gateway | 8080 | — | API routing and CORS |
| auth-facade | 8081 | Neo4j + Valkey | Authentication BFF |
| tenant-service | 8082 | PostgreSQL | Tenant management |
| user-service | 8083 | PostgreSQL | User profiles |
| license-service | 8085 | PostgreSQL | On-premise licensing |
| notification-service | 8086 | PostgreSQL | Notifications |
| audit-service | 8087 | PostgreSQL | Audit logging |
| ai-service | 8088 | PostgreSQL + pgvector | AI/ML services |
| process-service | 8089 | PostgreSQL | BPMN workflows |

## Git Hooks

After cloning, activate the pre-commit hook:

```bash
git config core.hooksPath .githooks
```

## Contributing

1. Read [Architecture Overview](docs/arc42/01-introduction-goals.md)
2. Check [ADRs](docs/adr/) for design decisions
3. Follow standards in [Governance Framework](docs/governance/GOVERNANCE-FRAMEWORK.md)

## License

Proprietary — All rights reserved
