-- Create additional databases for EMS
CREATE DATABASE keycloak_db;
CREATE DATABASE ems_audit_db;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE keycloak_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE ems_audit_db TO postgres;
