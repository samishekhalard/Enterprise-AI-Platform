#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ADMIN_SCSS_DIR="$ROOT_DIR/frontend/src/app/features/administration"
ALLOWLIST_FILE="$ROOT_DIR/scripts/admin-style-token-allowlist.txt"
OUTPUT_DIR="$ROOT_DIR/frontend/test-results"
WRITE_ALLOWLIST=false

for arg in "$@"; do
  case "$arg" in
    --write-allowlist)
      WRITE_ALLOWLIST=true
      ;;
    --output-dir=*)
      OUTPUT_DIR="${arg#*=}"
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: $0 [--write-allowlist] [--output-dir=<path>]"
      exit 2
      ;;
  esac
done

if [[ ! -d "$ADMIN_SCSS_DIR" ]]; then
  echo "Administration SCSS directory not found: $ADMIN_SCSS_DIR"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

RAW_FINDINGS="$(mktemp)"
FINDINGS_WITH_STATUS="$(mktemp)"
trap 'rm -f "$RAW_FINDINGS" "$FINDINGS_WITH_STATUS"' EXIT

while IFS= read -r line; do
  file="${line%%:*}"
  rest="${line#*:}"
  line_no="${rest%%:*}"
  content="${rest#*:}"

  match="$(
    printf '%s\n' "$content" \
      | rg -o --no-heading --color never \
        -e '#[0-9a-fA-F]{3,8}\b' \
        -e 'rgba?\([^)]*\)' \
        -e 'hsla?\([^)]*\)' \
      | head -n 1
  )"

  if [[ -z "$match" ]]; then
    continue
  fi

  # Token-composed rgba()/rgb() values are allowed by the design system.
  if [[ "$match" =~ ^rgba?\(var\(--[a-zA-Z0-9-]+ ]]; then
    continue
  fi

  normalized_content="$(printf '%s' "$content" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"
  key="$file|$normalized_content"
  printf '%s\t%s\t%s\t%s\t%s\n' "$key" "$file" "$line_no" "$match" "$content" >> "$RAW_FINDINGS"
done < <(
  rg -n --no-heading --color never \
    -g '*.scss' \
    -g '!administration.tokens.scss' \
    -e '#[0-9a-fA-F]{3,8}\b' \
    -e 'rgba?\(' \
    -e 'hsla?\(' \
    "$ADMIN_SCSS_DIR"
)

sort -u "$RAW_FINDINGS" -o "$RAW_FINDINGS"

if [[ "$WRITE_ALLOWLIST" == true ]]; then
  cut -f1 "$RAW_FINDINGS" | sort -u > "$ALLOWLIST_FILE"
  echo "Wrote allowlist baseline to $ALLOWLIST_FILE"
  echo "Total allowlisted keys: $(wc -l < "$ALLOWLIST_FILE" | tr -d ' ')"
  exit 0
fi

if [[ ! -f "$ALLOWLIST_FILE" ]]; then
  echo "Allowlist not found: $ALLOWLIST_FILE"
  echo "Create baseline first: $0 --write-allowlist"
  exit 1
fi

total_count=0
allowlisted_count=0
new_count=0

while IFS=$'\t' read -r key file line_no match content; do
  total_count=$((total_count + 1))
  status="NEW"

  if rg -Fxq "$key" "$ALLOWLIST_FILE"; then
    status="ALLOWLISTED"
    allowlisted_count=$((allowlisted_count + 1))
  else
    new_count=$((new_count + 1))
  fi

  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$status" "$file" "$line_no" "$match" "$content" "$key" >> "$FINDINGS_WITH_STATUS"
done < "$RAW_FINDINGS"

TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
JSON_REPORT="$OUTPUT_DIR/admin-style-token-audit.json"
MD_REPORT="$OUTPUT_DIR/admin-style-token-audit.md"

{
  printf '{\n'
  printf '  "generatedAt": "%s",\n' "$TIMESTAMP"
  printf '  "summary": {\n'
  printf '    "total": %d,\n' "$total_count"
  printf '    "new": %d,\n' "$new_count"
  printf '    "allowlisted": %d\n' "$allowlisted_count"
  printf '  },\n'
  printf '  "findings": [\n'

  first=1
  while IFS=$'\t' read -r status file line_no match content _key; do
    if [[ $first -eq 0 ]]; then
      printf ',\n'
    fi
    first=0
    escaped_content="${content//\\/\\\\}"
    escaped_content="${escaped_content//\"/\\\"}"
    printf '    {"status":"%s","file":"%s","line":%s,"match":"%s","content":"%s"}' \
      "$status" "$file" "$line_no" "$match" "$escaped_content"
  done < "$FINDINGS_WITH_STATUS"

  if [[ $first -eq 0 ]]; then
    printf '\n'
  fi

  printf '  ]\n'
  printf '}\n'
} > "$JSON_REPORT"

{
  echo "# Admin Style Token Audit"
  echo
  echo "- Generated: \`$TIMESTAMP\`"
  echo "- Total findings: **$total_count**"
  echo "- New findings (build-blocking): **$new_count**"
  echo "- Allowlisted debt: **$allowlisted_count**"
  echo

  if [[ $total_count -eq 0 ]]; then
    echo "No findings detected."
  else
    echo "| Status | File | Line | Value |"
    echo "|--------|------|------|-------|"
    while IFS=$'\t' read -r status file line_no match _content _key; do
      echo "| $status | \`$file\` | $line_no | \`$match\` |"
    done < "$FINDINGS_WITH_STATUS"
  fi
} > "$MD_REPORT"

echo "Admin style token audit report:"
echo "- $MD_REPORT"
echo "- $JSON_REPORT"

if [[ $new_count -gt 0 ]]; then
  echo "Admin style token audit failed with $new_count new finding(s)."
  exit 1
fi

echo "Admin style token audit passed with no new findings."
