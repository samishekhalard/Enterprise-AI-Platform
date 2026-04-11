# ==============================================================================
# EMS Service Registry (Eureka Server) - Multi-stage Docker Build
# Build context: backend/eureka-server
# ==============================================================================

FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /app

COPY pom.xml ./
COPY src ./src

RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S ems && adduser -S ems -G ems
USER ems

COPY --from=builder /app/target/eureka-server-*.jar app.jar

EXPOSE 8761

HEALTHCHECK --interval=30s --timeout=3s --start-period=45s --retries=5 \
  CMD wget -q --spider http://127.0.0.1:8761/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]

