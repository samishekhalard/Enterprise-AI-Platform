#!/usr/bin/env bash
# ==============================================================================
# EMSIST - Deployment Script
#
# Pulls images from Docker Hub and deploys using docker-compose.prod.yml.
#
# Usage:
#   ./scripts/deploy.sh                        # Deploy latest
#   ./scripts/deploy.sh --version 1.2.0        # Deploy specific version
#   ./scripts/deploy.sh --rollback              # Rollback to previous version
#   ./scripts/deploy.sh --health-check-only     # Just run health checks
#
# Prerequisites:
#   - docker and docker compose installed
#   - .env.prod file configured (copy from .env.example)
#   - Network access to Docker Hub
# ==============================================================================
set -euo pipefail

# ------------------------------------------------------------------------------
# Constants
# ------------------------------------------------------------------------------
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/docker-compose.prod.yml"
ENV_FILE="${REPO_ROOT}/.env.prod"
ROLLBACK_FILE="${REPO_ROOT}/.deploy-previous-version"
REGISTRY="thinkplusae/emsist"

# Services to health-check (name:port:path)
HEALTH_ENDPOINTS=(
  "eureka:8761:/actuator/health"
  "api-gateway:8080:/actuator/health"
  "auth-facade:8081:/actuator/health"
  "tenant-service:8082:/actuator/health"
  "user-service:8083:/actuator/health"
  "license-service:8085:/actuator/health"
  "notification-service:8086:/actuator/health"
  "audit-service:8087:/actuator/health"
  "ai-service:8088:/actuator/health"
  "process-service:8089:/actuator/health"
  "definition-service:8090:/actuator/health"
)

# ------------------------------------------------------------------------------
# Defaults
# ------------------------------------------------------------------------------
VERSION="latest"
ROLLBACK=false
HEALTH_CHECK_ONLY=false
HEALTH_TIMEOUT=300
HEALTH_INTERVAL=10

# ------------------------------------------------------------------------------
# Parse arguments
# ------------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --version|-v)
      VERSION="$2"
      shift 2
      ;;
    --rollback)
      ROLLBACK=true
      shift
      ;;
    --health-check-only)
      HEALTH_CHECK_ONLY=true
      shift
      ;;
    --health-timeout)
      HEALTH_TIMEOUT="$2"
      shift 2
      ;;
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --version, -v VERSION    Image version to deploy (default: latest)"
      echo "  --rollback               Rollback to the previous deployed version"
      echo "  --health-check-only      Only run health checks, do not deploy"
      echo "  --health-timeout SECS    Max seconds to wait for health (default: 300)"
      echo "  --env-file FILE          Environment file (default: .env.prod)"
      echo "  --help, -h               Show this help"
      exit 0
      ;;
    *)
      echo "ERROR: Unknown option: $1"
      exit 1
      ;;
  esac
done

# ------------------------------------------------------------------------------
# Functions
# ------------------------------------------------------------------------------
log_info()  { echo "[INFO]  $(date '+%Y-%m-%d %H:%M:%S') $*"; }
log_ok()    { echo "[OK]    $(date '+%Y-%m-%d %H:%M:%S') $*"; }
log_warn()  { echo "[WARN]  $(date '+%Y-%m-%d %H:%M:%S') $*"; }
log_error() { echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') $*" >&2; }

check_prerequisites() {
  if ! command -v docker >/dev/null 2>&1; then
    log_error "docker is not installed."
    exit 1
  fi

  if [[ ! -f "${ENV_FILE}" ]]; then
    log_error "Environment file not found: ${ENV_FILE}"
    log_error "Copy .env.example to ${ENV_FILE} and configure it."
    exit 1
  fi

  if [[ ! -f "${COMPOSE_FILE}" ]]; then
    log_error "Compose file not found: ${COMPOSE_FILE}"
    exit 1
  fi
}

save_current_version() {
  # Save current version for rollback
  local current
  current=$(docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" \
    config 2>/dev/null | grep -m1 "image:.*${REGISTRY}" | sed 's/.*-//' || echo "unknown")
  echo "${current}" > "${ROLLBACK_FILE}"
  log_info "Saved current version for rollback: ${current}"
}

pull_images() {
  log_info "Pulling images for version: ${VERSION}..."
  export IMAGE_TAG="${VERSION}"
  docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" pull
  log_ok "All images pulled."
}

deploy() {
  log_info "Deploying version: ${VERSION}..."
  export IMAGE_TAG="${VERSION}"
  docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d --remove-orphans
  log_ok "Deployment started."
}

run_health_checks() {
  log_info "Running health checks (timeout: ${HEALTH_TIMEOUT}s)..."

  local elapsed=0
  local all_healthy=false

  while [[ ${elapsed} -lt ${HEALTH_TIMEOUT} ]]; do
    all_healthy=true

    for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
      IFS=':' read -r name port path <<< "${endpoint}"

      # Use docker compose exec to check health inside the network
      local status
      status=$(docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" \
        exec -T "${name}" wget -q -O - "http://localhost:${port}${path}" 2>/dev/null | \
        grep -o '"status":"[A-Z]*"' | head -1 || echo "")

      if [[ "${status}" == *"UP"* ]]; then
        continue
      else
        all_healthy=false
      fi
    done

    if [[ "${all_healthy}" == "true" ]]; then
      echo ""
      log_ok "All services healthy."
      return 0
    fi

    printf "\r  Waiting... %ds/%ds" "${elapsed}" "${HEALTH_TIMEOUT}"
    sleep "${HEALTH_INTERVAL}"
    elapsed=$((elapsed + HEALTH_INTERVAL))
  done

  echo ""
  log_error "Health check timeout after ${HEALTH_TIMEOUT}s."
  log_error "Unhealthy services:"

  for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
    IFS=':' read -r name port path <<< "${endpoint}"
    local status
    status=$(docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" \
      ps --format "{{.Status}}" "${name}" 2>/dev/null || echo "not running")
    echo "  - ${name}: ${status}"
  done

  return 1
}

rollback() {
  if [[ ! -f "${ROLLBACK_FILE}" ]]; then
    log_error "No rollback version found. File missing: ${ROLLBACK_FILE}"
    exit 1
  fi

  local prev_version
  prev_version=$(cat "${ROLLBACK_FILE}")
  log_warn "Rolling back to version: ${prev_version}"

  VERSION="${prev_version}"
  pull_images
  deploy

  if run_health_checks; then
    log_ok "Rollback to ${prev_version} successful."
  else
    log_error "Rollback to ${prev_version} failed. Manual intervention required."
    exit 1
  fi
}

# ------------------------------------------------------------------------------
# Main
# ------------------------------------------------------------------------------
main() {
  log_info "=== EMSIST Deployment ==="
  log_info "Compose:  ${COMPOSE_FILE}"
  log_info "Env:      ${ENV_FILE}"

  check_prerequisites

  if [[ "${HEALTH_CHECK_ONLY}" == "true" ]]; then
    log_info "Running health checks only..."
    if run_health_checks; then
      exit 0
    else
      exit 1
    fi
  fi

  if [[ "${ROLLBACK}" == "true" ]]; then
    rollback
    exit 0
  fi

  log_info "Version:  ${VERSION}"
  echo ""

  # Save current version before deploying
  save_current_version

  # Pull and deploy
  pull_images
  deploy

  # Verify health
  if run_health_checks; then
    log_ok "Deployment of version ${VERSION} complete."
  else
    log_warn "Services not fully healthy. Consider rollback with: $0 --rollback"
    exit 1
  fi
}

main
