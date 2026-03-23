package com.ems.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CORS Configuration for API Gateway
 *
 * Allows frontend applications to make requests to the API.
 * In production, restrict origins to actual domain names.
 */
@Configuration
public class CorsConfig {

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();

        // Allowed origins - add production domains here
        corsConfig.setAllowedOrigins(Arrays.asList(
            "http://localhost:4200",      // Angular dev server
            "http://127.0.0.1:4200",
            "http://localhost:24200",     // Containerized frontend (dev)
            "http://127.0.0.1:24200",
            "http://localhost:3000",      // Alternative dev port
            "http://localhost:8080"       // Gateway itself (for testing)
        ));

        // Allow all common HTTP methods
        corsConfig.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"
        ));

        // Allow all headers
        corsConfig.setAllowedHeaders(List.of("*"));

        // Expose these headers to the frontend
        corsConfig.setExposedHeaders(Arrays.asList(
            "Authorization",
            "X-Tenant-ID",
            "X-Request-ID",
            "X-Total-Count",
            "X-Page",
            "X-Page-Size"
        ));

        // Allow credentials (cookies, authorization headers)
        corsConfig.setAllowCredentials(true);

        // Cache preflight response for 1 hour
        corsConfig.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }
}
