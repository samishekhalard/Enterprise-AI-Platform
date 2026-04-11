package com.ems.auth.controller;

import com.ems.auth.filter.JwtValidationFilter;
import com.ems.auth.filter.TenantContextFilter;
import com.ems.auth.security.TenantAccessValidator;
import com.ems.auth.service.KeycloakService;
import com.ems.auth.util.RealmResolver;
import com.ems.common.dto.auth.AuthEventDTO;
import com.ems.common.dto.auth.AuthEventQuery;
import com.ems.common.dto.auth.UserInfo;
import com.ems.common.exception.AuthenticationException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Auth Events", description = "Authentication event monitoring and audit logs")
@SecurityRequirement(name = "bearerAuth")
public class EventController {

    private final KeycloakService keycloakService;
    private final TenantAccessValidator tenantAccessValidator;

    @GetMapping
    @Operation(
            summary = "Get authentication events",
            description = "Retrieve authentication events for audit and monitoring. Requires admin role."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Events retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Not authenticated"),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions - requires admin role")
    })
    public ResponseEntity<List<AuthEventDTO>> getEvents(
            @Parameter(description = "Tenant identifier", required = true)
            @RequestHeader(TenantContextFilter.TENANT_HEADER) String tenantId,
            @Parameter(description = "Filter by event types (comma-separated)")
            @RequestParam(required = false) List<String> types,
            @Parameter(description = "Filter by user ID")
            @RequestParam(required = false) String userId,
            @Parameter(description = "Filter by IP address")
            @RequestParam(required = false) String ipAddress,
            @Parameter(description = "Filter events from this date (ISO-8601)")
            @RequestParam(required = false) Instant dateFrom,
            @Parameter(description = "Filter events until this date (ISO-8601)")
            @RequestParam(required = false) Instant dateTo,
            @Parameter(description = "Pagination offset")
            @RequestParam(defaultValue = "0") Integer first,
            @Parameter(description = "Maximum results to return")
            @RequestParam(defaultValue = "100") Integer max
    ) {
        requireAdminRole();
        // SEC-F02: Tenant isolation — prevent IDOR by verifying JWT tenant_id matches header
        tenantAccessValidator.validateTenantAccess(tenantId);

        String realm = RealmResolver.resolve(tenantId);

        AuthEventQuery query = AuthEventQuery.builder()
                .types(types)
                .userId(userId)
                .ipAddress(ipAddress)
                .dateFrom(dateFrom)
                .dateTo(dateTo)
                .first(first)
                .max(max)
                .build();

        List<AuthEventDTO> events = keycloakService.getEvents(realm, query);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/recent")
    @Operation(
            summary = "Get recent authentication events",
            description = "Retrieve recent auth events (last 24 hours). Requires admin role."
    )
    public ResponseEntity<List<AuthEventDTO>> getRecentEvents(
            @RequestHeader(TenantContextFilter.TENANT_HEADER) String tenantId,
            @RequestParam(defaultValue = "50") Integer limit
    ) {
        requireAdminRole();
        // SEC-F02: Tenant isolation — prevent IDOR by verifying JWT tenant_id matches header
        tenantAccessValidator.validateTenantAccess(tenantId);

        String realm = RealmResolver.resolve(tenantId);

        AuthEventQuery query = AuthEventQuery.builder()
                .dateFrom(Instant.now().minus(24, ChronoUnit.HOURS))
                .max(limit)
                .build();

        List<AuthEventDTO> events = keycloakService.getEvents(realm, query);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/login-failures")
    @Operation(
            summary = "Get failed login attempts",
            description = "Retrieve failed login events for security monitoring. Requires admin role."
    )
    public ResponseEntity<List<AuthEventDTO>> getLoginFailures(
            @RequestHeader(TenantContextFilter.TENANT_HEADER) String tenantId,
            @RequestParam(required = false) Instant dateFrom,
            @RequestParam(defaultValue = "100") Integer limit
    ) {
        requireAdminRole();
        // SEC-F02: Tenant isolation — prevent IDOR by verifying JWT tenant_id matches header
        tenantAccessValidator.validateTenantAccess(tenantId);

        String realm = RealmResolver.resolve(tenantId);

        AuthEventQuery query = AuthEventQuery.builder()
                .types(List.of(AuthEventDTO.LOGIN_ERROR))
                .dateFrom(dateFrom != null ? dateFrom : Instant.now().minus(7, ChronoUnit.DAYS))
                .max(limit)
                .build();

        List<AuthEventDTO> events = keycloakService.getEvents(realm, query);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/stats")
    @Operation(
            summary = "Get event statistics",
            description = "Get aggregated statistics for authentication events. Requires admin role."
    )
    public ResponseEntity<Map<String, Object>> getEventStats(
            @RequestHeader(TenantContextFilter.TENANT_HEADER) String tenantId
    ) {
        requireAdminRole();
        // SEC-F02: Tenant isolation — prevent IDOR by verifying JWT tenant_id matches header
        tenantAccessValidator.validateTenantAccess(tenantId);

        String realm = RealmResolver.resolve(tenantId);
        Instant last24h = Instant.now().minus(24, ChronoUnit.HOURS);
        Instant last7d = Instant.now().minus(7, ChronoUnit.DAYS);

        // Get counts for different event types
        long totalLogins24h = keycloakService.getEventCount(realm,
                AuthEventQuery.builder().types(List.of(AuthEventDTO.LOGIN)).dateFrom(last24h).build());

        long failedLogins24h = keycloakService.getEventCount(realm,
                AuthEventQuery.builder().types(List.of(AuthEventDTO.LOGIN_ERROR)).dateFrom(last24h).build());

        long totalLogins7d = keycloakService.getEventCount(realm,
                AuthEventQuery.builder().types(List.of(AuthEventDTO.LOGIN)).dateFrom(last7d).build());

        long failedLogins7d = keycloakService.getEventCount(realm,
                AuthEventQuery.builder().types(List.of(AuthEventDTO.LOGIN_ERROR)).dateFrom(last7d).build());

        long passwordResets7d = keycloakService.getEventCount(realm,
                AuthEventQuery.builder().types(List.of(AuthEventDTO.RESET_PASSWORD)).dateFrom(last7d).build());

        Map<String, Object> stats = Map.of(
                "last24Hours", Map.of(
                        "successfulLogins", totalLogins24h,
                        "failedLogins", failedLogins24h,
                        "successRate", totalLogins24h > 0 ?
                                (double) totalLogins24h / (totalLogins24h + failedLogins24h) * 100 : 0
                ),
                "last7Days", Map.of(
                        "successfulLogins", totalLogins7d,
                        "failedLogins", failedLogins7d,
                        "passwordResets", passwordResets7d
                ),
                "generatedAt", Instant.now()
        );

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/user/{userId}")
    @Operation(
            summary = "Get events for specific user",
            description = "Retrieve authentication events for a specific user. Requires admin role."
    )
    public ResponseEntity<List<AuthEventDTO>> getUserEvents(
            @RequestHeader(TenantContextFilter.TENANT_HEADER) String tenantId,
            @PathVariable String userId,
            @RequestParam(defaultValue = "50") Integer limit
    ) {
        requireAdminRole();
        // SEC-F02: Tenant isolation — prevent IDOR by verifying JWT tenant_id matches header
        tenantAccessValidator.validateTenantAccess(tenantId);

        String realm = RealmResolver.resolve(tenantId);

        AuthEventQuery query = AuthEventQuery.builder()
                .userId(userId)
                .max(limit)
                .build();

        List<AuthEventDTO> events = keycloakService.getEvents(realm, query);
        return ResponseEntity.ok(events);
    }

    private void requireAdminRole() {
        UserInfo currentUser = JwtValidationFilter.getCurrentUser();
        if (currentUser == null) {
            throw new AuthenticationException("Not authenticated", "not_authenticated");
        }

        List<String> roles = currentUser.roles();
        if (roles == null || (!roles.contains("admin") && !roles.contains("super-admin"))) {
            throw new AuthenticationException(
                "Insufficient permissions - admin role required",
                "access_denied"
            );
        }
    }

}
