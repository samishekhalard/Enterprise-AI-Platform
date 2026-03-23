package com.ems.auth.config;

import com.ems.auth.security.InternalServiceTokenProvider;
import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignSecurityConfig {

    @Bean
    public RequestInterceptor internalServiceAuthInterceptor(InternalServiceTokenProvider tokenProvider) {
        return template -> {
            String path = template.path();
            if (path != null && path.startsWith("/api/v1/internal/")) {
                template.header("Authorization", "Bearer " + tokenProvider.getAccessToken());
            }
        };
    }
}
