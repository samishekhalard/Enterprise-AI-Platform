#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ALLOWLIST="${ROOT_DIR}/scripts/transport-security-allowlist.txt"
TMP_CURRENT="$(mktemp)"
TMP_NEW="$(mktemp)"
TMP_RESOLVED="$(mktemp)"
trap 'rm -f "${TMP_CURRENT}" "${TMP_NEW}" "${TMP_RESOLVED}"' EXIT

fail() {
  echo "[FAIL] $1" >&2
  exit 1
}

pass() {
  echo "[PASS] $1"
}

if [[ ! -f "${ALLOWLIST}" ]]; then
  fail "Allowlist not found: ${ALLOWLIST}"
fi

cd "${ROOT_DIR}"

# Transport-security anti-patterns:
# - Plain HTTP in runtime config files
# - Explicit HTTPS-strict bypass flags for Keycloak
grep -rn -E \
  "http://|KC_HOSTNAME_STRICT_HTTPS:\\s*\"false\"|KC_HTTP_ENABLED:\\s*\"true\"" \
  backend/*/src/main/resources/application*.yml \
  docker-compose*.yml \
  frontend/src/environments/*.ts \
  2>/dev/null | sort > "${TMP_CURRENT}" || true

sort "${ALLOWLIST}" > "${ALLOWLIST}.sorted"
mv "${ALLOWLIST}.sorted" "${ALLOWLIST}"

comm -23 "${TMP_CURRENT}" "${ALLOWLIST}" > "${TMP_NEW}" || true
comm -13 "${TMP_CURRENT}" "${ALLOWLIST}" > "${TMP_RESOLVED}" || true

current_count="$(wc -l < "${TMP_CURRENT}" | tr -d ' ')"
baseline_count="$(wc -l < "${ALLOWLIST}" | tr -d ' ')"

echo "== Transport Security Baseline =="
echo "Current findings  : ${current_count}"
echo "Allowlist baseline: ${baseline_count}"

if [[ -s "${TMP_NEW}" ]]; then
  echo ""
  echo "New transport-security violations detected (not in allowlist):" >&2
  cat "${TMP_NEW}" >&2
  echo "" >&2
  echo "If this is intentional debt, update scripts/transport-security-allowlist.txt in the same change." >&2
  fail "Net-new insecure transport entries are not allowed."
fi

if [[ -s "${TMP_RESOLVED}" ]]; then
  pass "Some allowlisted entries were removed from current config. Consider cleaning allowlist:"
  cat "${TMP_RESOLVED}"
else
  pass "No net-new insecure transport entries."
fi

