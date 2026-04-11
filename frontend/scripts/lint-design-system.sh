#!/usr/bin/env bash
# =============================================================================
# Design System Lint Script
# =============================================================================
# Purpose: Scan SCSS files for design system violations before commit/merge.
#          Ensures all component styles use design tokens instead of hardcoded
#          values, and enforces design system conventions.
#
# Exit code: 0 if no violations, 1 if violations found.
#
# Usage:
#   bash scripts/lint-design-system.sh
#   npm run lint:design-system   (from frontend/)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$FRONTEND_DIR/src/app"
EXCLUDE="login.page"
ROOT_DIR="$(cd "$FRONTEND_DIR/.." && pwd)"
declare -a TARGET_FILES=()
declare -a FILES_TO_SCAN=()

ERRORS=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      echo "Usage: bash scripts/lint-design-system.sh [scss-file ...]"
      exit 0
      ;;
    *)
      TARGET_FILES+=("$1")
      shift
      ;;
  esac
done

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

    if [[ "$abs_target" != "$SRC"/* ]]; then
      echo "WARN: Skipping non-frontend app file $target"
      continue
    fi

    if [[ "$abs_target" != *.scss ]]; then
      echo "WARN: Skipping non-SCSS file $target"
      continue
    fi

    FILES_TO_SCAN+=("$abs_target")
  done
fi

grep_targets() {
  local pattern="$1"

  if [[ ${#FILES_TO_SCAN[@]} -gt 0 ]]; then
    grep -nH -E "$pattern" "${FILES_TO_SCAN[@]}" 2>/dev/null || true
  else
    grep -rnE "$pattern" "$SRC" --include="*.scss" 2>/dev/null || true
  fi
}

echo "=========================================="
echo "  Design System Lint"
echo "=========================================="
echo ""

# ----------------------------------------------------------
# 1. No hardcoded hex colors in SCSS (except in variable
#    declarations, var() fallbacks, comments, spec files)
# ----------------------------------------------------------
echo "Checking for hardcoded hex colors..."
HARDCODED=$(grep_targets '#[0-9a-fA-F]{3,8}' \
  | grep -v "$EXCLUDE" \
  | grep -v '\-\-tp-\|--nm-\|--p-' \
  | grep -v 'var(' \
  | grep -v '^\s*//' \
  | grep -v '/\*' \
  | grep -v '\.spec\.' \
  | grep -v 'previews/' \
  | grep -v 'default-preset' \
  | grep -v 'advanced-css-governance' \
  || true)
if [ -n "$HARDCODED" ]; then
  echo "FAIL: Hardcoded hex colors found (use design tokens):"
  echo "$HARDCODED"
  ERRORS=$((ERRORS + 1))
fi

# ----------------------------------------------------------
# 2. No rgba(0, 0, 0, *) -- must use rgba(var(--nm-black-rgb), *)
# ----------------------------------------------------------
echo "Checking for hardcoded rgba(0,0,0)..."
RGBA=$(grep_targets 'rgba\(0' \
  | grep -v "$EXCLUDE" \
  | grep -v '^\s*//' \
  | grep -v 'default-preset' \
  || true)
if [ -n "$RGBA" ]; then
  echo "FAIL: Hardcoded rgba(0,0,0) found (use var(--nm-black-rgb)):"
  echo "$RGBA"
  ERRORS=$((ERRORS + 1))
fi

# ----------------------------------------------------------
# 3. No transition: all (must specify individual properties)
# ----------------------------------------------------------
echo "Checking for transition: all..."
TRANS=$(grep_targets 'transition:.*all' \
  | grep -v "$EXCLUDE" \
  | grep -v '^\s*//' \
  || true)
if [ -n "$TRANS" ]; then
  echo "FAIL: transition: all found (specify properties explicitly):"
  echo "$TRANS"
  ERRORS=$((ERRORS + 1))
fi

# ----------------------------------------------------------
# 4. No font-size with hardcoded px (must use rem or var(--tp-font-*))
# ----------------------------------------------------------
echo "Checking for hardcoded px font-sizes..."
PX_FONT=$(grep_targets 'font-size:.*px' \
  | grep -v "$EXCLUDE" \
  | grep -v 'var(' \
  | grep -v '^\s*//' \
  | grep -v '/\*.*[Ee]xception' \
  | grep -v 'default-preset' \
  || true)
if [ -n "$PX_FONT" ]; then
  echo "FAIL: Hardcoded px font-sizes found (use rem or --tp-font-* tokens):"
  echo "$PX_FONT"
  ERRORS=$((ERRORS + 1))
fi

# ----------------------------------------------------------
# 5. No var(--tp-white) as background (only for text/foreground)
# ----------------------------------------------------------
echo "Checking for var(--tp-white) as background..."
WHITE_BG=$(grep_targets 'background.*var\(--tp-white\)' \
  | grep -v "$EXCLUDE" \
  | grep -v '^\s*//' \
  || true)
if [ -n "$WHITE_BG" ]; then
  echo "FAIL: var(--tp-white) used as background (use var(--tp-surface-raised)):"
  echo "$WHITE_BG"
  ERRORS=$((ERRORS + 1))
fi

# ----------------------------------------------------------
# 6. No Bootstrap/Tailwind colors
# ----------------------------------------------------------
echo "Checking for Bootstrap/Tailwind colors..."
EXTERNAL=$(grep_targets '#2563eb|#0d6efd|#e5e7eb|#f3f4f6|#6b7280|#f9fafb' \
  | grep -v "$EXCLUDE" \
  | grep -v '^\s*//' \
  || true)
if [ -n "$EXTERNAL" ]; then
  echo "FAIL: External framework colors found (use design tokens):"
  echo "$EXTERNAL"
  ERRORS=$((ERRORS + 1))
fi

# ----------------------------------------------------------
# 7. No PrimeNG semantic tokens used directly
#    (should go through --tp-* or --nm-* tokens)
# ----------------------------------------------------------
echo "Checking for PrimeNG token leakage..."
PRIMENG=$(grep_targets 'var\(--p-green|var\(--p-red|var\(--p-orange|var\(--p-surface|var\(--p-text' \
  | grep -v "$EXCLUDE" \
  | grep -v '^\s*//' \
  | grep -v 'default-preset' \
  || true)
if [ -n "$PRIMENG" ]; then
  echo "FAIL: PrimeNG tokens used directly (use --tp-* tokens):"
  echo "$PRIMENG"
  ERRORS=$((ERRORS + 1))
fi

# ----------------------------------------------------------
# 8. Hardcoded border-radius (warning only)
# ----------------------------------------------------------
echo "Checking for hardcoded border-radius..."
RADIUS=$(grep_targets 'border-radius:' \
  | grep -v "$EXCLUDE" \
  | grep -v 'var(--nm-radius' \
  | grep -v '50%' \
  | grep -v 'inherit' \
  | grep -v '0;' \
  | grep -v '0 0' \
  | grep -v '^\s*//' \
  | grep -v '\.spec\.' \
  | grep -v 'default-preset' \
  || true)
if [ -n "$RADIUS" ]; then
  RADIUS_COUNT=$(echo "$RADIUS" | wc -l | tr -d ' ')
  echo "WARN: Hardcoded border-radius values (prefer var(--nm-radius-*)):"
  echo "$RADIUS" | head -10
  if [ "$RADIUS_COUNT" -gt 10 ]; then
    echo "  ... ($RADIUS_COUNT total)"
  fi
fi

# ----------------------------------------------------------
# Summary
# ----------------------------------------------------------
echo ""
if [ $ERRORS -gt 0 ]; then
  echo "FAILED: Design system lint found $ERRORS violation(s)."
  echo ""
  echo "Fix: Replace hardcoded values with design tokens."
  echo "     See styles.scss :root for the full token reference."
  exit 1
else
  echo "PASSED: Design system lint completed with no violations."
  exit 0
fi
