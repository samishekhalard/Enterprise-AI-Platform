# 3. Context and Scope

## 3.1 Business Context

EMS provides multi-tenant enterprise platform capabilities to tenant admins and end users while integrating with identity, AI, and notification providers.

```mermaid
flowchart TB
    subgraph actors["External Actors"]
        TA["Tenant Admin"]
        EU["End User"]
        MU["Mobile User"]
    end

    subgraph ems["EMS Platform"]
        TM["Tenant Management"]
        UM["User Management"]
        AUTH["Authentication"]
        LIC["License Management"]
        AI["AI Services"]
        PROC["Process Management"]
    end

    subgraph ext["External Systems"]
        IDP["Identity Providers\nKeycloak default"]
        AIP["AI Providers"]
        NOTIF["Email/SMS Providers"]
    end

    TA --> ems
    EU --> ems
    MU --> ems

    ems --> IDP
    ems --> AIP
    ems --> NOTIF
```

### External Actors

| Actor | Responsibility |
|-------|----------------|
| Tenant Admin | Tenant setup, user governance, configuration |
| End User | Day-to-day business workflows |
| Mobile User | Mobile/PWA subset of platform workflows |

### External Systems

| System | Purpose | Protocol |
|--------|---------|----------|
| Keycloak | Default authentication and token issuance | OIDC / OAuth 2.0 |
| Auth0 / Okta / Azure AD | Optional provider integrations via auth abstraction | OIDC / OAuth 2.0 |
| OpenAI / Anthropic / Gemini / Ollama | AI inference and model services | HTTPS/REST |
| SMTP Provider | Email delivery | SMTP/TLS |
| SMS Gateway | SMS delivery | HTTPS/REST |

## 3.2 Technical Context

```mermaid
flowchart TB
    subgraph edge["Edge Layer"]
        CDN["CDN/WAF"]
        LB["Load Balancer"]
    end

    subgraph app["Application Layer"]
        FE["Frontend\n:4200"]
        GW["API Gateway\n:8080"]
        AF["auth-facade\n:8081"]
        TS["tenant-service\n:8082"]
        US["user-service\n:8083"]
        LS["license-service\n:8085"]
        NS["notification-service\n:8086"]
        AS["audit-service\n:8087"]
        AIS["ai-service\n:8088"]
        IDP["Identity Provider\n(default Keycloak)\n:8180"]
    end

    subgraph data["Data/Platform Layer"]
        NEO["Neo4j 5.12\n(RBAC graph\nauth-facade only)"]
        PG["PostgreSQL 16\n(Domain Services\n+ Keycloak)"]
        VK["Valkey"]
        KAFKA["Kafka"]
    end

    CDN --> LB
    LB --> FE
    LB --> GW
    LB --> IDP

    GW --> AF
    GW --> TS
    GW --> US
    GW --> LS
    GW --> NS
    GW --> AS
    GW --> AIS

    AF --> IDP

    AF --> NEO
    TS --> PG
    US --> PG
    LS --> PG
    NS --> PG
    AS --> PG
    AIS --> PG

    AF --> VK
    US --> VK
    LS --> VK
    NS --> VK
    AIS --> VK

    TS --> KAFKA
    US --> KAFKA
    LS --> KAFKA
    NS --> KAFKA
    AS --> KAFKA
    AIS --> KAFKA

    IDP --> PG
```

Runtime scope seal (2026-03-01):

- The application-layer diagram is intentionally limited to currently deployed/routed services.
- `product-service`, `process-service`, and `persona-service` are excluded because they are not gateway-routed and not part of current deployment topology.
- Product/process/persona capabilities are modeled as tenant-scoped object instances, not standalone services.

### Interface Matrix

| Interface | Type | Security |
|-----------|------|----------|
| Public API | HTTPS/REST | JWT bearer tokens |
| Identity Provider Endpoints | OIDC/OAuth 2.0 | Provider-specific credentials |
| AI Provider APIs | HTTPS/REST | API keys |
| Notification Providers | SMTP/HTTPS | Provider credentials |
| Internal Events | Kafka | Service identity + network controls |

---

**Previous Section:** [Constraints](./02-constraints.md)
**Next Section:** [Solution Strategy](./04-solution-strategy.md)
