package com.ems.auth.service;

import com.ems.auth.config.AuthGraphPerTenantProperties;
import com.ems.auth.config.KeycloakConfig;
import com.ems.auth.domain.ProtocolType;
import com.ems.auth.domain.ProviderType;
import com.ems.auth.dto.internal.AuthTenantProvisioningResponse;
import com.ems.auth.graph.repository.AuthGraphRepository;
import com.ems.auth.tenant.TenantRoutingContext;
import com.ems.auth.tenant.TenantRoutingContextHolder;
import com.ems.auth.tenant.TenantRoutingResolver;
import com.ems.auth.util.RealmResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.representations.idm.ClientRepresentation;
import org.keycloak.representations.idm.RealmRepresentation;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.SessionConfig;
import org.neo4j.driver.TransactionContext;
import org.neo4j.driver.Values;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "auth.graph-per-tenant.enabled", havingValue = "true")
@Slf4j
public class AuthTenantProvisioningService {

    private static final String BOOTSTRAP_MARKER = "AUTH_BOOTSTRAP_V1";

    private final Driver neo4jDriver;
    private final ResourceLoader resourceLoader;
    private final TenantRoutingResolver tenantRoutingResolver;
    private final AuthGraphRepository authGraphRepository;
    private final EncryptionService encryptionService;
    private final KeycloakConfig keycloakConfig;
    private final AuthGraphPerTenantProperties graphPerTenantProperties;

    public AuthTenantProvisioningResponse provisionTenant(String tenantIdentifier) {
        if (!graphPerTenantProperties.isEnabled()) {
            throw new IllegalStateException("auth.graph-per-tenant.enabled must be true to provision tenant auth databases");
        }

        TenantRoutingContext context = tenantRoutingResolver.resolve(tenantIdentifier);
        boolean databaseCreated = ensureTenantDatabaseExists(context.authDbName());
        boolean bootstrapped = ensureBootstrapApplied(context.authDbName());
        boolean graphSeeded = seedTenantGraph(context);
        boolean realmProvisioned = ensureKeycloakRealmProvisioned(context);

        return new AuthTenantProvisioningResponse(
            context.tenantId(),
            context.slug(),
            context.authDbName(),
            RealmResolver.resolve(context.tenantIdValue()),
            databaseCreated || bootstrapped || graphSeeded || realmProvisioned
        );
    }

    private boolean ensureTenantDatabaseExists(String dbName) {
        validateDatabaseName(dbName);

        try (Session session = neo4jDriver.session(SessionConfig.forDatabase(graphPerTenantProperties.getSystemDatabase()))) {
            boolean exists = session.executeRead(tx -> databaseExists(tx, dbName));
            if (exists) {
                waitForDatabaseOnline(session, dbName);
                return false;
            }

            session.run("CREATE DATABASE " + quoteDatabaseName(dbName) + " IF NOT EXISTS").consume();
            waitForDatabaseOnline(session, dbName);
            log.info("Created tenant auth database {}", dbName);
            return true;
        }
    }

    private boolean ensureBootstrapApplied(String dbName) {
        try (Session session = neo4jDriver.session(SessionConfig.forDatabase(dbName))) {
            boolean applied = session.executeRead(tx -> tx.run(
                "MATCH (m:Migration {version: $version}) RETURN count(m) > 0 AS applied",
                Values.parameters("version", BOOTSTRAP_MARKER)
            ).single().get("applied").asBoolean());

            if (applied) {
                return false;
            }

            for (String statement : bootstrapStatements()) {
                session.executeWrite(tx -> {
                    tx.run(statement).consume();
                    return null;
                });
            }
            log.info("Applied auth bootstrap script to tenant database {}", dbName);
            return true;
        }
    }

    @Transactional
    protected boolean seedTenantGraph(TenantRoutingContext context) {
        return TenantRoutingContextHolder.withContext(context, () -> {
            boolean created = false;

            authGraphRepository.createTenant(buildTenantProps(context));
            authGraphRepository.ensureProvider(ProviderType.KEYCLOAK.name(), Map.of(
                "vendor", "Keycloak",
                "displayName", "Keycloak"
            ));
            authGraphRepository.linkProviderToProtocol(ProviderType.KEYCLOAK.name(), ProtocolType.OIDC.name());

            if (!authGraphRepository.providerExistsForTenant(context.tenantIdValue(), ProviderType.KEYCLOAK.name())) {
                authGraphRepository.createProviderConfigWithoutReturn(
                    context.tenantIdValue(),
                    ProviderType.KEYCLOAK.name(),
                    buildKeycloakConfigProps(context)
                );
                created = true;
            }

            return created;
        });
    }

    private boolean ensureKeycloakRealmProvisioned(TenantRoutingContext context) {
        String realmName = RealmResolver.resolve(context.tenantIdValue());
        if (keycloakConfig.getMasterRealm().equals(realmName)) {
            return false;
        }

        try (Keycloak keycloak = adminClient()) {
            boolean created = false;

            if (!realmExists(keycloak, realmName)) {
                RealmRepresentation realm = new RealmRepresentation();
                realm.setRealm(realmName);
                realm.setDisplayName(context.slug());
                realm.setEnabled(true);
                keycloak.realms().create(realm);
                created = true;
                log.info("Created Keycloak realm {}", realmName);
            }

            RealmResource realmResource = keycloak.realm(realmName);
            if (ensureRealmClient(realmResource)) {
                created = true;
            }

            return created;
        }
    }

