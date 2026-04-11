#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESIGN_SYSTEM_DIR="$ROOT_DIR/Documentation/design-system"
GLOBAL_CONTRACT="$DESIGN_SYSTEM_DIR/DESIGN-SYSTEM-CONTRACT.md"
GLOBAL_CHECKLIST="$DESIGN_SYSTEM_DIR/COMPLIANCE-CHECKLIST.md"

REQUIRED_GLOBAL_CONTRACT_PHRASE="Rules that apply across multiple features must be defined only under"
REQUIRED_CHECKLIST_PHRASE="Feature docs under"
REQUIRED_FEATURE_SCOPE_PHRASE="Feature-only supplement"
REQUIRED_FEATURE_GOVERNANCE_PHRASE="does not redefine repo-wide"
REQUIRED_FEATURE_LINK_PHRASE="Documentation/design-system"

FORBIDDEN_FEATURE_PATTERNS=(
  "SINGLE ENTRY POINT"
  "^## Reading Order"
  "^### Token Namespace"
  "^### Color Palette"
  "^### Spacing Scale"
  "^### Breakpoints"
  "^### CSS Architecture Layers"
)

ERRORS=0

relpath() {
  local path="$1"
  printf '%s\n' "${path#"$ROOT_DIR"/}"
}

fail() {
  printf 'FAIL: %s\n' "$1"
  ERRORS=$((ERRORS + 1))
}

extract_doc_status() {
  local file="$1"
  local status
  status="$(grep -m1 -E '^\*\*Status:\*\* \[[^]]+\]' "$file" | sed -E 's#^\*\*Status:\*\* \[([^]]+)\].*#\1#' || true)"
  printf '%s\n' "$status"
}

echo "=========================================="
echo "  Design Doc Governance Check"
echo "=========================================="
echo ""

if [[ ! -f "$GLOBAL_CONTRACT" ]]; then
  fail "Missing global contract: $(relpath "$GLOBAL_CONTRACT")"
fi

if [[ ! -f "$GLOBAL_CHECKLIST" ]]; then
  fail "Missing global checklist: $(relpath "$GLOBAL_CHECKLIST")"
fi

if [[ -f "$GLOBAL_CONTRACT" ]] && ! grep -q "$REQUIRED_GLOBAL_CONTRACT_PHRASE" "$GLOBAL_CONTRACT"; then
  fail "$(relpath "$GLOBAL_CONTRACT") must declare that repo-wide rules live only under Documentation/design-system/"
fi

if [[ -f "$GLOBAL_CHECKLIST" ]] && ! grep -q "$REQUIRED_CHECKLIST_PHRASE" "$GLOBAL_CHECKLIST"; then
  fail "$(relpath "$GLOBAL_CHECKLIST") must declare that feature docs are overlays only"
fi

if [[ -f "$GLOBAL_CONTRACT" ]]; then
  echo "Checking design-system contract index status alignment..."
  while IFS= read -r line; do
    rel_target="$(printf '%s\n' "$line" | sed -E 's#.*\(\./([^)]*)\).*#\1#')"
    contract_status="$(printf '%s\n' "$line" | sed -E 's#.*-- \[([^]]+)\].*#\1#')"
    target_file="$DESIGN_SYSTEM_DIR/$rel_target"

    if [[ ! -f "$target_file" ]]; then
      fail "$(relpath "$GLOBAL_CONTRACT") references missing design-system file: Documentation/design-system/$rel_target"
      continue
    fi

    source_status="$(extract_doc_status "$target_file")"
    if [[ -z "$source_status" ]]; then
      fail "$(relpath "$target_file") is missing a '**Status:** [..]' declaration"
      continue
    fi

    if [[ "$contract_status" != "$source_status" ]]; then
      fail "$(relpath "$GLOBAL_CONTRACT") status [$contract_status] does not match $(relpath "$target_file") status [$source_status]"
    fi
  done < <(grep -E '^- \[.+\]\(\./(foundations|blocks|patterns|components|technical)/.+\) -- \[[^]]+\]$' "$GLOBAL_CONTRACT")
fi

FEATURE_DOCS=()
while IFS= read -r -d '' file; do
  FEATURE_DOCS+=("$file")
done < <(
  find "$ROOT_DIR/Documentation/.Requirements" -type f \
    \( -name '*UI-Spec-v*.md' -o -name '*Design-System-Validation-v*.md' -o -name '*Angular-Test-Strategy-v*.md' -o -name '*CI-Quality-Gates-v*.md' \) \
    -print0 2>/dev/null || true
)

if [[ ${#FEATURE_DOCS[@]} -eq 0 ]]; then
  echo "INFO: No feature overlay docs were found under Documentation/.Requirements/."
else
  for doc in "${FEATURE_DOCS[@]}"; do
    rel_doc="$(relpath "$doc")"

    if ! grep -q "$REQUIRED_FEATURE_SCOPE_PHRASE" "$doc"; then
      fail "$rel_doc is missing the required feature-only scope marker"
    fi

    if ! grep -q "$REQUIRED_FEATURE_GOVERNANCE_PHRASE" "$doc"; then
      fail "$rel_doc must state that it does not redefine repo-wide governance"
    fi

    if ! grep -q "$REQUIRED_FEATURE_LINK_PHRASE" "$doc"; then
      fail "$rel_doc must link back to Documentation/design-system/"
    fi

    for pattern in "${FORBIDDEN_FEATURE_PATTERNS[@]}"; do
      if grep -Eq "$pattern" "$doc"; then
        fail "$rel_doc duplicates global design-system contract content matching pattern: $pattern"
      fi
    done
  done
fi

echo ""
if [[ $ERRORS -gt 0 ]]; then
  echo "FAILED: Design doc governance found $ERRORS issue(s)."
  exit 1
fi

echo "PASSED: Global design-system hierarchy and feature overlays are aligned."
