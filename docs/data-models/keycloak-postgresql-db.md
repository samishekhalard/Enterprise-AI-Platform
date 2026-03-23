# Keycloak PostgreSQL Database Schema

## Status

- **Authority level:** Canonical database schema for Keycloak internal persistence
- **Database:** `keycloak_db`
- **Engine:** PostgreSQL 16+
- **Ownership:** Keycloak platform operations
- **Rule:** EMS services must not write directly to this schema

## Purpose

This file documents the Keycloak-internal relational model used for identity federation and token/session persistence.

- This database is Keycloak-managed.
- EMS application domain data is not persisted here.
- EMS application data is documented in [neo4j-ems-db.md](./neo4j-ems-db.md).

## Topology

```mermaid
flowchart TB
    subgraph keycloak["KEYCLOAK DATABASE (keycloak_db)"]
        direction TB
        Note["Managed by Keycloak 24.x<br/>Do not modify directly from EMS services"]

        subgraph realms["REALMS"]
            R1["master"]
            R2["ems"]
            R3["tenant-{slug}"]
        end

        subgraph tables["KEY TABLES"]
            T1["realm"]
            T2["user_entity"]
            T3["credential"]
            T4["user_attribute"]
            T5["user_role_mapping"]
            T6["keycloak_role"]
            T7["client"]
            T8["identity_provider"]
            T9["user_session"]
        end
    end
```

## ERD (Mermaid)

```mermaid
erDiagram
    REALM ||--o{ USER_ENTITY : contains
    USER_ENTITY ||--o{ CREDENTIAL : has_credential
    USER_ENTITY ||--o{ USER_ATTRIBUTE : has_attribute
    USER_ENTITY ||--o{ USER_SESSION : has_session
    REALM ||--o{ KEYCLOAK_ROLE : defines
    REALM ||--o{ CLIENT : defines
    REALM ||--o{ IDENTITY_PROVIDER : configures
    USER_ENTITY ||--o{ USER_ROLE_MAPPING : has_mapping
    KEYCLOAK_ROLE ||--o{ USER_ROLE_MAPPING : mapped_to

    REALM {
        string id PK
        string name UK
        boolean enabled
    }
    USER_ENTITY {
        string id PK
        string realm_id FK
        string username
        string email
        boolean enabled
    }
    CREDENTIAL {
        string id PK
        string user_id FK
        string type
        string secret_data
    }
    USER_ATTRIBUTE {
        string id PK
        string user_id FK
        string name
        string value
    }
    KEYCLOAK_ROLE {
        string id PK
        string realm_id FK
        string name
    }
    CLIENT {
        string id PK
        string realm_id FK
        string client_id UK
        string protocol
    }
    IDENTITY_PROVIDER {
        string internal_id PK
        string realm_id FK
        string provider_alias UK
        string provider_id
    }
    USER_ROLE_MAPPING {
        string user_id FK
        string role_id FK
    }
    USER_SESSION {
        string id PK
        string user_id FK
        string realm_id FK
    }
```

## Integration Contract with EMS

EMS integrations are API-based through Keycloak and auth-facade:

- Keycloak Admin REST API
- Token endpoint
- UserInfo endpoint
- Event-driven sync into EMS Neo4j user graph

Direct SQL reads/writes from EMS services are not part of the standard.

## Operational Rules

- Backups and restore procedures are managed as Keycloak platform operations.
- Schema evolution follows Keycloak version upgrades, not EMS migration scripts.
- Access is restricted to Keycloak runtime and approved platform administrators.

---

**Last Updated:** 2026-02-27
