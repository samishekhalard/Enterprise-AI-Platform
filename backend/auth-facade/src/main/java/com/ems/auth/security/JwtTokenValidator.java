package com.ems.auth.security;

import com.ems.auth.config.KeycloakConfig;
import com.ems.common.dto.auth.UserInfo;
import com.ems.common.exception.InvalidTokenException;
import com.ems.common.exception.TokenExpiredException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigInteger;
import java.security.Key;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtTokenValidator {

    private final KeycloakConfig keycloakConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Cache JWKS keys per realm
    private final Map<String, Map<String, PublicKey>> jwksCache = new ConcurrentHashMap<>();
    private final Map<String, Long> jwksCacheExpiry = new ConcurrentHashMap<>();
    private static final long JWKS_CACHE_TTL_MS = 3600_000; // 1 hour

    public Claims validateToken(String token, String realm) {
        try {
            // Get the key ID from token header
            String keyId = extractKeyId(token);

            // Get public key from JWKS
            PublicKey publicKey = getPublicKey(realm, keyId);

            JwtParser parser = Jwts.parser()
                    .verifyWith(publicKey)
                    .build();

            return parser.parseSignedClaims(token).getPayload();
        } catch (ExpiredJwtException e) {
            throw new TokenExpiredException("Token has expired");
        } catch (Exception e) {
            log.debug("Token validation failed: {}", e.getMessage());
            throw new InvalidTokenException("Invalid or malformed token");
        }
    }

    public UserInfo extractUserInfo(Claims claims) {
        String userId = claims.getSubject();
        String email = claims.get("email", String.class);
        String firstName = claims.get("given_name", String.class);
        String lastName = claims.get("family_name", String.class);

        // Try different claim names for tenant
        String tenantId = null;
        if (claims.containsKey("tenant_id")) {
            tenantId = claims.get("tenant_id", String.class);
        } else if (claims.containsKey("tenantId")) {
            tenantId = claims.get("tenantId", String.class);
        }

        // Extract roles
        List<String> roles = new ArrayList<>();
        if (claims.containsKey("realm_access")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> realmAccess = (Map<String, Object>) claims.get("realm_access");
            if (realmAccess != null && realmAccess.containsKey("roles")) {
                @SuppressWarnings("unchecked")
                List<String> realmRoles = (List<String>) realmAccess.get("roles");
                if (realmRoles != null) {
                    roles.addAll(realmRoles);
                }
            }
        }

        return new UserInfo(userId, email, firstName, lastName, tenantId, roles);
    }

    public String getJti(Claims claims) {
        return claims.getId();
    }

    public long getExpirationTime(Claims claims) {
        Date exp = claims.getExpiration();
        return exp != null ? exp.getTime() / 1000 : 0;
    }

    private String extractKeyId(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new InvalidTokenException("Invalid token format");
            }

            String headerJson = new String(Base64.getUrlDecoder().decode(parts[0]));
            JsonNode header = objectMapper.readTree(headerJson);

            if (!header.has("kid")) {
                throw new InvalidTokenException("Token missing key ID");
            }

            return header.get("kid").asText();
        } catch (InvalidTokenException e) {
            throw e;
        } catch (Exception e) {
            throw new InvalidTokenException("Failed to parse token header");
        }
    }

    private PublicKey getPublicKey(String realm, String keyId) {
        String cacheKey = realm + ":" + keyId;

        // Check cache
        Map<String, PublicKey> realmKeys = jwksCache.get(realm);
        Long expiry = jwksCacheExpiry.get(realm);

        if (realmKeys != null && expiry != null && System.currentTimeMillis() < expiry) {
            PublicKey key = realmKeys.get(keyId);
            if (key != null) {
                return key;
            }
        }

        // Refresh JWKS
        refreshJwks(realm);

        realmKeys = jwksCache.get(realm);
        if (realmKeys == null || !realmKeys.containsKey(keyId)) {
            throw new InvalidTokenException("Unknown signing key");
        }

        return realmKeys.get(keyId);
    }

    private synchronized void refreshJwks(String realm) {
        try {
            String jwksUrl = keycloakConfig.getJwksUri(realm);
            String jwksJson = fetchJwks(jwksUrl);

            JsonNode jwks = objectMapper.readTree(jwksJson);
            JsonNode keys = jwks.get("keys");

            Map<String, PublicKey> keyMap = new HashMap<>();

            for (JsonNode key : keys) {
                if (!"RSA".equals(key.get("kty").asText())) {
                    continue;
                }

                String kid = key.get("kid").asText();
                String n = key.get("n").asText();
                String e = key.get("e").asText();

                PublicKey publicKey = createRsaPublicKey(n, e);
                keyMap.put(kid, publicKey);
            }

            jwksCache.put(realm, keyMap);
            jwksCacheExpiry.put(realm, System.currentTimeMillis() + JWKS_CACHE_TTL_MS);

            log.debug("Refreshed JWKS for realm {}, loaded {} keys", realm, keyMap.size());
        } catch (Exception e) {
            log.error("Failed to refresh JWKS for realm {}: {}", realm, e.getMessage());
            throw new InvalidTokenException("Unable to validate token signature");
        }
    }

    private String fetchJwks(String url) {
        try {
            java.net.URL jwksUrl = new java.net.URL(url);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) jwksUrl.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            if (conn.getResponseCode() != 200) {
                throw new RuntimeException("Failed to fetch JWKS: HTTP " + conn.getResponseCode());
            }

            try (java.io.InputStream is = conn.getInputStream();
                 java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(is))) {
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                return sb.toString();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch JWKS: " + e.getMessage(), e);
        }
    }

    private PublicKey createRsaPublicKey(String modulusBase64, String exponentBase64) throws Exception {
        byte[] modulusBytes = Base64.getUrlDecoder().decode(modulusBase64);
        byte[] exponentBytes = Base64.getUrlDecoder().decode(exponentBase64);

        BigInteger modulus = new BigInteger(1, modulusBytes);
        BigInteger exponent = new BigInteger(1, exponentBytes);

        RSAPublicKeySpec spec = new RSAPublicKeySpec(modulus, exponent);
        KeyFactory factory = KeyFactory.getInstance("RSA");

        return factory.generatePublic(spec);
    }
}
