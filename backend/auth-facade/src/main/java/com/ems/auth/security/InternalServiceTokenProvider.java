package com.ems.auth.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;

/**
 * Obtains and caches client-credentials access tokens for internal service calls.
 */
@Component
@Slf4j
public class InternalServiceTokenProvider {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${service-auth.token-url}")
    private String tokenUrl;

    @Value("${service-auth.client-id}")
    private String clientId;

    @Value("${service-auth.client-secret}")
    private String clientSecret;

    @Value("${service-auth.scope:internal.service}")
    private String scope;

    private volatile String accessToken;
    private volatile Instant expiresAt = Instant.EPOCH;

    public String getAccessToken() {
        Instant now = Instant.now();
        if (accessToken != null && now.isBefore(expiresAt.minusSeconds(30))) {
            return accessToken;
        }

        synchronized (this) {
            now = Instant.now();
            if (accessToken != null && now.isBefore(expiresAt.minusSeconds(30))) {
                return accessToken;
            }
            refreshToken();
            return accessToken;
        }
    }

    @SuppressWarnings("unchecked")
    private void refreshToken() {
        if (clientSecret == null || clientSecret.isBlank()) {
            throw new IllegalStateException("service-auth.client-secret must be configured");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        if (scope != null && !scope.isBlank()) {
            body.add("scope", scope);
        }

        ResponseEntity<Map> response = restTemplate.postForEntity(
            tokenUrl,
            new HttpEntity<>(body, headers),
            Map.class
        );

        Map<String, Object> payload = response.getBody();
        if (payload == null || payload.get("access_token") == null) {
            throw new IllegalStateException("Token endpoint did not return access_token");
        }

        String token = payload.get("access_token").toString();
        Number expiresIn = (Number) payload.getOrDefault("expires_in", 60);

        this.accessToken = token;
        this.expiresAt = Instant.now().plusSeconds(expiresIn.longValue());
        log.debug("Refreshed internal service token (expires in {}s)", expiresIn.longValue());
    }
}
