#!/usr/bin/env bash
# ==============================================================================
# EMSIST - Build & Push Docker Images to Docker Hub
#
# Registry: thinkplusae/emsist
# Tag format: thinkplusae/emsist:<service>-<version>
#
# Usage:
#   ./scripts/build-push.sh                          # Build & push all, tag=latest
#   ./scripts/build-push.sh --version 1.2.0          # Build & push all, tag=1.2.0
#   ./scripts/build-push.sh --service api-gateway     # Build & push one service
#   ./scripts/build-push.sh --build-only              # Build without pushing
#   ./scripts/build-push.sh --platform linux/amd64    # Single platform (faster)
#
# Prerequisites:
#   - docker login (or DOCKERHUB_USERNAME / DOCKERHUB_TOKEN env vars)
#   - docker buildx (for multi-platform builds)
# ==============================================================================
set -euo pipefail

# ------------------------------------------------------------------------------
# Constants
# ------------------------------------------------------------------------------
REGISTRY="thinkplusae/emsist"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEFAULT_PLATFORM="linux/amd64,linux/arm64"

# Service definitions: name|build-context|dockerfile
# Backend services use backend/ as build context with per-service Dockerfiles
BACKEND_SERVICES=(
  "api-gateway|backend|backend/api-gateway/Dockerfile"
  "auth-facade|backend|backend/auth-facade/Dockerfile"
  "tenant-service|backend|backend/tenant-service/Dockerfile"
  "user-service|backend|backend/user-service/Dockerfile"
  "license-service|backend|backend/license-service/Dockerfile"
  "notification-service|backend|backend/notification-service/Dockerfile"
  "audit-service|backend|backend/audit-service/Dockerfile"
  "ai-service|backend|backend/ai-service/Dockerfile"
  "process-service|backend|backend/process-service/Dockerfile"
  "definition-service|backend|backend/definition-service/Dockerfile"
  "eureka-server|backend/eureka-server|backend/eureka-server/Dockerfile"
)

FRONTEND_SERVICES=(
  "frontend|frontend|frontend/Dockerfile"
)

INFRA_SERVICES=(
  "keycloak-init|infrastructure/keycloak|infrastructure/keycloak/Dockerfile"
)

# ------------------------------------------------------------------------------
# Defaults
# ------------------------------------------------------------------------------
VERSION="latest"
TARGET_SERVICE=""
BUILD_ONLY=false
PLATFORM="${DEFAULT_PLATFORM}"
PARALLEL=true
DRY_RUN=false

# ------------------------------------------------------------------------------
# Parse arguments
# ------------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --version|-v)
      VERSION="$2"
      shift 2
      ;;
    --service|-s)
      TARGET_SERVICE="$2"
      shift 2
      ;;
    --build-only)
      BUILD_ONLY=true
      shift
      ;;
    --platform|-p)
      PLATFORM="$2"
      shift 2
      ;;
    --no-parallel)
      PARALLEL=false
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --version, -v VERSION    Image version tag (default: latest)"
      echo "  --service, -s SERVICE    Build only this service"
      echo "  --build-only             Build without pushing"
      echo "  --platform, -p PLATFORM  Target platforms (default: linux/amd64,linux/arm64)"
      echo "  --no-parallel            Disable parallel builds"
      echo "  --dry-run                Print commands without executing"
      echo "  --help, -h               Show this help"
      echo ""
      echo "Services: api-gateway auth-facade tenant-service user-service"
      echo "          license-service notification-service audit-service"
      echo "          ai-service process-service definition-service eureka-server"
      echo "          frontend keycloak-init"
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
log_info()  { echo "[INFO]  $(date '+%H:%M:%S') $*"; }
log_ok()    { echo "[OK]    $(date '+%H:%M:%S') $*"; }
log_error() { echo "[ERROR] $(date '+%H:%M:%S') $*" >&2; }

ensure_buildx() {
  if ! docker buildx inspect emsist-builder >/dev/null 2>&1; then
    log_info "Creating buildx builder 'emsist-builder'..."
    docker buildx create --name emsist-builder --use --bootstrap >/dev/null 2>&1 || true
  else
    docker buildx use emsist-builder >/dev/null 2>&1 || true
  fi
}

docker_login() {
  if [[ "${BUILD_ONLY}" == "true" ]]; then
    return 0
  fi
  if [[ -n "${DOCKERHUB_USERNAME:-}" ]] && [[ -n "${DOCKERHUB_TOKEN:-}" ]]; then
    log_info "Logging into Docker Hub as ${DOCKERHUB_USERNAME}..."
    echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin
  else
    # Assume already logged in
    log_info "Using existing Docker Hub credentials."
  fi
}

