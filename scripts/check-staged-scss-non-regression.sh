#!/usr/bin/env bash
# =============================================================================
# Staged SCSS Non-Regression Check
# =============================================================================
# Purpose: Inspect only added staged SCSS lines and block newly introduced
# design-system violations without failing on untouched baseline debt already
# present elsewhere in the same file.
#
# Usage:
#   bash scripts/check-staged-scss-non-regression.sh [scss-file ...]
# =============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
declare -a TARGET_FILES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      echo "Usage: bash scripts/check-staged-scss-non-regression.sh [scss-file ...]"
      exit 0
      ;;
    *)
      TARGET_FILES+=("$1")
      shift
      ;;
  esac
done

declare -a DIFF_ARGS=()
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

    rel_target="${abs_target#"$ROOT_DIR"/}"
    if [[ "$rel_target" != frontend/src/*.scss && "$rel_target" != frontend/src/**/*.scss ]]; then
      echo "WARN: Skipping non-frontend SCSS file $target"
      continue
    fi

    DIFF_ARGS+=("$rel_target")
  done
fi

DIFF_OUTPUT=""
if [[ ${#DIFF_ARGS[@]} -gt 0 ]]; then
  DIFF_OUTPUT="$(git diff --cached --unified=0 --no-color -- "${DIFF_ARGS[@]}" || true)"
else
  DIFF_OUTPUT="$(git diff --cached --unified=0 --no-color -- 'frontend/src/**/*.scss' 'frontend/src/*.scss' || true)"
fi

if [[ -z "$DIFF_OUTPUT" ]]; then
  echo "=========================================="
  echo "  Staged SCSS Non-Regression Check"
  echo "=========================================="
  echo ""
  echo "PASSED: No staged SCSS additions to inspect."
  echo ""
  exit 0
fi

ERRORS=0
WARNINGS=0
REPORT=""
current_file=""
new_line=0
exclude_file=0

should_skip_file() {
  case "$1" in
    *login.page.scss|*default-preset*|*previews/*|*advanced-css-governance*|*/styles.scss)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

record_error() {
  local message="$1"
  REPORT="${REPORT}${current_file}:${new_line}: ERROR - ${message}\n"
  ERRORS=$((ERRORS + 1))
}

record_warning() {
  local message="$1"
  REPORT="${REPORT}${current_file}:${new_line}: WARN - ${message}\n"
  WARNINGS=$((WARNINGS + 1))
}

while IFS= read -r line; do
  case "$line" in
    "+++ b/"*)
      current_file="${line#+++ b/}"
      exclude_file=0
      if should_skip_file "$current_file"; then
        exclude_file=1
      fi
      ;;
    "@@"*)
      new_line="$(printf '%s' "$line" | sed -E 's/^@@ -[0-9]+(,[0-9]+)? \+([0-9]+)(,[0-9]+)? @@.*$/\2/')"
      ;;
    "+"*)
      if [[ "$line" == "+++"* || "$exclude_file" -eq 1 ]]; then
        continue
      fi

      content="${line#+}"
      trimmed="$(printf '%s' "$content" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"

      if printf '%s' "$trimmed" | grep -qE '^//'; then
        new_line=$((new_line + 1))
        continue
      fi

      if printf '%s' "$content" | grep -qE '#[0-9a-fA-F]{3,8}' \
        && ! printf '%s' "$content" | grep -qE 'var\(--[a-zA-Z].*,\s*#[0-9a-fA-F]{3,8}' \
        && ! printf '%s' "$content" | grep -qE 'var\(--tp-|var\(--nm-' \
        && ! printf '%s' "$content" | grep -qE '/\*'; then
        record_error "new hardcoded hex color added"
      fi

      if printf '%s' "$content" | grep -qE 'rgba\(0'; then
        record_error "new hardcoded rgba(0,0,0,...) added"
      fi

      if printf '%s' "$content" | grep -qE 'transition:.*all'; then
        record_error "new transition: all added"
      fi

      if printf '%s' "$content" | grep -qE 'font-size:.*px' && ! printf '%s' "$content" | grep -qE 'var\('; then
        record_error "new hardcoded px font-size added"
      fi

      if printf '%s' "$content" | grep -qE 'background[^;]*var\(--tp-white\)'; then
        record_error "new var(--tp-white) background added"
      fi

      if printf '%s' "$content" | grep -qE '#2563eb|#0d6efd|#e5e7eb|#f3f4f6|#6b7280|#f9fafb'; then
        record_error "new external framework color added"
      fi

      if printf '%s' "$content" | grep -qE 'var\(--p-green|var\(--p-red|var\(--p-orange|var\(--p-surface|var\(--p-text'; then
        record_error "new PrimeNG token leakage added"
      fi

      if printf '%s' "$content" | grep -qE 'border-radius:' \
        && ! printf '%s' "$content" | grep -qE 'var\(--nm-radius|50%|inherit|0;|0 0'; then
        record_warning "new hardcoded border-radius added"
      fi

      new_line=$((new_line + 1))
      ;;
  esac
done <<< "$DIFF_OUTPUT"

echo "=========================================="
echo "  Staged SCSS Non-Regression Check"
echo "=========================================="
echo ""

if [[ $ERRORS -eq 0 && $WARNINGS -eq 0 ]]; then
  echo "PASSED: No new staged SCSS design-system violations introduced."
  echo ""
  exit 0
fi

if [[ -n "$REPORT" ]]; then
  printf "$REPORT"
  echo ""
fi

echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"

if [[ $ERRORS -gt 0 ]]; then
  exit 1
fi

exit 0
