#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${FRONTEND_DIR:-frontendold}"
OUTPUT_DIR="${1:-$ROOT_DIR/$FRONTEND_DIR/test-results}"
ALLOWLIST_FILE="$ROOT_DIR/scripts/custom-css-allowlist.txt"

mkdir -p "$OUTPUT_DIR"

RAW_FINDINGS="$(mktemp)"
FINDINGS_WITH_STATUS="$(mktemp)"
trap 'rm -f "$RAW_FINDINGS" "$FINDINGS_WITH_STATUS"' EXIT

add_finding() {
  local severity="$1"
  local code="$2"
  local owner="$3"
  local file="$4"
  local selector="$5"
  local message="$6"
  printf '%s|%s|%s|%s|%s|%s\n' "$severity" "$code" "$owner" "$file" "$selector" "$message" >> "$RAW_FINDINGS"
}

json_escape() {
  local value="${1:-}"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//$'\n'/\\n}"
  printf '%s' "$value"
}

TENANT_HTML="$FRONTEND_DIR/src/app/pages/administration/sections/tenant-manager/tenant-manager-section.component.html"
TENANT_TS="$FRONTEND_DIR/src/app/pages/administration/sections/tenant-manager/tenant-manager-section.component.ts"
MOBILE_WIREFRAME="docs/wireframes/mobile-tenant-auth-providers.html"

if [[ ! -f "$ROOT_DIR/$TENANT_HTML" || ! -f "$ROOT_DIR/$TENANT_TS" ]]; then
  echo "Target files not found under $FRONTEND_DIR; skipping custom CSS audit."
  echo "If needed, override with FRONTEND_DIR=<path>."
  exit 0
fi

# Detect custom tab selectors in admin tenant factsheet.
for selector in factsheet-tabs factsheet-tab tenant-tabs tenant-tab section-tabs; do
  if rg -P -q "class=\"[^\"]*(?<![\\w-])${selector}(?![\\w-])[^\"]*\"" "$ROOT_DIR/$TENANT_HTML"; then
    add_finding \
      "HIGH" \
      "CUSTOM_TAB_SELECTOR" \
      "frontend-team" \
      "$TENANT_HTML" \
      "$selector" \
      "Custom tab selector detected in tenant admin view. Prefer PrimeNG Tabs pattern."
  fi
done

# Detect custom button and form selectors in admin tenant factsheet.
for selector in "class=\"btn " " class=\"btn\"" " btn-" "form-grid" "field" "form-row"; do
  selector_found=0
  if [[ "$selector" == "class=\"btn " || "$selector" == " class=\"btn\"" || "$selector" == " btn-" ]]; then
    if rg -q "$selector" "$ROOT_DIR/$TENANT_HTML"; then
      selector_found=1
    fi
  else
    if rg -P -q "class=\"[^\"]*(?<![\\w-])${selector}(?![\\w-])[^\"]*\"" "$ROOT_DIR/$TENANT_HTML"; then
      selector_found=1
    fi
  fi

  if [[ $selector_found -eq 1 ]]; then
    code="CUSTOM_FORM_SELECTOR"
    owner="frontend-team"
    message="Custom form selector detected in tenant admin view. Prefer PrimeNG form controls and layout components."
    finding_selector="$selector"
    severity="MEDIUM"

    if [[ "$selector" == *"btn"* ]]; then
      code="CUSTOM_BUTTON_SELECTOR"
      message="Custom button selector detected in tenant admin view. Prefer PrimeNG button variants."
      severity="HIGH"
    fi

    add_finding \
      "$severity" \
      "$code" \
      "$owner" \
      "$TENANT_HTML" \
      "$finding_selector" \
      "$message"
  fi
done

# Detect missing PrimeNG tabs usage on tabbed screen.
if rg -q 'role="tablist"' "$ROOT_DIR/$TENANT_HTML" && ! rg -q '<p-tabs|<p-tablist|<p-tab ' "$ROOT_DIR/$TENANT_HTML"; then
  add_finding \
    "HIGH" \
    "PRIMENG_TABS_MISSING" \
    "frontend-team" \
    "$TENANT_HTML" \
    "tablist-without-primeng-tabs" \
    "Tablist exists without PrimeNG Tabs markup. PrimeNG-first rule is not met."
fi

# Detect missing PrimeNG UI imports on this target screen component.
if ! rg -q "from 'primeng/" "$ROOT_DIR/$TENANT_TS"; then
  add_finding \
    "MEDIUM" \
    "PRIMENG_UI_IMPORTS_MISSING" \
    "frontend-team" \
    "$TENANT_TS" \
    "imports:primeng/*" \
    "Tenant manager section has no direct PrimeNG UI imports. PrimeNG-first rule is not met for this component."
fi

# Accessibility contract checks for tab semantics and keyboard handling.
if rg -q 'role="tablist"' "$ROOT_DIR/$TENANT_HTML"; then
  if ! rg -q 'aria-selected' "$ROOT_DIR/$TENANT_HTML"; then
    add_finding \
      "HIGH" \
      "TAB_ARIA_SELECTED_MISSING" \
      "frontend-team" \
      "$TENANT_HTML" \
      "role-tab-missing-aria-selected" \
      "Tabs are missing aria-selected contract."
  fi

  if ! rg -q 'aria-controls' "$ROOT_DIR/$TENANT_HTML"; then
    add_finding \
      "HIGH" \
      "TAB_ARIA_CONTROLS_MISSING" \
      "frontend-team" \
      "$TENANT_HTML" \
      "role-tab-missing-aria-controls" \
      "Tabs are missing aria-controls to associated tab panels."
  fi

  if ! rg -q 'onTenantTabKeydown' "$ROOT_DIR/$TENANT_HTML" && ! rg -q 'onTenantTabKeydown' "$ROOT_DIR/$TENANT_TS"; then
    add_finding \
      "MEDIUM" \
      "TAB_KEYBOARD_HANDLER_MISSING" \
      "frontend-team" \
      "$TENANT_HTML" \
      "tab-keyboard-handler" \
      "Keyboard tab navigation handler is missing (Arrow/Home/End/Enter/Space)."
  fi
