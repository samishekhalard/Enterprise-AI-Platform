#!/usr/bin/env bash
# =============================================================================
# Spacing Scale Lint Script
# =============================================================================
# Purpose: Scan SCSS files for spacing values NOT in the canonical 4px-base scale.
#
# Canonical values (allowed):
#   0, 0.25rem, 0.5rem, 0.75rem, 1rem, 1.25rem, 1.5rem, 2rem, 2.5rem, 3rem, 4rem
#   Any var(--tp-space-*) reference
#
# Properties checked:
#   margin, padding, gap, row-gap, column-gap (and directional variants)
#
# Exit code:
#   0 if no warnings, or if warnings exist in warning mode
#   1 if warnings exist and --fail-on-warnings is set
#
# Usage:
#   bash scripts/check-spacing-scale.sh
#   bash scripts/check-spacing-scale.sh --fail-on-warnings frontend/src/app/example.component.scss
#   npm run check:spacing-scale   (from frontend/)
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCAN_DIR="$ROOT_DIR/frontend/src"
FAIL_ON_WARNINGS=0
declare -a TARGET_FILES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --fail-on-warnings|--strict)
      FAIL_ON_WARNINGS=1
      shift
      ;;
    -h|--help)
      echo "Usage: bash scripts/check-spacing-scale.sh [--fail-on-warnings] [scss-file ...]"
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

is_canonical_spacing() {
  case "$1" in
    0|0px|0.25rem|0.5rem|0.75rem|1rem|1.25rem|1.5rem|2rem|2.5rem|3rem|4rem|auto|inherit|initial|unset|revert)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

# Properties to check (grep pattern)
SPACING_PROPS='(margin|padding|gap|row-gap|column-gap|margin-top|margin-right|margin-bottom|margin-left|margin-inline|margin-block|margin-inline-start|margin-inline-end|margin-block-start|margin-block-end|padding-top|padding-right|padding-bottom|padding-left|padding-inline|padding-block|padding-inline-start|padding-inline-end|padding-block-start|padding-block-end)'

# ----------------------------------------------------------
# Scan SCSS files
# ----------------------------------------------------------
WARNING_COUNT=0
WARNINGS=""
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
  echo "  Spacing Scale Lint Report"
  echo "=========================================="
  echo ""
  echo "PASSED: No SCSS files to scan."
  echo ""
  exit 0
fi

for file in "${FILES_TO_SCAN[@]}"; do
  while IFS= read -r line; do
    line_no="${line%%:*}"
    content="${line#*:}"

    # Strip leading/trailing whitespace
    trimmed="$(printf '%s' "$content" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"

    # Skip comment lines
    if printf '%s' "$trimmed" | grep -qE '^\s*//'; then
      continue
    fi

    # Skip lines using CSS custom properties (var(--tp-space-*))
    if printf '%s' "$content" | grep -qE 'var\(--tp-space-'; then
      continue
    fi

    # Skip lines using calc(), min(), max(), clamp() — complex expressions
    if printf '%s' "$content" | grep -qE '(calc|min|max|clamp)\('; then
      continue
    fi

    # Skip shorthand 'none', '0 auto', etc. that are not raw spacing
    if printf '%s' "$content" | grep -qE ':\s*none\s*;'; then
      continue
    fi

    # Extract the value part after the colon
    value_part="$(printf '%s' "$content" | sed -E 's/.*:\s*//; s/\s*;?\s*$//')"

    # Skip if value contains var() (any custom property)
    if printf '%s' "$value_part" | grep -qE 'var\('; then
      continue
    fi

    # Split multi-value shorthand (e.g., "0.5rem 1rem 0.5rem 1rem")
    for val in $value_part; do
      # Normalize: strip trailing semicolons, exclamation marks (!important)
      val="$(printf '%s' "$val" | sed -E 's/;$//; s/!important$//')"

      # Skip empty values
      [[ -z "$val" ]] && continue

      # Skip CSS keywords
      if [[ "$val" == "auto" || "$val" == "inherit" || "$val" == "initial" || "$val" == "unset" || "$val" == "revert" || "$val" == "none" ]]; then
        continue
      fi

      # Skip negative values of canonical spacing (e.g., -0.5rem)
      check_val="$val"
      if [[ "$val" == -* ]]; then
        check_val="${val#-}"
      fi

      # Check if this value is in the canonical scale
      if ! is_canonical_spacing "$check_val"; then
        # Only warn about rem/px/em values (not percentages, vh, vw, etc.)
        if printf '%s' "$val" | grep -qE '^-?[0-9]+(\.[0-9]+)?(rem|px|em)$'; then
          rel_file="${file#"$ROOT_DIR"/}"
          WARNINGS="${WARNINGS}${rel_file}:${line_no}: WARNING - non-standard spacing \"${val}\", use var(--tp-space-*) instead\n"
          WARNING_COUNT=$((WARNING_COUNT + 1))
        fi
      fi
    done
  done < <(grep -nE "^\s*${SPACING_PROPS}\s*:" "$file" 2>/dev/null || true)
done

# ----------------------------------------------------------
# Report results
# ----------------------------------------------------------
echo "=========================================="
echo "  Spacing Scale Lint Report"
echo "=========================================="
echo ""

if [[ $WARNING_COUNT -eq 0 ]]; then
  echo "PASSED: All spacing values conform to the canonical 4px-base scale."
else
  if [[ $FAIL_ON_WARNINGS -eq 1 ]]; then
    echo "FAILED: Found $WARNING_COUNT non-standard spacing value(s)."
  else
    echo "WARNINGS: Found $WARNING_COUNT non-standard spacing value(s)."
  fi
  echo ""
  printf "$WARNINGS"
  echo ""
  echo "Canonical scale: 0, 0.25rem, 0.5rem, 0.75rem, 1rem, 1.25rem, 1.5rem, 2rem, 2.5rem, 3rem, 4rem"
  echo "Or use tokens: var(--tp-space-0) through var(--tp-space-16)"
  echo "See docs/design-system/foundations/spacing.md for the full scale."
fi

echo ""
echo "Total non-standard spacing warnings: $WARNING_COUNT"
if [[ $WARNING_COUNT -gt 0 && $FAIL_ON_WARNINGS -eq 1 ]]; then
  exit 1
fi
exit 0
