# Database Migrations Guide

## Golden Rules

### 1. NEVER Modify Applied Migrations

```
❌ WRONG: Edit V1__create_tables.sql after it's been applied
✅ RIGHT: Create V4__add_new_column.sql for changes
```

Once a migration has been applied to ANY environment (including your local dev), treat it as **immutable**. Create a new migration file for any changes.

### 2. Version Naming Convention

```
V{number}__{description}.sql

Examples:
V1__create_tenant_tables.sql
V2__seed_default_tenant.sql
V3__add_user_preferences_column.sql
```

- Use sequential numbers (V1, V2, V3...)
- Double underscore between version and description
- Lowercase with underscores for description

### 3. Each Service Has Its Own History Table

| Service | Flyway Table |
|---------|--------------|
| tenant-service | `flyway_schema_history` |
| user-service | `flyway_schema_history_user` |
| license-service | `flyway_schema_history_license` |
| audit-service | `flyway_schema_history_audit` |
| notification-service | `flyway_schema_history_notification` |

This prevents migration conflicts between services sharing the same database.

---

## Common Issues & Solutions

### Issue: "Migration checksum mismatch"

**Cause**: Migration file was modified after being applied.

**Dev Solution**:
```bash
# Option 1: Repair checksums (keeps data)
mvn flyway:repair -pl <service-name>

# Option 2: Clean and re-migrate (loses data!)
mvn flyway:clean flyway:migrate -pl <service-name>
```

**Production Solution**: NEVER repair in production. Investigate why the file changed.

### Issue: "Table already exists"

**Cause**: Migration was partially applied or table was created manually.

**Solution**:
```sql
-- Add to your migration:
CREATE TABLE IF NOT EXISTS table_name (...);

-- Or for dropping:
DROP TABLE IF EXISTS table_name CASCADE;
```

### Issue: "Migrations applied but tables missing"

**Cause**: Flyway history is out of sync with actual database state.

**Solution**: The `FlywayValidationConfig` class now detects this automatically.

In development, set in `application.yml`:
```yaml
spring:
  flyway:
    repair-on-mismatch: true
```

---

## Best Practices

### Making Schema Changes

```sql
-- V5__add_phone_to_users.sql

-- 1. Add column as nullable first
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- 2. Populate with default if needed
UPDATE users SET phone = 'N/A' WHERE phone IS NULL;

-- 3. Add NOT NULL constraint if required (separate migration recommended)
-- ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
```

### Writing Idempotent Migrations

```sql
-- GOOD: Idempotent - can run multiple times safely
CREATE TABLE IF NOT EXISTS my_table (...);
CREATE INDEX IF NOT EXISTS idx_name ON my_table(column);

-- BAD: Will fail on second run
CREATE TABLE my_table (...);
CREATE INDEX idx_name ON my_table(column);
```

### Seed Data Migrations

```sql
-- Use ON CONFLICT for seed data
INSERT INTO config (key, value) VALUES ('app.name', 'EMS')
ON CONFLICT (key) DO NOTHING;

-- Or UPDATE if it should change
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

---

## Commands Reference

```bash
# Run migrations
mvn spring-boot:run -pl tenant-service

# Check migration status
mvn flyway:info -pl tenant-service

# Repair checksums (dev only)
mvn flyway:repair -pl tenant-service

# Clean database (dev only - DELETES ALL DATA)
mvn flyway:clean -pl tenant-service

# Validate migrations without running
mvn flyway:validate -pl tenant-service
```

---

## Emergency Recovery

If you get into a bad state in development:

```bash
# Nuclear option: Reset everything for a service
docker exec ems-postgres psql -U postgres -d master_db -c \
  "DELETE FROM flyway_schema_history WHERE 1=1"

# Then restart the service - migrations will re-run
mvn spring-boot:run -pl tenant-service
```

**WARNING**: Never do this in production!
