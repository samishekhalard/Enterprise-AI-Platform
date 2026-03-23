#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${1:-frontend}"
FEATURES_DIR="$ROOT_DIR/$FRONTEND_DIR/src/app/features"

if [[ ! -d "$FEATURES_DIR" ]]; then
  echo "Layout contract check skipped: $FEATURES_DIR not found"
  exit 0
fi

PAGE_TEMPLATES=()
while IFS= read -r template; do
  PAGE_TEMPLATES+=("$template")
done < <(find "$FEATURES_DIR" -type f -name "*.page.html" | sort)

if [[ ${#PAGE_TEMPLATES[@]} -eq 0 ]]; then
  echo "Layout contract check skipped: no *.page.html files found under $FEATURES_DIR"
  exit 0
fi

missing=()
# Use rg if available, fall back to grep
_search() { command -v rg &>/dev/null && rg -q "$1" "$2" || grep -q "$1" "$2"; }

is_exempt_template() {
  local template="$1"
  case "$template" in
    # Chromeless auth pages
    "$FEATURES_DIR/auth/login.page.html") return 0 ;;
    "$FEATURES_DIR/auth/password-reset/"*) return 0 ;;
    # Chromeless error pages
    "$FEATURES_DIR/errors/"*) return 0 ;;
    # Shell-level pages with their own layout
    "$FEATURES_DIR/administration/administration.page.html") return 0 ;;
    "$FEATURES_DIR/tenants/tenants.page.html") return 0 ;;
    *) return 1 ;;
  esac
}

for template in "${PAGE_TEMPLATES[@]}"; do
  if is_exempt_template "$template"; then
    continue
  fi

  if ! _search '<app-page-frame\b' "$template"; then
    missing+=("${template#$ROOT_DIR/}")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Layout contract failed: every page template must use <app-page-frame>."
  echo "Missing app-page-frame in:"
  for file in "${missing[@]}"; do
    echo "- $file"
  done
  exit 1
fi

echo "Layout contract passed: all page templates use <app-page-frame>."
