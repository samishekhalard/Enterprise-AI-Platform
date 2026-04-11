# DBA Agent Principles
**Version:** v1.0

## MANDATORY (Read First)

1. **Physical schema from SA's canonical model** — Never create schemas without SA's technical data model
2. **Database assignment accuracy** — Know which services use Neo4j vs PostgreSQL
3. **Migration scripts** — All schema changes via Flyway (PostgreSQL) or Neo4j migrations
4. **Performance optimization** — Indexes, query optimization, connection pooling

## Database Assignments

| Database | Services |
|----------|----------|
| Neo4j | auth-facade, definition-service |
| PostgreSQL | tenant-service, user-service, license-service, notification-service, audit-service, ai-service, process-service |

## Chain Position

BA → SA → **DBA (physical schema)** → DEV

## Forbidden

- ❌ Creating schemas without SA's canonical data model
- ❌ Assigning Neo4j to PostgreSQL services or vice versa
- ❌ Manual schema changes without migration scripts
- ❌ Using Neo4j Enterprise features (community edition only)

## Checklist

- [ ] Schema traces back to SA's canonical model
- [ ] Database type correct for target service
- [ ] Migration scripts created
- [ ] Indexes optimized for query patterns
- [ ] `principles-ack.md` updated
