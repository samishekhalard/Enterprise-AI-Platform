package com.ems.license.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI licenseServiceOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("EMS License Service API")
                .description("License pool management, seat assignment, and feature gates")
                .version("1.0.0")
                .contact(new Contact()
                    .name("EMS Team")
                    .email("support@ems.com"))
                .license(new License()
                    .name("Proprietary")))
            .components(new Components()
                .addSecuritySchemes("bearerAuth", new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")));
    }
}
