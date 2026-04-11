#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCAN_DIR="$ROOT_DIR/frontend/src/app"
ALLOWLIST_FILE="$ROOT_DIR/scripts/primeng-override-allowlist.txt"
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

if [[ ! -d "$SCAN_DIR" ]]; then
  echo "PrimeNG override audit skipped: $SCAN_DIR not found"
  exit 0
fi

mkdir -p "$OUTPUT_DIR"

RAW_FINDINGS="$(mktemp)"
FINDINGS_WITH_STATUS="$(mktemp)"
NORMALIZED_ALLOWLIST="$(mktemp)"
trap 'rm -f "$RAW_FINDINGS" "$FINDINGS_WITH_STATUS" "$NORMALIZED_ALLOWLIST"' EXIT

normalize_repo_path() {
  local path="$1"

  if [[ "$path" == "$ROOT_DIR/"* ]]; then
    printf '%s\n' "${path#"$ROOT_DIR"/}"
    return
  fi

  if [[ "$path" == *"/frontend/src/app/"* ]]; then
    printf 'frontend/src/app/%s\n' "${path##*/frontend/src/app/}"
    return
  fi

  printf '%s\n' "$path"
}

while IFS= read -r line; do
  file="${line%%:*}"
  rest="${line#*:}"
  line_no="${rest%%:*}"
  content="${rest#*:}"
  rel_file="$(normalize_repo_path "$file")"

  match="$(
    printf '%s\n' "$content" \
      | rg -o --no-heading --color never \
        -e '::ng-deep' \
        -e ':where\(\.p-[a-z0-9-]+' \
        -e '\.p-[a-z0-9-]+' \
      | head -n 1
  )"

  if [[ -z "$match" ]]; then
    continue
  fi

  normalized_content="$(printf '%s' "$content" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"
  key="$rel_file|$normalized_content"
  printf '%s\t%s\t%s\t%s\t%s\n' "$key" "$rel_file" "$line_no" "$match" "$content" >> "$RAW_FINDINGS"
done < <(
  rg -n --no-heading --color never \
    -g '*.scss' \
    -e '::ng-deep' \
    -e ':where\(\.p-[a-z0-9-]+' \
    -e '\.p-[a-z0-9-]+' \
    "$SCAN_DIR"
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

while IFS= read -r allowlist_line; do
  [[ -z "$allowlist_line" ]] && continue
  allowlist_file="${allowlist_line%%|*}"
  allowlist_content="${allowlist_line#*|}"
  normalized_file="$(normalize_repo_path "$allowlist_file")"
  printf '%s|%s\n' "$normalized_file" "$allowlist_content" >> "$NORMALIZED_ALLOWLIST"
done < "$ALLOWLIST_FILE"

sort -u "$NORMALIZED_ALLOWLIST" -o "$NORMALIZED_ALLOWLIST"

total_count=0
allowlisted_count=0
new_count=0

while IFS=$'\t' read -r key file line_no match content; do
  total_count=$((total_count + 1))
  status="NEW"

  if rg -Fxq "$key" "$NORMALIZED_ALLOWLIST"; then
    status="ALLOWLISTED"
    allowlisted_count=$((allowlisted_count + 1))
  else
    new_count=$((new_count + 1))
  fi

  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$status" "$file" "$line_no" "$match" "$content" "$key" >> "$FINDINGS_WITH_STATUS"
done < "$RAW_FINDINGS"

TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
JSON_REPORT="$OUTPUT_DIR/primeng-override-audit.json"
MD_REPORT="$OUTPUT_DIR/primeng-override-audit.md"

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
  echo "# PrimeNG Override Audit"
  echo
  echo "- Generated: \`$TIMESTAMP\`"
  echo "- Total findings: **$total_count**"
  echo "- New findings (build-blocking): **$new_count**"
  echo "- Allowlisted debt: **$allowlisted_count**"
  echo

  if [[ $total_count -eq 0 ]]; then
    echo "No findings detected."
  else
    echo "| Status | File | Line | Match |"
    echo "|--------|------|------|-------|"
    while IFS=$'\t' read -r status file line_no match _content _key; do
      echo "| $status | \`$file\` | $line_no | \`$match\` |"
    done < "$FINDINGS_WITH_STATUS"
  fi
} > "$MD_REPORT"

echo "PrimeNG override audit report:"
echo "- $MD_REPORT"
echo "- $JSON_REPORT"

if [[ $new_count -gt 0 ]]; then
  echo "PrimeNG override audit failed with $new_count new finding(s)."
  exit 1
fi

echo "PrimeNG override audit passed with no new findings."
