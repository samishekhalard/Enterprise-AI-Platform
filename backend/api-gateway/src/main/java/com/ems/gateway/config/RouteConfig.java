package com.ems.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * API Gateway Route Configuration
 *
 * Routes all API requests to appropriate microservices.
 * All services are internal - only the gateway is exposed.
 */
@Configuration
@Profile("!docker")
public class RouteConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            // ================================================================
            // LICENSE SERVICE (8085) - License admin (must precede admin catch-all)
            // ================================================================
            .route("license-admin-service", r -> r
                .path("/api/v1/admin/licenses/**")
                .uri("lb://LICENSE-SERVICE"))
            .route("license-seats-service", r -> r
                .path("/api/v1/tenants/*/seats/**")
                .uri("lb://LICENSE-SERVICE"))

            // ================================================================
            // AUTH FACADE (8081) - Authentication endpoints
            // ================================================================
            .route("auth-service", r -> r
                .path("/api/v1/auth/**")
                .uri("lb://AUTH-FACADE"))
            .route("auth-admin-service", r -> r
                .path("/api/v1/admin/**")
                .uri("lb://AUTH-FACADE"))
            .route("auth-events-service", r -> r
                .path("/api/v1/events/**")
                .uri("lb://AUTH-FACADE"))

            // ================================================================
            // TENANT SERVICE (8082) - Tenant management
            // ================================================================
            .route("tenant-service", r -> r
                .path("/api/tenants/**")
                .uri("lb://TENANT-SERVICE"))

            // ================================================================
            // USER SERVICE (8083) - User management
            // ================================================================
            .route("user-service", r -> r
                .path("/api/v1/users/**")
                .uri("lb://USER-SERVICE"))

            // ================================================================
            // LICENSE SERVICE (8085) - Feature gates (public)
            // ================================================================
            .route("license-features", r -> r
                .path("/api/v1/features/**")
                .uri("lb://LICENSE-SERVICE"))

            // ================================================================
            // LICENSE SERVICE (8085) - License management
            // ================================================================
            .route("license-products", r -> r
                .path("/api/v1/products/**")
                .uri("lb://LICENSE-SERVICE"))
            .route("license-service", r -> r
                .path("/api/v1/licenses/**")
                .uri("lb://LICENSE-SERVICE"))

            // ================================================================
            // NOTIFICATION SERVICE (8086) - Notifications
            // ================================================================
            .route("notification-service", r -> r
                .path("/api/v1/notifications/**")
                .uri("lb://NOTIFICATION-SERVICE"))
            .route("notification-templates", r -> r
                .path("/api/v1/notification-templates/**")
                .uri("lb://NOTIFICATION-SERVICE"))

            // ================================================================
            // AUDIT SERVICE (8087) - Audit logs
            // ================================================================
            .route("audit-service", r -> r
                .path("/api/v1/audit/**")
                .uri("lb://AUDIT-SERVICE"))

            // ================================================================
            // AI SERVICE (8088) - AI Chatbot & Agents
            // ================================================================
            .route("ai-agents", r -> r
                .path("/api/v1/agents/**")
                .uri("lb://AI-SERVICE"))
            .route("ai-conversations", r -> r
                .path("/api/v1/conversations/**")
                .uri("lb://AI-SERVICE"))
            .route("ai-providers", r -> r
                .path("/api/v1/providers/**")
                .uri("lb://AI-SERVICE"))

            // ================================================================
            // DEFINITION SERVICE (8090) - Master type definitions
            // ================================================================
            .route("definition-service", r -> r
                .path("/api/v1/definitions/**")
                .uri("lb://DEFINITION-SERVICE"))

            .build();
    }
}
