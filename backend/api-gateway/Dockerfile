# ==============================================================================
# EMS API Gateway - Multi-stage Docker Build
# Build context: backend/ (parent directory)
# ==============================================================================

# Build stage
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Install Maven (no mvnw in repo)
RUN apk add --no-cache maven

# Copy parent POM and ALL module POMs (Maven reactor needs all modules)
COPY pom.xml ./
COPY common/pom.xml common/
COPY api-gateway/pom.xml api-gateway/
COPY auth-facade/pom.xml auth-facade/
COPY tenant-service/pom.xml tenant-service/
COPY user-service/pom.xml user-service/
COPY license-service/pom.xml license-service/
COPY product-service/pom.xml product-service/
COPY persona-service/pom.xml persona-service/
COPY notification-service/pom.xml notification-service/
COPY audit-service/pom.xml audit-service/
COPY ai-service/pom.xml ai-service/
COPY process-service/pom.xml process-service/

# Download dependencies (cached layer)
# Override java.version=21 to match JDK 21 in this image (parent pom uses 23 for dev)
RUN mvn dependency:go-offline -pl api-gateway -DskipTests -Djava.version=21 -Dlombok.version=1.18.36 -B \
    --fail-never 2>/dev/null || true

# Copy source code
COPY api-gateway/src api-gateway/src

# Build the application
RUN mvn package -pl api-gateway -DskipTests -Djava.version=21 -Dlombok.version=1.18.36 -B

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Add non-root user for security
RUN addgroup -S ems && adduser -S ems -G ems
USER ems

# Copy built JAR
COPY --from=builder /app/api-gateway/target/api-gateway-*.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget -q --spider http://localhost:8080/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