    private boolean ensureRealmClient(RealmResource realmResource) {
        List<ClientRepresentation> clients = realmResource.clients().findByClientId(keycloakConfig.getClient().getClientId());
        if (!clients.isEmpty()) {
            return false;
        }

        ClientRepresentation client = new ClientRepresentation();
        client.setClientId(keycloakConfig.getClient().getClientId());
        client.setName("EMS Auth Facade");
        client.setProtocol("openid-connect");
        client.setEnabled(true);
        client.setPublicClient(false);
        client.setDirectAccessGrantsEnabled(true);
        client.setStandardFlowEnabled(false);
        client.setServiceAccountsEnabled(true);
        if (keycloakConfig.getClient().getClientSecret() != null && !keycloakConfig.getClient().getClientSecret().isBlank()) {
            client.setSecret(keycloakConfig.getClient().getClientSecret());
        }
        realmResource.clients().create(client).close();
        log.info("Created Keycloak client {} in realm {}", keycloakConfig.getClient().getClientId(), realmResource.toRepresentation().getRealm());
        return true;
    }

    private boolean realmExists(Keycloak keycloak, String realmName) {
        try {
            keycloak.realm(realmName).toRepresentation();
            return true;
        } catch (jakarta.ws.rs.NotFoundException ex) {
            return false;
        }
    }

    private Keycloak adminClient() {
        return KeycloakBuilder.builder()
            .serverUrl(keycloakConfig.getServerUrl())
            .realm(keycloakConfig.getMasterRealm())
            .clientId(keycloakConfig.getAdmin().getClientId())
            .username(keycloakConfig.getAdmin().getUsername())
            .password(keycloakConfig.getAdmin().getPassword())
            .build();
    }

    private boolean databaseExists(TransactionContext tx, String dbName) {
        Result result = tx.run(
            "SHOW DATABASES YIELD name WHERE name = $name RETURN count(name) > 0 AS exists",
            Values.parameters("name", dbName)
        );
        return result.single().get("exists").asBoolean();
    }

    private void waitForDatabaseOnline(Session systemSession, String dbName) {
        Instant deadline = Instant.now().plus(Duration.ofSeconds(15));
        while (Instant.now().isBefore(deadline)) {
            String status = systemSession.executeRead(tx -> tx.run(
                "SHOW DATABASES YIELD name, currentStatus WHERE name = $name RETURN currentStatus",
                Values.parameters("name", dbName)
            ).single().get("currentStatus").asString());

            if ("online".equalsIgnoreCase(status)) {
                return;
            }

            try {
                Thread.sleep(250L);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Interrupted while waiting for tenant database to become online", ex);
            }
        }

        throw new IllegalStateException("Timed out waiting for tenant auth database to become online: " + dbName);
    }

    private List<String> bootstrapStatements() {
        Resource resource = resourceLoader.getResource("classpath:neo4j/auth-tenant-bootstrap.cypher");
        try {
            String script = resource.getContentAsString(StandardCharsets.UTF_8);
            List<String> statements = new ArrayList<>();
            for (String rawStatement : script.split(";")) {
                String statement = rawStatement.trim();
                if (!statement.isBlank() && !statement.startsWith("//")) {
                    statements.add(statement);
                }
            }
            return statements;
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load auth tenant bootstrap script", ex);
        }
    }

    private Map<String, Object> buildTenantProps(TenantRoutingContext context) {
        Instant now = Instant.now();
        Map<String, Object> props = new HashMap<>();
        props.put("id", context.tenantIdValue());
        props.put("slug", context.slug());
        props.put("name", context.slug());
        props.put("domain", context.slug());
        props.put("active", true);
        props.put("createdAt", now);
        props.put("updatedAt", now);
        return props;
    }

    private Map<String, Object> buildKeycloakConfigProps(TenantRoutingContext context) {
        Instant now = Instant.now();
        String realm = RealmResolver.resolve(context.tenantIdValue());
        String realmBase = keycloakConfig.getServerUrl() + "/realms/" + realm;

        Map<String, Object> props = new HashMap<>();
        props.put("id", UUID.randomUUID().toString());
        props.put("tenantId", context.tenantIdValue());
        props.put("providerName", ProviderType.KEYCLOAK.name());
        props.put("displayName", "Keycloak");
        props.put("protocol", ProtocolType.OIDC.name());
        props.put("clientId", keycloakConfig.getClient().getClientId());
        if (keycloakConfig.getClient().getClientSecret() != null && !keycloakConfig.getClient().getClientSecret().isBlank()) {
            props.put("clientSecretEncrypted", encryptionService.encrypt(keycloakConfig.getClient().getClientSecret()));
        }
        props.put("discoveryUrl", realmBase + "/.well-known/openid-configuration");
        props.put("authorizationUrl", realmBase + "/protocol/openid-connect/auth");
        props.put("tokenUrl", keycloakConfig.getTokenEndpoint(realm));
        props.put("userInfoUrl", keycloakConfig.getUserInfoEndpoint(realm));
        props.put("jwksUrl", keycloakConfig.getJwksUri(realm));
        props.put("issuerUrl", realmBase);
        props.put("scopes", List.of("openid", "profile", "email"));
        props.put("idpHint", "keycloak");
        props.put("enabled", true);
        props.put("priority", 1);
        props.put("trustEmail", true);
        props.put("storeToken", false);
        props.put("linkExistingAccounts", true);
        props.put("createdAt", now);
        props.put("updatedAt", now);
        return props;
    }

    private void validateDatabaseName(String dbName) {
        if (dbName == null || !dbName.matches("[A-Za-z0-9_]+")) {
            throw new IllegalArgumentException("Invalid tenant auth database name: " + dbName);
        }
    }

    private String quoteDatabaseName(String dbName) {
        return '`' + dbName.replace("`", "``") + '`';
    }
}
