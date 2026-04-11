package com.ems.auth.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("EMS Auth Facade API")
                        .version("1.0.0")
                        .description("""
                                Authentication BFF (Backend-for-Frontend) service implementing the Zero-Redirect pattern.

                                ## Features
                                - Email/password authentication via Direct Access Grant
                                - Social login (Google One Tap, Microsoft MSAL)
                                - Token refresh with rotation
                                - MFA (TOTP) setup and verification
                                - Rate limiting (100 requests/minute)

                                ## Headers
                                - `X-Tenant-ID`: Required for all requests to identify the tenant
                                - `Authorization: Bearer <token>`: Required for protected endpoints
                                """)
                        .contact(new Contact()
                                .name("EMS Team")
                                .email("support@ems.com")))
                .servers(List.of(
                        new Server().url("http://localhost:8081").description("Local development")
                ))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("JWT access token")));
    }
}
