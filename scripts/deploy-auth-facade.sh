#!/bin/bash

# --- Configuration ---
PROJECT_NAME="auth-facade-service"
NEO4J_URL="bolt://localhost:7687"
NEO4J_USER="neo4j"
NEO4J_PASS="password123"

echo "🚀 Starting E2E Auth Facade Deployment..."

# 1. Start Infrastructure (Neo4j, Keycloak, Mailpit)
echo "📦 Spinning up Docker containers..."
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# 2. Wait for Neo4j to be healthy
echo "⏳ Waiting for Neo4j to initialize..."
until docker exec ems-neo4j cypher-shell -u $NEO4J_USER -p $NEO4J_PASS "RETURN 1" > /dev/null 2>&1; do
  sleep 2
done
echo "✅ Neo4j is ready."

# 3. Initialize Neo4j Schema (Constraints & Seed Data)
echo "🌿 Initializing Identity Graph Schema..."
docker exec -i ems-neo4j cypher-shell -u $NEO4J_USER -p $NEO4J_PASS <<EOF_CYPHER
CREATE CONSTRAINT tenant_id IF NOT EXISTS FOR (t:Tenant) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT provider_name IF NOT EXISTS FOR (p:Provider) REQUIRE p.name IS UNIQUE;
CREATE CONSTRAINT role_name IF NOT EXISTS FOR (r:Role) REQUIRE r.name IS UNIQUE;
CREATE CONSTRAINT user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE;

// Create Protocol Templates
MERGE (oidc:Protocol {type: 'OIDC', version: '1.0'})
MERGE (saml:Protocol {type: 'SAML', version: '2.0'})
MERGE (oauth:Protocol {type: 'OAUTH2', version: '2.0'})
MERGE (ldap:Protocol {type: 'LDAP', version: '3'});

// Create Provider Templates
MERGE (kc:Provider {name: 'KEYCLOAK', vendor: 'Red Hat', displayName: 'Keycloak'})
MERGE (auth0:Provider {name: 'AUTH0', vendor: 'Okta', displayName: 'Auth0'})
MERGE (okta:Provider {name: 'OKTA', vendor: 'Okta', displayName: 'Okta'})
MERGE (azure:Provider {name: 'AZURE_AD', vendor: 'Microsoft', displayName: 'Azure AD'})
MERGE (uae:Provider {name: 'UAE_PASS', vendor: 'UAE Government', displayName: 'UAE Pass'})
MERGE (ibm:Provider {name: 'IBM_IAM', vendor: 'IBM', displayName: 'IBM IAM'});

// Link Providers to Protocols
MATCH (kc:Provider {name: 'KEYCLOAK'}), (oidc:Protocol {type: 'OIDC'})
MERGE (kc)-[:SUPPORTS]->(oidc);

MATCH (kc:Provider {name: 'KEYCLOAK'}), (saml:Protocol {type: 'SAML'})
MERGE (kc)-[:SUPPORTS]->(saml);

MATCH (auth0:Provider {name: 'AUTH0'}), (oidc:Protocol {type: 'OIDC'})
MERGE (auth0)-[:SUPPORTS]->(oidc);

MATCH (uae:Provider {name: 'UAE_PASS'}), (oauth:Protocol {type: 'OAUTH2'})
MERGE (uae)-[:SUPPORTS]->(oauth);

MATCH (ibm:Provider {name: 'IBM_IAM'}), (saml:Protocol {type: 'SAML'})
MERGE (ibm)-[:SUPPORTS]->(saml);

// Seed RBAC Role Hierarchy
MERGE (superAdmin:Role {name: 'SUPER_ADMIN'})
MERGE (admin:Role {name: 'ADMIN'})
MERGE (manager:Role {name: 'MANAGER'})
MERGE (user:Role {name: 'USER'})
MERGE (superAdmin)-[:INHERITS_FROM]->(admin)
MERGE (admin)-[:INHERITS_FROM]->(manager)
MERGE (manager)-[:INHERITS_FROM]->(user);

// Seed Initial Master Tenant
MERGE (t:Tenant {id: 'master', domain: 'platform.ems.com', name: 'Master Tenant'});
EOF_CYPHER
echo "✅ Neo4j schema initialized."

# 4. Wait for Keycloak to be healthy
echo "⏳ Waiting for Keycloak to initialize..."
until curl -s http://localhost:8180/health/ready | grep -q '"status":"UP"'; do
  sleep 5
done
echo "✅ Keycloak is ready."

# 5. Build Spring Boot Backend
echo "🏗️ Building Spring Boot Services..."
cd backend
./mvnw clean package -DskipTests -pl auth-facade -am
cd ..

# 6. Build Angular Frontend (optional)
if [ -d "frontend" ]; then
  echo "🌐 Building Angular Frontend..."
  cd frontend && npm install && npm run build && cd ..
fi

echo "---------------------------------------------------"
echo "✅ DEPLOYMENT COMPLETE"
echo "🖥️  Keycloak: http://localhost:8180 (admin/admin)"
echo "📊 Neo4j Browser: http://localhost:7474 (neo4j/password123)"
echo "📧 Mailpit: http://localhost:8025"
echo "🔧 API Gateway: http://localhost:8080"
echo "🔐 Auth Facade: http://localhost:8081"
echo "---------------------------------------------------"