fi

# Wireframe custom CSS debt tracking.
if rg -q '<style>' "$ROOT_DIR/$MOBILE_WIREFRAME"; then
  add_finding \
    "MEDIUM" \
    "WIREFRAME_INLINE_CUSTOM_CSS" \
    "ux-team" \
    "$MOBILE_WIREFRAME" \
    "inline-style-block" \
    "Wireframe contains inline custom CSS. Keep as reference only and map visuals to PrimeNG components."
fi

if rg -q '\.tabs|\.tab' "$ROOT_DIR/$MOBILE_WIREFRAME"; then
  add_finding \
    "MEDIUM" \
    "WIREFRAME_CUSTOM_TAB_CLASSES" \
    "ux-team" \
    "$MOBILE_WIREFRAME" \
    ".tabs/.tab" \
    "Wireframe includes custom tab classes that diverge from PrimeNG Tabs component contract."
fi

# No custom/global shortcut declaration policy for this module.
if rg -q 'accesskey|aria-keyshortcuts' "$ROOT_DIR/$TENANT_HTML" "$ROOT_DIR/$TENANT_TS"; then
  add_finding \
    "HIGH" \
    "CUSTOM_SHORTCUT_DECLARED" \
    "frontend-team" \
    "$TENANT_HTML" \
    "accesskey/aria-keyshortcuts" \
    "Custom/global shortcut declaration detected. Policy allows only standard keyboard navigation keys."
fi

total_count=0
allowlisted_count=0
new_count=0

if [[ -s "$RAW_FINDINGS" ]]; then
  while IFS='|' read -r severity code owner file selector message; do
    key="${code}|${file}|${selector}"
    status="NEW"
    if [[ -f "$ALLOWLIST_FILE" ]] && rg -Fxq "$key" "$ALLOWLIST_FILE"; then
      status="ALLOWLISTED"
      allowlisted_count=$((allowlisted_count + 1))
    else
      new_count=$((new_count + 1))
    fi

    total_count=$((total_count + 1))
    printf '%s|%s|%s|%s|%s|%s|%s\n' "$severity" "$code" "$owner" "$file" "$selector" "$message" "$status" >> "$FINDINGS_WITH_STATUS"
  done < "$RAW_FINDINGS"
fi

TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
JSON_REPORT="$OUTPUT_DIR/custom-css-audit.json"
MD_REPORT="$OUTPUT_DIR/custom-css-audit.md"

{
  printf '{\n'
  printf '  "generatedAt": "%s",\n' "$TIMESTAMP"
  printf '  "summary": {\n'
  printf '    "total": %d,\n' "$total_count"
  printf '    "new": %d,\n' "$new_count"
  printf '    "allowlisted": %d\n' "$allowlisted_count"
  printf '  },\n'
  printf '  "findings": [\n'

  if [[ -s "$FINDINGS_WITH_STATUS" ]]; then
    first=1
    while IFS='|' read -r severity code owner file selector message status; do
      if [[ $first -eq 0 ]]; then
        printf ',\n'
      fi
      first=0
      printf '    {"severity":"%s","code":"%s","owner":"%s","file":"%s","selector":"%s","message":"%s","status":"%s"}' \
        "$(json_escape "$severity")" \
        "$(json_escape "$code")" \
        "$(json_escape "$owner")" \
        "$(json_escape "$file")" \
        "$(json_escape "$selector")" \
        "$(json_escape "$message")" \
        "$(json_escape "$status")"
    done < "$FINDINGS_WITH_STATUS"
    printf '\n'
  fi

  printf '  ]\n'
  printf '}\n'
} > "$JSON_REPORT"

{
  echo "# Custom CSS Governance Audit"
  echo
  echo "- Generated: \`$TIMESTAMP\`"
  echo "- Total findings: **$total_count**"
  echo "- New findings (build-blocking): **$new_count**"
  echo "- Allowlisted findings (tracked debt): **$allowlisted_count**"
  echo

  if [[ $total_count -eq 0 ]]; then
    echo "No findings detected."
  else
    echo "| Severity | Code | Owner | File | Selector | Status |"
    echo "|----------|------|-------|------|----------|--------|"
    while IFS='|' read -r severity code owner file selector _message status; do
      echo "| $severity | $code | $owner | \`$file\` | \`$selector\` | $status |"
    done < "$FINDINGS_WITH_STATUS"
    echo
    echo "## Details"
    echo
    while IFS='|' read -r severity code _owner file selector message status; do
      echo "- **$severity** \`$code\` (\`$status\`) in \`$file\` (\`$selector\`): $message"
    done < "$FINDINGS_WITH_STATUS"
  fi
} > "$MD_REPORT"

echo "Custom CSS audit report generated:"
echo "- $JSON_REPORT"
echo "- $MD_REPORT"

if [[ $new_count -gt 0 ]]; then
  echo "Build failed: $new_count new non-allowlisted finding(s) detected."
  exit 1
fi

echo "Build passed: no new non-allowlisted custom CSS findings."
