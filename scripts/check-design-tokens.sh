#!/usr/bin/env bash
# =============================================================================
# Design Token Lint Script
# =============================================================================
# Purpose: Scan ALL component SCSS files under frontend/src/ for hardcoded hex
#          colors NOT wrapped in var(--tp-*) or var(--nm-*) or legitimate CSS
#          functions (e.g., var() fallback).
#
# Exit code: 0 if no violations, 1 if violations found.
#
# Usage:
#   bash scripts/check-design-tokens.sh
#   npm run check:design-tokens   (from frontend/)
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCAN_DIR="$ROOT_DIR/frontend/src"
ALLOWLIST_FILE="$ROOT_DIR/scripts/design-token-allowlist.txt"
declare -a TARGET_FILES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      echo "Usage: bash scripts/check-design-tokens.sh [scss-file ...]"
      exit 0
      ;;
    *)
      TARGET_FILES+=("$1")
      shift
      ;;
  esac
done

if [[ ! -d "$SCAN_DIR" ]]; then
  echo "ERROR: frontend/src directory not found at $SCAN_DIR"
  exit 1
fi

if [[ ! -f "$ALLOWLIST_FILE" ]]; then
  echo "WARNING: Allowlist not found at $ALLOWLIST_FILE — no exceptions will be applied."
  ALLOWLIST_FILE=""
fi

ALLOWLIST_CONTENT=""
if [[ -n "$ALLOWLIST_FILE" ]]; then
  ALLOWLIST_CONTENT="$(grep -E '^\s*#[0-9a-fA-F]{3,8}\s*$' "$ALLOWLIST_FILE" 2>/dev/null | tr '[:upper:]' '[:lower:]' || true)"
fi

declare -a FILES_TO_SCAN=()
if [[ ${#TARGET_FILES[@]} -gt 0 ]]; then
  for target in "${TARGET_FILES[@]}"; do
    if [[ "$target" == /* ]]; then
      abs_target="$target"
    else
      abs_target="$ROOT_DIR/$target"
    fi

    if [[ ! -f "$abs_target" ]]; then
      echo "WARN: Skipping missing file $target"
      continue
    fi

    if [[ "$abs_target" != "$SCAN_DIR"/* ]]; then
      echo "WARN: Skipping non-frontend source file $target"
      continue
    fi

    if [[ "$abs_target" != *.scss ]]; then
      echo "WARN: Skipping non-SCSS file $target"
      continue
    fi

    FILES_TO_SCAN+=("$abs_target")
  done
else
  while IFS= read -r -d '' file; do
    FILES_TO_SCAN+=("$file")
  done < <(find "$SCAN_DIR" -type f -name '*.scss' -print0)
fi

if [[ ${#FILES_TO_SCAN[@]} -eq 0 ]]; then
  echo "=========================================="
  echo "  Design Token Lint Report"
  echo "=========================================="
  echo ""
  echo "PASSED: No SCSS files to scan."
  echo ""
  exit 0
fi

# ----------------------------------------------------------
# Scan SCSS files for hex color patterns
# ----------------------------------------------------------
VIOLATION_COUNT=0
VIOLATIONS=""

for file in "${FILES_TO_SCAN[@]}"; do
  while IFS= read -r line; do
    # Parse file:linenum:content
    parsed_file="${line%%:*}"
    rest="${line#*:}"
    line_no="${rest%%:*}"
    content="${rest#*:}"

    # Strip leading/trailing whitespace for comparison
    trimmed="$(printf '%s' "$content" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"

    # Skip comment lines (SCSS single-line comments)
    if printf '%s' "$trimmed" | grep -qE '^\s*//'; then
      continue
    fi

    # Source-of-truth token declarations are allowed to use literal values.
    if printf '%s' "$trimmed" | grep -qE '^--[a-zA-Z0-9-]+\s*:'; then
      continue
    fi

    # Skip lines inside var() fallback — e.g., var(--tp-white, #fff)
    # Pattern: hex value appears after a comma inside var(...)
    if printf '%s' "$content" | grep -qE 'var\(--[a-zA-Z].*,\s*#[0-9a-fA-F]{3,8}'; then
      continue
    fi

    # Skip lines that are SCSS variable definitions using tokens
    # e.g., $some-var: var(--tp-something);
    if printf '%s' "$content" | grep -qE 'var\(--tp-|var\(--nm-'; then
      continue
    fi

    # Extract the hex value(s) from the line
    hex_values="$(printf '%s' "$content" | grep -oE '#[0-9a-fA-F]{3,8}' || true)"

    if [[ -z "$hex_values" ]]; then
      continue
    fi

    while IFS= read -r hex_val; do
      # Normalize to lowercase for allowlist comparison
      hex_lower="$(printf '%s' "$hex_val" | tr '[:upper:]' '[:lower:]')"

      # Check allowlist
      if [[ -n "$ALLOWLIST_CONTENT" ]] && printf '%s\n' "$ALLOWLIST_CONTENT" | grep -Fxq "$hex_lower"; then
        continue
      fi

      # Make path relative to project root for cleaner output
      rel_file="${parsed_file#"$ROOT_DIR"/}"

      VIOLATIONS="${VIOLATIONS}${rel_file}:${line_no}: VIOLATION - found \"${hex_val}\", use var(--tp-*) token instead\n"
      VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
    done <<< "$hex_values"

  done < <(grep -nH -E '#[0-9a-fA-F]{3,8}' "$file" 2>/dev/null || true)
done

# ----------------------------------------------------------
# Report results
# ----------------------------------------------------------
echo "=========================================="
echo "  Design Token Lint Report"
echo "=========================================="
echo ""

if [[ $VIOLATION_COUNT -eq 0 ]]; then
  echo "PASSED: No hardcoded hex color violations found."
  echo ""
  exit 0
else
  echo "FAILED: Found $VIOLATION_COUNT violation(s)."
  echo ""
  printf "$VIOLATIONS"
  echo ""
  echo "Fix: Replace hardcoded hex colors with var(--tp-*) or var(--nm-*) tokens."
  echo "     See docs/design-system/foundations/color.md for the token reference."
  echo ""
  echo "If a hex value is a legitimate exception, add it to:"
  echo "  scripts/design-token-allowlist.txt"
  echo ""
  exit 1
fi
