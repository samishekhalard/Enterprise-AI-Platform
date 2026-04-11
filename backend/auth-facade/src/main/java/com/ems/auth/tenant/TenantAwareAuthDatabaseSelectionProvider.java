package com.ems.auth.tenant;

import com.ems.auth.config.AuthGraphPerTenantProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.neo4j.core.DatabaseSelection;
import org.springframework.data.neo4j.core.DatabaseSelectionProvider;

@RequiredArgsConstructor
@Slf4j
public class TenantAwareAuthDatabaseSelectionProvider implements DatabaseSelectionProvider {

    private final AuthGraphPerTenantProperties properties;

    @Override
    public DatabaseSelection getDatabaseSelection() {
        if (!properties.isEnabled()) {
            return DatabaseSelection.undecided();
        }

        TenantRoutingContext context = TenantRoutingContextHolder.getCurrent();
        if (context == null || context.authDbName() == null || context.authDbName().isBlank()) {
            throw new IllegalStateException("Missing tenant routing context for auth Neo4j database selection");
        }

        log.debug("Selecting tenant auth database {} for tenant {}", context.authDbName(), context.tenantIdValue());
        return DatabaseSelection.byName(context.authDbName());
    }
}