build_and_push() {
  local service_name="$1"
  local build_context="$2"
  local dockerfile="$3"

  local tag_version="${REGISTRY}:${service_name}-${VERSION}"
  local tag_latest="${REGISTRY}:${service_name}-latest"

  local tags="-t ${tag_version}"
  if [[ "${VERSION}" != "latest" ]]; then
    tags="${tags} -t ${tag_latest}"
  fi

  local push_flag=""
  if [[ "${BUILD_ONLY}" == "false" ]]; then
    push_flag="--push"
  else
    push_flag="--load"
    # --load only works with single platform
    if [[ "${PLATFORM}" == *","* ]]; then
      PLATFORM="linux/amd64"
      log_info "  (--build-only: forcing single platform linux/amd64 for --load)"
    fi
  fi

  local cmd="docker buildx build \
    --platform ${PLATFORM} \
    -f ${REPO_ROOT}/${dockerfile} \
    ${tags} \
    ${push_flag} \
    ${REPO_ROOT}/${build_context}"

  if [[ "${DRY_RUN}" == "true" ]]; then
    echo "[DRY-RUN] ${cmd}"
    return 0
  fi

  log_info "Building ${service_name} (${VERSION})..."
  if eval "${cmd}"; then
    log_ok "${service_name} built successfully."
  else
    log_error "${service_name} build FAILED."
    return 1
  fi
}

# Collect all services into a flat array
get_all_services() {
  local -n result=$1
  result=("${BACKEND_SERVICES[@]}" "${FRONTEND_SERVICES[@]}" "${INFRA_SERVICES[@]}")
}

# Find a service by name
find_service() {
  local name="$1"
  declare -a all_services
  get_all_services all_services
  for entry in "${all_services[@]}"; do
    local svc_name="${entry%%|*}"
    if [[ "${svc_name}" == "${name}" ]]; then
      echo "${entry}"
      return 0
    fi
  done
  return 1
}

# ------------------------------------------------------------------------------
# Main
# ------------------------------------------------------------------------------
main() {
  log_info "=== EMSIST Docker Build & Push ==="
  log_info "Registry: ${REGISTRY}"
  log_info "Version:  ${VERSION}"
  log_info "Platform: ${PLATFORM}"
  log_info "Push:     $([[ "${BUILD_ONLY}" == "true" ]] && echo "NO (build-only)" || echo "YES")"
  echo ""

  ensure_buildx
  docker_login

  if [[ -n "${TARGET_SERVICE}" ]]; then
    # Build single service
    local entry
    entry=$(find_service "${TARGET_SERVICE}") || {
      log_error "Unknown service: ${TARGET_SERVICE}"
      echo "Available services:"
      declare -a all_services
      get_all_services all_services
      for e in "${all_services[@]}"; do echo "  - ${e%%|*}"; done
      exit 1
    }

    IFS='|' read -r svc_name build_ctx dockerfile <<< "${entry}"
    build_and_push "${svc_name}" "${build_ctx}" "${dockerfile}"
  else
    # Build all services
    declare -a all_services
    get_all_services all_services

    local total=${#all_services[@]}
    local current=0
    local failed=0
    local pids=()
    local svc_names=()

    for entry in "${all_services[@]}"; do
      IFS='|' read -r svc_name build_ctx dockerfile <<< "${entry}"
      current=$((current + 1))

      if [[ "${PARALLEL}" == "true" ]] && [[ "${BUILD_ONLY}" == "false" ]]; then
        # Run builds in background (parallel push mode)
        build_and_push "${svc_name}" "${build_ctx}" "${dockerfile}" &
        pids+=($!)
        svc_names+=("${svc_name}")
      else
        # Sequential builds
        log_info "[${current}/${total}] ${svc_name}"
        if ! build_and_push "${svc_name}" "${build_ctx}" "${dockerfile}"; then
          failed=$((failed + 1))
          log_error "Stopping on first failure."
          exit 1
        fi
      fi
    done

    # Wait for parallel builds
    if [[ "${PARALLEL}" == "true" ]] && [[ "${BUILD_ONLY}" == "false" ]]; then
      log_info "Waiting for ${#pids[@]} parallel builds..."
      for i in "${!pids[@]}"; do
        if ! wait "${pids[$i]}"; then
          log_error "${svc_names[$i]} FAILED."
          failed=$((failed + 1))
        fi
      done
    fi

    echo ""
    if [[ ${failed} -gt 0 ]]; then
      log_error "${failed}/${total} builds failed."
      exit 1
    else
      log_ok "All ${total} services built successfully."
    fi
  fi

  echo ""
  log_info "=== Done ==="
}

main
