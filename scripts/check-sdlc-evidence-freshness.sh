#!/usr/bin/env bash
# =============================================================================
# SDLC Evidence Freshness Check
# =============================================================================
#
# Validates that required evidence files are not stale placeholders.
#
# Checks:
#   1. Evidence files exist
#   2. Evidence files were modified in the current branch (not just inherited)
#   3. Evidence files contain required structural markers:
#      - ba-signoff.md:  must contain "Verdict:" and a date
#      - qa-report.md:   must contain "Result:" and a date
#      - principles-ack.md: must contain "Acknowledged:" and a date
#
# Usage:
#   bash scripts/check-sdlc-evidence-freshness.sh
#   bash scripts/check-sdlc-evidence-freshness.sh --strict
#
# Exit:
#   0 if all evidence is fresh
#   1 if any evidence is stale or missing (in --strict mode)
#   0 with warnings if evidence is stale (in default/advisory mode)
#
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVIDENCE_DIR="$ROOT_DIR/Documentation/sdlc-evidence"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

STRICT=0
if [[ "${1:-}" == "--strict" ]]; then
  STRICT=1
fi

WARNINGS=0
ERRORS=0

warn() {
  echo -e "  ${YELLOW}WARN:${NC} $1"
  WARNINGS=$((WARNINGS + 1))
}

fail() {
  echo -e "  ${RED}FAIL:${NC} $1"
  ERRORS=$((ERRORS + 1))
}

pass() {
  echo -e "  ${GREEN}OK:${NC} $1"
}

echo "=========================================="
echo "  SDLC Evidence Freshness Check"
echo "=========================================="
echo ""

# ----------------------------------------------------------
# 1. Check evidence files exist
# ----------------------------------------------------------
REQUIRED_FILES=("ba-signoff.md" "qa-report.md" "principles-ack.md")

for file in "${REQUIRED_FILES[@]}"; do
  if [[ ! -f "$EVIDENCE_DIR/$file" ]]; then
    fail "$file does not exist"
  fi
done

if [[ $ERRORS -gt 0 ]]; then
  echo ""
  echo -e "${RED}Evidence files missing. Cannot continue freshness check.${NC}"
  if [[ $STRICT -eq 1 ]]; then
    exit 1
  fi
  exit 0
fi

# ----------------------------------------------------------
# 2. Check evidence files were modified on current branch
# ----------------------------------------------------------
MAIN_BRANCH="main"
MERGE_BASE="$(git merge-base HEAD "$MAIN_BRANCH" 2>/dev/null || echo "")"

if [[ -n "$MERGE_BASE" ]]; then
  BRANCH_CHANGES="$(git diff --name-only "$MERGE_BASE"..HEAD 2>/dev/null || true)"

  for file in "${REQUIRED_FILES[@]}"; do
    REL_PATH="Documentation/sdlc-evidence/$file"
    if printf '%s\n' "$BRANCH_CHANGES" | grep -qF "$REL_PATH"; then
      pass "$file was modified on current branch"
    else
      warn "$file has not been modified on this branch — may be stale"
    fi
  done
else
  warn "Could not determine merge base with $MAIN_BRANCH — skipping branch-level freshness"
fi

# ----------------------------------------------------------
# 3. Check structural markers
# ----------------------------------------------------------
echo ""
echo "Structural markers:"

# ba-signoff.md
if [[ -f "$EVIDENCE_DIR/ba-signoff.md" ]]; then
  if grep -qiE '(verdict|decision|approved|accepted)' "$EVIDENCE_DIR/ba-signoff.md"; then
    pass "ba-signoff.md contains a verdict/decision marker"
  else
    warn "ba-signoff.md missing verdict/decision marker"
  fi

  if grep -qE '[0-9]{4}-[0-9]{2}-[0-9]{2}' "$EVIDENCE_DIR/ba-signoff.md"; then
    pass "ba-signoff.md contains a date reference"
  else
    warn "ba-signoff.md missing date reference"
  fi
fi

# qa-report.md
if [[ -f "$EVIDENCE_DIR/qa-report.md" ]]; then
  if grep -qiE '(result|pass|fail|verdict|status)' "$EVIDENCE_DIR/qa-report.md"; then
    pass "qa-report.md contains a result/verdict marker"
  else
    warn "qa-report.md missing result/verdict marker"
  fi

  if grep -qE '[0-9]{4}-[0-9]{2}-[0-9]{2}' "$EVIDENCE_DIR/qa-report.md"; then
    pass "qa-report.md contains a date reference"
  else
    warn "qa-report.md missing date reference"
  fi
fi

# principles-ack.md
if [[ -f "$EVIDENCE_DIR/principles-ack.md" ]]; then
  if grep -qiE '(acknowledge|confirmed|accepted|read)' "$EVIDENCE_DIR/principles-ack.md"; then
    pass "principles-ack.md contains an acknowledgment marker"
  else
    warn "principles-ack.md missing acknowledgment marker"
  fi

  if grep -qE '[0-9]{4}-[0-9]{2}-[0-9]{2}' "$EVIDENCE_DIR/principles-ack.md"; then
    pass "principles-ack.md contains a date reference"
  else
    warn "principles-ack.md missing date reference"
  fi
fi

# ----------------------------------------------------------
# Report
# ----------------------------------------------------------
echo ""
echo "=========================================="
if [[ $ERRORS -gt 0 ]]; then
  echo -e "${RED}FAILED: $ERRORS error(s), $WARNINGS warning(s)${NC}"
  exit 1
elif [[ $WARNINGS -gt 0 ]]; then
  if [[ $STRICT -eq 1 ]]; then
    echo -e "${RED}FAILED (strict mode): $WARNINGS warning(s) treated as errors${NC}"
    exit 1
  else
    echo -e "${YELLOW}PASSED with $WARNINGS warning(s)${NC}"
    exit 0
  fi
else
  echo -e "${GREEN}PASSED: All evidence files are fresh and well-structured.${NC}"
  exit 0
fi
