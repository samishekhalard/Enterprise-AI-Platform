#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${1:-origin/main}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
ALLOWLIST_FILE="${OPENAPI_BREAKING_ALLOWLIST_FILE:-.openapi-breaking-allowlist}"

trim() {
  local value="${1:-}"
  # shellcheck disable=SC2001
  value="$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  echo "$value"
}

get_breaking_approval() {
  local spec="$1"

  if [[ ! -f "$ALLOWLIST_FILE" ]]; then
    return 1
  fi

  local today
  today="$(date +%F)"

  while IFS='|' read -r raw_spec raw_expires raw_reason; do
    local approved_spec
    approved_spec="$(trim "$raw_spec")"
    if [[ -z "$approved_spec" || "$approved_spec" == \#* ]]; then
      continue
    fi

    if [[ "$approved_spec" != "$spec" ]]; then
      continue
    fi

    local expires
    expires="$(trim "$raw_expires")"
    if [[ -n "$expires" && "$expires" != "none" && "$today" > "$expires" ]]; then
      echo "expired approval in $ALLOWLIST_FILE (expired: $expires)"
      return 1
    fi

    local reason
    reason="$(trim "$raw_reason")"
    if [[ -z "$reason" ]]; then
      reason="approved breaking change"
    fi

    echo "$reason"
    return 0
  done < "$ALLOWLIST_FILE"

  return 1
}

echo "Comparing OpenAPI specs against ${BASE_REF} for incompatible changes"

status=0
while IFS= read -r spec; do
  if git cat-file -e "${BASE_REF}:${spec}" 2>/dev/null; then
    base_name="${spec//\//__}"
    base_file="${TMP_DIR}/${base_name}"
    git show "${BASE_REF}:${spec}" > "${base_file}"

    echo "- ${spec}"
    if ! docker run --rm \
      -v "$PWD:/work" \
      -v "$TMP_DIR:/baseline" \
      openapitools/openapi-diff:latest \
      --fail-on-incompatible \
      "/baseline/${base_name}" \
      "/work/${spec}"; then
      if approval_reason="$(get_breaking_approval "$spec")"; then
        echo "  -> approved incompatible change for ${spec}: ${approval_reason}"
      else
        status=1
      fi
    fi
  else
    echo "- ${spec} (new spec; no baseline in ${BASE_REF})"
  fi
done < <(find backend -maxdepth 2 -name openapi.yaml | sort)

if [[ "$status" -ne 0 ]]; then
  echo "Incompatible OpenAPI changes detected"
  exit "$status"
fi

echo "No incompatible OpenAPI changes detected"
