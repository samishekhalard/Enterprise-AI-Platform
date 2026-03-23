#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARC42_DIR="${ROOT_DIR}/docs/arc42"

required_arc42_files=(
  "README.md"
  "01-introduction-goals.md"
  "02-constraints.md"
  "03-context-scope.md"
  "04-solution-strategy.md"
  "05-building-blocks.md"
  "06-runtime-view.md"
  "07-deployment-view.md"
  "08-crosscutting.md"
  "09-architecture-decisions.md"
  "10-quality-requirements.md"
  "11-risks-technical-debt.md"
  "12-glossary.md"
)

fail() {
  echo "[FAIL] $1" >&2
  exit 1
}

pass() {
  echo "[PASS] $1"
}

warn() {
  echo "[WARN] $1"
}

echo "== Docs Consistency Validation =="

# 1) arc42 required files must exist.
for file in "${required_arc42_files[@]}"; do
  if [[ ! -f "${ARC42_DIR}/${file}" ]]; then
    fail "Missing required arc42 file: ${file}"
  fi
done
pass "All required arc42 files exist"

# 2) arc42 directory must not contain extra markdown files.
existing_files_sorted="$(find "${ARC42_DIR}" -maxdepth 1 -type f -name "*.md" -exec basename {} \; | sort)"
expected_files_sorted="$(printf '%s\n' "${required_arc42_files[@]}" | sort)"

extras="$(comm -23 <(printf '%s\n' "${existing_files_sorted}") <(printf '%s\n' "${expected_files_sorted}") || true)"
if [[ -n "${extras}" ]]; then
  fail "Unexpected markdown file(s) in docs/arc42: ${extras}"
fi
pass "No extra markdown files in docs/arc42"

# 3) Canonical architecture constraints must be present.
grep -qE "Polyglot Persistence \(Neo4j \+ PostgreSQL\)" "${ARC42_DIR}/02-constraints.md" \
  || fail "Missing polyglot persistence constraint in 02-constraints.md (TC-01)"
grep -qE "Provider-Agnostic Authentication with Keycloak Default" "${ARC42_DIR}/02-constraints.md" \
  || fail "Missing provider-agnostic auth with Keycloak default constraint in 02-constraints.md"
grep -qE "PostgreSQL for Domain Services \+ Keycloak" "${ARC42_DIR}/02-constraints.md" \
  || fail "Missing PostgreSQL for domain services + Keycloak constraint in 02-constraints.md (TC-06)"
pass "Canonical constraints are present in 02-constraints.md"

# 4) Detect known contradictory legacy phrasing in arc42 docs.
#    Under ADR-016 polyglot persistence, PostgreSQL for domain services is correct.
#    These patterns indicate outdated Neo4j-only or pre-polyglot language.
legacy_patterns=(
  "Neo4j is the single EMS application database"
  "PostgreSQL is reserved for Keycloak internal persistence"
  "PostgreSQL for Keycloak Internal Data Only"
  "Neo4j 5.x (Single Application Database)"
  "Keycloak-only standard retained for current delivery scope"
)

for pattern in "${legacy_patterns[@]}"; do
  if grep -RInE "${pattern}" "${ARC42_DIR}" >/dev/null; then
    fail "Found contradictory legacy phrase in arc42: ${pattern}"
  fi
done
pass "No contradictory legacy architecture phrases detected"

# 5) Ensure docs index reflects current auth posture.
grep -qE "Auth-facade supports multiple providers; Keycloak is the default provider" "${ROOT_DIR}/docs/README.md" \
  || fail "docs/README.md is missing current auth posture statement"
pass "docs/README.md includes current auth posture"

# 6) Ensure architecture baseline is explicitly captured in decision index.
grep -qE "Polyglot persistence" "${ARC42_DIR}/09-architecture-decisions.md" \
  || fail "Missing polyglot persistence baseline statement in 09-architecture-decisions.md"
grep -qE "PostgreSQL for relational domain services" "${ARC42_DIR}/09-architecture-decisions.md" \
  || fail "Missing PostgreSQL for domain services baseline statement in 09-architecture-decisions.md"
pass "Architecture baseline is explicit in 09-architecture-decisions.md"

# 7) Polyglot persistence verification (ADR-016).
# Under polyglot persistence, domain services SHOULD use PostgreSQL and auth-facade SHOULD use Neo4j.
# This check confirms the expected baseline rather than treating PostgreSQL as drift.
impl_postgres_refs="$(grep -rn "jdbc:postgresql" "${ROOT_DIR}/backend"/*/src/main/resources/application*.yml 2>/dev/null | grep -v "/backend/auth-facade/" || true)"
if [[ -n "${impl_postgres_refs}" ]]; then
  pass "Polyglot persistence confirmed: domain services use PostgreSQL as expected (ADR-016)"
else
  warn "No PostgreSQL datasource references found in domain services — expected under polyglot persistence baseline"
fi

# Verify auth-facade uses Neo4j (not PostgreSQL)
auth_neo4j_ref="$(grep -rnE "neo4j://|bolt://|spring\.neo4j" "${ROOT_DIR}/backend/auth-facade/src/main/resources/application"*.yml 2>/dev/null || true)"
if [[ -n "${auth_neo4j_ref}" ]]; then
  pass "auth-facade uses Neo4j as expected (ADR-016)"
else
  warn "auth-facade does not reference Neo4j — verify configuration"
fi

echo "All documentation consistency checks passed."
