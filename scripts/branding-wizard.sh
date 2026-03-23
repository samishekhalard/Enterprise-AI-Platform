#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_TARGET="frontend/src/app/features/administration"
DEFAULT_BG="#edebe0"

PALETTE=(
  "#428177" "#054239" "#002623"
  "#edebe0" "#b9a779" "#988561"
  "#6b1f2a" "#4a151e" "#260f14"
  "#3d3a3b" "#161616" "#ffffff"
)

is_allowed_color() {
  local needle="$1"
  for c in "${PALETTE[@]}"; do
    if [[ "$needle" == "$c" ]]; then
      return 0
    fi
  done
  return 1
}

echo "Branding Deviation Wizard"
echo "Workspace: $ROOT_DIR"
echo

read -r -p "Target path [$DEFAULT_TARGET]: " TARGET_REL
TARGET_REL="${TARGET_REL:-$DEFAULT_TARGET}"
TARGET_PATH="$ROOT_DIR/$TARGET_REL"
if [[ ! -e "$TARGET_PATH" ]]; then
  echo "Target does not exist: $TARGET_PATH"
  exit 1
fi

read -r -p "Required exact base background [$DEFAULT_BG]: " REQUIRED_BG
REQUIRED_BG="$(echo "${REQUIRED_BG:-$DEFAULT_BG}" | tr 'A-F' 'a-f')"

REPORT_DIR="$ROOT_DIR/docs/issues/open"
mkdir -p "$REPORT_DIR"
REPORT_FILE="$REPORT_DIR/BRANDING-DEVIATION-REPORT-$(date +%Y%m%d-%H%M%S).md"

HEX_LINES="$(
  rg -n --no-heading -g '*.scss' -g '*.css' -g '*.ts' -g '*.html' '#[0-9A-Fa-f]{6}' "$TARGET_PATH" || true
)"

GRADIENT_LINES="$(
  rg -n --no-heading -g '*.scss' -g '*.css' 'linear-gradient|radial-gradient' "$TARGET_PATH" || true
)"

PATTERN_LINES="$(
  rg -n --no-heading -g '*.scss' -g '*.css' 'background-image:\s*url\("data:image/svg\+xml' "$TARGET_PATH" || true
)"

BG_LINES="$(
  rg -n --no-heading -g '*.scss' -g '*.css' 'background(?:-color)?\s*:\s*#[0-9A-Fa-f]{6}' "$TARGET_PATH" || true
)"

OFF_PALETTE_TMP="$(mktemp)"
BASE_BG_TMP="$(mktemp)"

while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  file="${line%%:*}"
  rest="${line#*:}"
  ln="${rest%%:*}"
  content="${rest#*:}"
  while IFS= read -r hex; do
    hex_l="$(echo "$hex" | tr 'A-F' 'a-f')"
    if ! is_allowed_color "$hex_l"; then
      printf '%s:%s: %s\n' "$file" "$ln" "$hex_l" >> "$OFF_PALETTE_TMP"
    fi
  done < <(printf '%s\n' "$content" | grep -Eo '#[0-9A-Fa-f]{6}' || true)
done <<< "$HEX_LINES"

while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  file="${line%%:*}"
  rest="${line#*:}"
  ln="${rest%%:*}"
  content="${rest#*:}"
  while IFS= read -r hex; do
    hex_l="$(echo "$hex" | tr 'A-F' 'a-f')"
    if [[ "$hex_l" != "$REQUIRED_BG" ]]; then
      printf '%s:%s: %s\n' "$file" "$ln" "$hex_l" >> "$BASE_BG_TMP"
    fi
  done < <(printf '%s\n' "$content" | grep -Eo '#[0-9A-Fa-f]{6}' || true)
done <<< "$BG_LINES"

OFF_PALETTE_COUNT="$(wc -l < "$OFF_PALETTE_TMP" | tr -d ' ')"
GRADIENT_COUNT="$(printf '%s\n' "$GRADIENT_LINES" | sed '/^$/d' | wc -l | tr -d ' ')"
PATTERN_COUNT="$(printf '%s\n' "$PATTERN_LINES" | sed '/^$/d' | wc -l | tr -d ' ')"
BASE_BG_DEVIATION_COUNT="$(wc -l < "$BASE_BG_TMP" | tr -d ' ')"

{
  echo "# Branding Deviation Report"
  echo
  echo "- Generated: $(date -u +"%Y-%m-%d %H:%M:%SZ")"
  echo "- Target: \`$TARGET_REL\`"
  echo "- Required base background: \`$REQUIRED_BG\`"
  echo
  echo "## Summary"
  echo
  echo "- Off-palette literal colors: **$OFF_PALETTE_COUNT**"
  echo "- Gradient usages: **$GRADIENT_COUNT**"
  echo "- SVG pattern overlays: **$PATTERN_COUNT**"
  echo "- Base-background literal deviations: **$BASE_BG_DEVIATION_COUNT**"
  echo
  echo "## Off-Palette Colors"
  echo
  if [[ "$OFF_PALETTE_COUNT" -eq 0 ]]; then
    echo "_None_"
  else
    sort -u "$OFF_PALETTE_TMP" | sed 's#^#- `#; s#$#`#'
  fi
  echo
  echo "## Gradient Usages"
  echo
  if [[ "$GRADIENT_COUNT" -eq 0 ]]; then
    echo "_None_"
  else
    printf '%s\n' "$GRADIENT_LINES" | sed '/^$/d; s#^#- `#; s#$#`#'
  fi
  echo
  echo "## SVG Pattern Overlays"
  echo
  if [[ "$PATTERN_COUNT" -eq 0 ]]; then
    echo "_None_"
  else
    printf '%s\n' "$PATTERN_LINES" | sed '/^$/d; s#^#- `#; s#$#`#'
  fi
  echo
  echo "## Base Background Deviations"
  echo
  if [[ "$BASE_BG_DEVIATION_COUNT" -eq 0 ]]; then
    echo "_None_"
  else
    sort -u "$BASE_BG_TMP" | sed 's#^#- `#; s#$#`#'
  fi
  echo
  echo "## Palette Reference"
  echo
  for c in "${PALETTE[@]}"; do
    echo "- \`$c\`"
  done
} > "$REPORT_FILE"

rm -f "$OFF_PALETTE_TMP" "$BASE_BG_TMP"

echo
echo "Report created:"
echo "  $REPORT_FILE"
echo
echo "Next steps:"
echo "1) Apply fixes for listed deviations."
echo "2) Re-run: scripts/branding-wizard.sh"
echo "3) Confirm zero critical deviations."
