package com.ems.auth.service;

import com.ems.common.dto.auth.UserInfo;
import com.ems.common.exception.InvalidTokenException;
import com.ems.common.exception.TokenExpiredException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class TokenServiceImpl implements TokenService {

    private final StringRedisTemplate redisTemplate;
    private final String blacklistPrefix;
    private final String mfaSessionPrefix;
    private final long mfaSessionTtlMinutes;
    private final SecretKey mfaSigningKey;

    public TokenServiceImpl(
            StringRedisTemplate redisTemplate,
            @Value("${token.blacklist.prefix:auth:blacklist:}") String blacklistPrefix,
            @Value("${token.mfa-session.prefix:auth:mfa:}") String mfaSessionPrefix,
            @Value("${token.mfa-session.ttl-minutes:5}") long mfaSessionTtlMinutes,
            @Value("${token.mfa-signing-key:default-mfa-key-for-development-only-change-in-production}") String mfaSigningKey
    ) {
        this.redisTemplate = redisTemplate;
        this.blacklistPrefix = blacklistPrefix;
        this.mfaSessionPrefix = mfaSessionPrefix;
        this.mfaSessionTtlMinutes = mfaSessionTtlMinutes;
        this.mfaSigningKey = Keys.hmacShaKeyFor(mfaSigningKey.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public Claims parseToken(String token) {
        // Note: For Keycloak tokens, we use JWKS validation in JwtTokenValidator
        // This method is for internal token parsing with a shared secret
        try {
            JwtParser parser = Jwts.parser()
                    .verifyWith(mfaSigningKey)
                    .build();
            return parser.parseSignedClaims(token).getPayload();
        } catch (ExpiredJwtException e) {
            throw new TokenExpiredException("Token has expired");
        } catch (Exception e) {
            log.debug("Failed to parse token: {}", e.getMessage());
            throw new InvalidTokenException("Invalid or malformed token");
        }
    }

    @Override
    public UserInfo extractUserInfo(Claims claims) {
        String userId = claims.getSubject();
        String email = claims.get("email", String.class);
        String firstName = claims.get("given_name", String.class);
        String lastName = claims.get("family_name", String.class);
        String tenantId = claims.get("tenant_id", String.class);

        @SuppressWarnings("unchecked")
        List<String> roles = claims.get("roles", List.class);
        if (roles == null) {
            roles = Collections.emptyList();
        }

        return new UserInfo(userId, email, firstName, lastName, tenantId, roles);
    }

    @Override
    public boolean isBlacklisted(String jti) {
        if (jti == null || jti.isBlank()) {
            return false;
        }
        return Boolean.TRUE.equals(redisTemplate.hasKey(blacklistPrefix + jti));
    }

    @Override
    public void blacklistToken(String jti, long expirationTimeSeconds) {
        if (jti == null || jti.isBlank()) {
            return;
        }
        long ttl = Math.max(expirationTimeSeconds - (System.currentTimeMillis() / 1000), 60);
        redisTemplate.opsForValue().set(
                blacklistPrefix + jti,
                "1",
                ttl,
                TimeUnit.SECONDS
        );
        log.debug("Token {} blacklisted for {} seconds", jti, ttl);
    }

    @Override
    public String createMfaSessionToken(String userId, String tenantId) {
        String sessionId = UUID.randomUUID().toString();

        String token = Jwts.builder()
                .subject(userId)
                .claim("tenant_id", tenantId)
                .claim("type", "mfa_session")
                .id(sessionId)
                .issuedAt(new java.util.Date())
                .expiration(new java.util.Date(System.currentTimeMillis() + Duration.ofMinutes(mfaSessionTtlMinutes).toMillis()))
                .signWith(mfaSigningKey)
                .compact();

        // Store in Valkey for validation
        redisTemplate.opsForValue().set(
                mfaSessionPrefix + sessionId,
                userId + ":" + tenantId,
                mfaSessionTtlMinutes,
                TimeUnit.MINUTES
        );

        return token;
    }

    @Override
    public String validateMfaSessionToken(String token) {
        try {
            Claims claims = parseToken(token);

            String type = claims.get("type", String.class);
            if (!"mfa_session".equals(type)) {
                throw new InvalidTokenException("Invalid MFA session token");
            }

            String sessionId = claims.getId();
            String stored = redisTemplate.opsForValue().get(mfaSessionPrefix + sessionId);
            if (stored == null) {
                throw new InvalidTokenException("MFA session expired or invalid");
            }

            return claims.getSubject();
        } catch (InvalidTokenException | TokenExpiredException e) {
            throw e;
        } catch (Exception e) {
            log.warn("MFA session validation failed: {}", e.getMessage());
            throw new InvalidTokenException("Invalid MFA session token");
        }
    }

    @Override
    public void invalidateMfaSession(String token) {
        try {
            Claims claims = parseToken(token);
            String sessionId = claims.getId();
            redisTemplate.delete(mfaSessionPrefix + sessionId);
            log.debug("MFA session {} invalidated", sessionId);
        } catch (Exception e) {
            log.warn("Failed to invalidate MFA session: {}", e.getMessage());
        }
    }
}
