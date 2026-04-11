#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/frontend/src/app"
FEATURES_DIR="$APP_DIR/features"
DESIGN_SYSTEM_DIR="$ROOT_DIR/Documentation/design-system"
CONTRACT_FILE="$DESIGN_SYSTEM_DIR/DESIGN-SYSTEM-CONTRACT.md"
CHECKLIST_FILE="$DESIGN_SYSTEM_DIR/COMPLIANCE-CHECKLIST.md"

if ! command -v rg >/dev/null 2>&1; then
  echo "ERROR: rg is required for $0" >&2
  exit 1
fi

OUTPUT_FILE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --write)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: bash scripts/generate-design-system-baseline-report.sh [--write output.md]"
      exit 0
      ;;
    *)
      echo "ERROR: Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

TMP_OUTPUT="$(mktemp)"
trap 'rm -f "$TMP_OUTPUT"' EXIT
OUT_FILE="$TMP_OUTPUT"
if [[ -n "$OUTPUT_FILE" ]]; then
  mkdir -p "$(dirname "$OUTPUT_FILE")"
  OUT_FILE="$OUTPUT_FILE"
fi
: > "$OUT_FILE"

write_line() {
  printf '%s\n' "$1" >> "$OUT_FILE"
}

write_block() {
  printf '%s\n' "$1" >> "$OUT_FILE"
}

count_from_rg() {
  local pattern="$1"
  shift
  { rg -n "$pattern" "$@" --glob '!**/*.spec.ts' --glob '!**/*.spec.html' 2>/dev/null || true; } | wc -l | tr -d ' '
}

count_html_with_perl() {
  local perl_code="$1"
  local total=0
  local file_count=0

  while IFS= read -r -d '' file; do
    file_count=$((file_count + 1))
    count="$(perl -0ne "$perl_code" "$file")"
    if [[ -n "$count" ]]; then
      total=$((total + count))
    fi
  done < <(find "$APP_DIR" -type f -name '*.html' ! -name '*.spec.html' ! -path '*/previews/*' -print0)

  if [[ $file_count -eq 0 ]]; then
    printf '0\n'
    return
  fi

  printf '%s\n' "$total"
}

by_file_html_with_perl() {
  local perl_code="$1"

  while IFS= read -r -d '' file; do
    count="$(perl -0ne "$perl_code" "$file")"
    if [[ -n "$count" && "$count" -gt 0 ]]; then
      printf '%s\t%s\n' "$count" "$file"
    fi
  done < <(find "$APP_DIR" -type f -name '*.html' ! -name '*.spec.html' ! -path '*/previews/*' -print0) \
    | sort -rn
}

by_file_counts() {
  local pattern="$1"
  shift
  { rg -n "$pattern" "$@" --glob '!**/*.spec.ts' --glob '!**/*.spec.html' 2>/dev/null || true; } \
    | awk -F: '{count[$1]++} END {for (f in count) printf "%d\t%s\n", count[f], f}' \
    | sort -rn
}

relative_path() {
  local path="$1"
  printf '%s\n' "${path#"$ROOT_DIR"/}"
}

extract_doc_status() {
  local file="$1"
  grep -m1 -E '^\*\*Status:\*\* \[[^]]+\]' "$file" \
    | sed -E 's#^\*\*Status:\*\* \[([^]]+)\].*#\1#'
}

component_doc_is_governed() {
  local slug="$1"
  local file="$DESIGN_SYSTEM_DIR/components/$slug.md"
  local status=""

  if [[ -f "$file" ]]; then
    status="$(extract_doc_status "$file" || true)"
  fi

  [[ "$status" == "DOCUMENTED" || "$status" == "IMPLEMENTED" ]]
}

collect_baseline_docs() {
  find \
    "$DESIGN_SYSTEM_DIR/foundations" \
    "$DESIGN_SYSTEM_DIR/blocks" \
    "$DESIGN_SYSTEM_DIR/patterns" \
    "$DESIGN_SYSTEM_DIR/components" \
    "$DESIGN_SYSTEM_DIR/technical" \
    -type f -name '*.md' | sort
}

doc_action_for() {
  local file="$1"
  case "$file" in
    "$DESIGN_SYSTEM_DIR/foundations/"*)
      printf '%s\n' 'Author the missing foundation contract, attach token/source evidence, then change status from [PLANNED] only after governance proves it.'
      ;;
    "$DESIGN_SYSTEM_DIR/blocks/"*)
      printf '%s\n' 'Author the block contract, migrate live pages to it, remove layout exemptions, then promote status.'
      ;;
    "$DESIGN_SYSTEM_DIR/patterns/"*)
      printf '%s\n' 'Author the interaction pattern, wire an automated check for it, then promote status.'
      ;;
    "$DESIGN_SYSTEM_DIR/technical/"*)
      printf '%s\n' 'Author the technical governance rule, bind it to hooks/CI, then promote status.'
      ;;
    *)
      printf '%s\n' 'Add the missing contract details and supporting governance evidence before promoting status.'
      ;;
  esac
}

write_doc_inventory() {
  write_line ""
  write_line "## Design-System Doc Status Inventory"
  write_line ""
  write_line "| Document | Status |"
  write_line "|---|---|"

  while IFS= read -r file; do
    status="$(extract_doc_status "$file" || true)"
    if [[ -z "$status" ]]; then
      status="MISSING-STATUS"
    fi
    write_line "| \`$(relative_path "$file")\` | \`[$status]\` |"
  done < <(collect_baseline_docs)
}

write_planned_doc_gaps() {
  write_line ""
  write_line "## Baseline Docs Still PLANNED"
  write_line ""
  write_line "| Document | Exact Action |"
  write_line "|---|---|"

  local found=0
  while IFS= read -r file; do
    status="$(extract_doc_status "$file" || true)"
    if [[ "$status" == "PLANNED" ]]; then
      found=1
      write_line "| \`$(relative_path "$file")\` | $(doc_action_for "$file") |"
    fi
  done < <(collect_baseline_docs)

  if [[ $found -eq 0 ]]; then
    write_line "| None | None |"
  fi
}

showcase_verdict_line() {
  local section="$1"
  local evidence="$2"
  local verdict="$3"
  local action="$4"
  write_line "| $section | $evidence | \`$verdict\` | $action |"
}

live_governance_gap_line() {
  local component="$1"
  local evidence="$2"
  local action="$3"
  write_line "| \`$component\` | $evidence | $action |"
}

write_file_count_list() {
  local title="$1"
  shift
  write_line ""
  write_line "## $title"
  local rows
  rows="$("$@")"
  if [[ -z "$rows" ]]; then
    write_line ""
    write_line "- None"
    return
  fi
  write_line ""
  while IFS=$'\t' read -r count file; do
    [[ -z "$count" || -z "$file" ]] && continue
    write_line "- \`$(relative_path "$file")\` ($count)"
  done <<< "$rows"
}

raw_buttons_count="$(count_html_with_perl 'BEGIN { $c = 0 } while (/<button\b(?:(?!>).|\n)*?>/gms) { $tag = $&; if ($tag !~ /(?:\bpButton\b|\bp-button\b)/) { $c++ } } END { print $c }')"
button_class_count="$(count_from_rg 'class=\"[^\"]*(app-btn|nm-btn|submit-btn|sort-btn|tenant-name-link|modal-close|island-btn|sign-out-btn|back-btn|signin-btn|icon-btn)' "$APP_DIR" --glob '*.html')"
live_p_button_count="$(count_from_rg '\bpButton\b|<p-button' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_card_count="$(count_from_rg '<p-card' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
native_select_count="$(count_from_rg '<select' "$APP_DIR" --glob '*.html')"
live_p_select_count="$(count_from_rg '<p-select(?!button)' -P "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_selectbutton_count="$(count_from_rg '<p-selectbutton' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_multiselect_count="$(count_from_rg '<p-multiselect' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_tabs_count="$(count_from_rg '<p-tabs' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
deprecated_tabview_count="$(count_from_rg '<p-tabView|<p-tabview' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
raw_table_count="$(count_from_rg '<table' "$APP_DIR" --glob '*.html')"
live_p_table_count="$(count_from_rg '<p-table' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
custom_dialog_count="$(count_from_rg '<dialog|role=\"dialog\"' "$APP_DIR" --glob '*.html')"
live_p_dialog_count="$(count_from_rg '<p-dialog' "$APP_DIR" --glob '*.html' --glob '!**/previews/**')"
live_p_paginator_count="$(count_from_rg '<p-paginator' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_datepicker_count="$(count_from_rg '<p-datePicker|<p-datepicker' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_fieldset_count="$(count_from_rg '<p-fieldset' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_toggle_count="$(count_from_rg '<p-toggleSwitch' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_stepper_count="$(count_from_rg '<p-stepper|primeng/stepper|StepperModule' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_menu_count="$(count_from_rg '<p-menu|<p-menubar|<p-tieredMenu' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_message_count="$(count_from_rg '<p-message' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_toast_count="$(count_from_rg '<p-toast' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_checkbox_count="$(count_from_rg '<p-checkbox' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_tag_count="$(count_from_rg '<p-tag' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_progress_spinner_count="$(count_from_rg '<p-progressSpinner' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_progress_bar_count="$(count_from_rg '<p-progressBar' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_skeleton_count="$(count_from_rg '<p-skeleton' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_confirm_count="$(count_from_rg '<p-confirmDialog|<p-confirmPopup' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_inputnumber_count="$(count_from_rg '<p-inputNumber' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_textarea_count="$(count_from_rg 'pTextarea|<textarea[^>]*pTextarea' -P "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_tooltip_count="$(count_from_rg '\bpTooltip=' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
live_p_iconfield_count="$(count_from_rg '<p-iconField|<p-inputIcon' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
pt_binding_count="$(count_from_rg '\[pt\]|\spt=' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**')"
ng_deep_file_count="$({ rg -l '::ng-deep' "$APP_DIR" --glob '*.scss' || true; } | wc -l | tr -d ' ')"
raw_primeng_override_file_count="$({ rg -l '\.p-' "$APP_DIR" --glob '*.scss' || true; } | wc -l | tr -d ' ')"
rtl_debt_file_count="$({ rg -l 'margin-left|margin-right|padding-left|padding-right|left:|right:|border-left|border-right|text-align:\s*left|text-align:\s*right' "$APP_DIR" --glob '*.scss' || true; } | wc -l | tr -d ' ')"
date_violation_count="$(count_from_rg "mediumDate|date:\\s*'short'|date:\\s*'medium'|toLocaleString\\(" "$APP_DIR" --glob '*.html' --glob '*.ts')"
raw_text_input_count="$(count_html_with_perl 'BEGIN { $c = 0 } while (/<input\b(?:(?!>).|\n)*?>/gms) { $tag = $&; if ($tag =~ /\btype="(?:text|password|email|search)"/ && $tag !~ /\bpInputText\b/) { $c++ } } END { print $c }')"
raw_textarea_count="$(count_html_with_perl 'BEGIN { $c = 0 } while (/<textarea\b(?:(?!>).|\n)*?>/gms) { $tag = $&; if ($tag !~ /\bpTextarea\b/) { $c++ } } END { print $c }')"
raw_checkbox_count="$(count_html_with_perl 'BEGIN { $c = 0 } while (/<input\b(?:(?!>).|\n)*?>/gms) { $tag = $&; if ($tag =~ /\btype="checkbox"/) { $c++ } } END { print $c }')"
raw_date_input_count="$(count_html_with_perl 'BEGIN { $c = 0 } while (/<input\b(?:(?!>).|\n)*?>/gms) { $tag = $&; if ($tag =~ /\btype="date"/) { $c++ } } END { print $c }')"
raw_number_input_count="$(count_html_with_perl 'BEGIN { $c = 0 } while (/<input\b(?:(?!>).|\n)*?>/gms) { $tag = $&; if ($tag =~ /\btype="number"/) { $c++ } } END { print $c }')"
raw_date_number_input_count="$((raw_date_input_count + raw_number_input_count))"
custom_wizard_count="$(count_from_rg 'wizard-modal|wizard-stepper|wizard-progress|wizardStep\(' "$APP_DIR" --glob '*.html' --glob '*.ts')"
search_input_count="$(count_from_rg 'type=\"search\"' "$APP_DIR" --glob '*.html')"

LOGIN_PAGE_HTML="$FEATURES_DIR/auth/login.page.html"
login_raw_button_count=0
login_raw_text_input_count=0
login_custom_button_count=0
if [[ -f "$LOGIN_PAGE_HTML" ]]; then
  login_raw_button_count="$(
    perl -0ne 'BEGIN { $c = 0 } while (/<button\b(?:(?!>).|\n)*?>/gms) { $tag = $&; if ($tag !~ /(?:\bpButton\b|\bp-button\b)/) { $c++ } } END { print $c }' "$LOGIN_PAGE_HTML"
  )"
  login_raw_text_input_count="$(
    perl -0ne 'BEGIN { $c = 0 } while (/<input\b(?:(?!>).|\n)*?>/gms) { $tag = $&; if ($tag =~ /\btype="(?:text|password|email|search)"/ && $tag !~ /\bpInputText\b/) { $c++ } } END { print $c }' "$LOGIN_PAGE_HTML"
  )"
  login_custom_button_count="$(
    { rg -n 'class=\"[^\"]*(app-btn|nm-btn|submit-btn|sort-btn|tenant-name-link|modal-close|island-btn|sign-out-btn|back-btn|signin-btn|icon-btn)' "$LOGIN_PAGE_HTML" 2>/dev/null || true; } | wc -l | tr -d ' '
  )"
fi

spacing_warning_count="$("$ROOT_DIR/scripts/check-spacing-scale.sh" 2>/dev/null | sed -n 's/^Total non-standard spacing warnings: //p' | head -n1)"
if [[ -z "$spacing_warning_count" ]]; then
  spacing_warning_count="unknown"
fi

radius_warning_count="$(
  {
    { grep -rnE 'border-radius:' "$APP_DIR" --include='*.scss' 2>/dev/null || true; } \
      | grep -v 'login.page' \
      | grep -v 'var(--nm-radius' \
      | grep -v '50%' \
      | grep -v 'inherit' \
      | grep -v '0;' \
      | grep -v '0 0' \
      | grep -v '^\s*//' \
      | grep -v '\.spec\.' \
      | wc -l | tr -d ' '
  } || true
)"
if [[ -z "$radius_warning_count" ]]; then
  radius_warning_count="0"
fi

button_showcase_verdict="COMPLIANT"
button_showcase_action="Live button usage is aligned to governed button primitives."
if [[ "$raw_buttons_count" -gt 0 || "$button_class_count" -gt 0 ]]; then
  button_showcase_verdict="NON-COMPLIANT"
  button_showcase_action="Replace raw/custom buttons with \`p-button\`; migrate hotspots first in tenant manager, master definitions, identity-provider wizard, and login surfaces."
fi

input_showcase_verdict="COMPLIANT"
input_showcase_action="Live input usage is aligned to governed text, textarea, and numeric primitives."
if [[ "$raw_text_input_count" -gt 0 || "$raw_textarea_count" -gt 0 || "$raw_number_input_count" -gt 0 ]]; then
  input_showcase_verdict="NON-COMPLIANT"
  input_showcase_action="Replace raw text inputs with \`pInputText\`, raw textareas with \`pTextarea\`, and raw numeric entry with \`p-inputNumber\`."
fi

select_showcase_verdict="COMPLIANT"
select_showcase_action="Select usage is aligned to governed PrimeNG select primitives; introduce \`p-multiSelect\` only where the UX actually needs multi-select."
if [[ "$native_select_count" -gt 0 ]]; then
  select_showcase_verdict="NON-COMPLIANT"
  select_showcase_action="Replace all native selects with \`p-select\`; introduce \`p-multiSelect\` wherever multi-choice filters/forms exist."
elif [[ "$live_p_select_count" -eq 0 && "$live_p_selectbutton_count" -eq 0 && "$live_p_multiselect_count" -eq 0 ]]; then
  select_showcase_verdict="PARTIAL"
  select_showcase_action="No governed select primitives are currently live; add them when a select use case exists."
fi

tabs_showcase_verdict="COMPLIANT"
tabs_showcase_action="Live tabs use governed PrimeNG tabs with passthrough styling."
if [[ "$deprecated_tabview_count" -gt 0 ]]; then
  tabs_showcase_verdict="NON-COMPLIANT"
  tabs_showcase_action="Remove deprecated \`p-tabView\` / \`p-tabview\` usage and migrate to \`p-tabs\`."
elif [[ "$live_p_tabs_count" -eq 0 || "$pt_binding_count" -eq 0 ]]; then
  tabs_showcase_verdict="PARTIAL"
  tabs_showcase_action="Keep \`p-tabs\` but move live tab styling onto documented tokenized \`[pt]\` contracts."
fi

datatable_showcase_verdict="COMPLIANT"
datatable_showcase_action="Live table usage is aligned to \`p-table\` and governed passthrough styling."
if [[ "$raw_table_count" -gt 0 ]]; then
  datatable_showcase_verdict="NON-COMPLIANT"
  datatable_showcase_action="Replace raw tables with \`p-table\`, add \`emptymessage\`, and style through \`[pt]\` instead of raw \`.p-*\` overrides."
elif [[ "$live_p_table_count" -eq 0 || "$pt_binding_count" -eq 0 || "$raw_primeng_override_file_count" -gt 0 ]]; then
  datatable_showcase_verdict="PARTIAL"
  datatable_showcase_action="Keep \`p-table\` live and finish moving table styling to governed \`[pt]\` contracts."
fi

paginator_showcase_verdict="COMPLIANT"
paginator_showcase_action="PrimeNG paginator usage is aligned to the documented pagination baseline."
if [[ "$live_p_paginator_count" -eq 0 ]]; then
  paginator_showcase_verdict="NON-COMPLIANT"
  paginator_showcase_action="Replace all custom Prev/Next and page-size controls with \`p-paginator\` or \`p-table\` built-in pagination."
fi

dialog_showcase_verdict="COMPLIANT"
dialog_showcase_action="Dialog usage is aligned to governed \`p-dialog\` implementations."
if [[ "$custom_dialog_count" -gt 0 ]]; then
  dialog_showcase_verdict="NON-COMPLIANT"
  dialog_showcase_action="Replace native/custom modal shells with \`p-dialog\` or \`p-confirmDialog\`; remove raw overlay dialog implementations."
elif [[ "$live_p_dialog_count" -eq 0 ]]; then
  dialog_showcase_verdict="PARTIAL"
  dialog_showcase_action="PrimeNG dialog is documented but not currently live in app code."
fi

datepicker_showcase_verdict="COMPLIANT"
datepicker_showcase_action="Date input and display formatting are aligned to the governed date baseline."
if [[ "$raw_date_input_count" -gt 0 || "$date_violation_count" -gt 0 ]]; then
  datepicker_showcase_verdict="NON-COMPLIANT"
  datepicker_showcase_action="Replace raw date fields with \`p-datePicker\` and align displayed date formatting to the documented baseline."
elif [[ "$live_p_datepicker_count" -eq 0 ]]; then
  datepicker_showcase_verdict="PARTIAL"
  datepicker_showcase_action="No governed date-picker surface is currently live; add \`p-datePicker\` when the next date-entry flow is introduced."
fi

toggle_showcase_verdict="COMPLIANT"
toggle_showcase_action="Boolean setting controls are aligned to \`p-toggleSwitch\` with no live checkbox debt."
if [[ "$raw_checkbox_count" -gt 0 || "$live_p_checkbox_count" -gt 0 ]]; then
  toggle_showcase_verdict="NON-COMPLIANT"
  toggle_showcase_action="Replace boolean setting controls with \`p-toggleSwitch\`; reserve checkboxes for true checkbox patterns and document them separately."
elif [[ "$live_p_toggle_count" -eq 0 ]]; then
  toggle_showcase_verdict="PARTIAL"
  toggle_showcase_action="No governed toggle-switch usage is currently live."
fi

stepper_showcase_verdict="COMPLIANT"
stepper_showcase_action="Wizard progress is aligned to governed stepper/dialog patterns."
if [[ "$custom_wizard_count" -gt 0 && "$live_p_stepper_count" -gt 0 ]]; then
  stepper_showcase_verdict="PARTIAL"
  stepper_showcase_action="Finish replacing remaining custom wizard progress chrome with \`p-stepper\`."
elif [[ "$custom_wizard_count" -gt 0 ]]; then
  stepper_showcase_verdict="NON-COMPLIANT"
  stepper_showcase_action="Replace custom wizard progress chrome with \`p-stepper\` and host the flow inside documented dialog/page patterns."
elif [[ "$live_p_stepper_count" -eq 0 ]]; then
  stepper_showcase_verdict="PARTIAL"
  stepper_showcase_action="Stepper is documented but not currently live in the app."
fi

login_showcase_verdict="COMPLIANT"
login_showcase_evidence="\`frontend/src/app/features/auth/login.page.html\` uses governed inputs and actions."
login_showcase_action="Login page shell and controls are aligned to the current governed baseline."
if [[ "$login_raw_button_count" -gt 0 || "$login_raw_text_input_count" -gt 0 || "$login_custom_button_count" -gt 0 ]]; then
  login_showcase_verdict="NON-COMPLIANT"
  login_showcase_evidence="\`frontend/src/app/features/auth/login.page.html\` still has \`$login_raw_text_input_count\` raw input(s), \`$login_raw_button_count\` raw button(s), and \`$login_custom_button_count\` custom button-class control(s)"
  login_showcase_action="Rebuild the login surface against the showcase login contract using tokenized inputs, actions, and shell structure."
fi

PAGE_TEMPLATES=()
while IFS= read -r page; do
  PAGE_TEMPLATES+=("$page")
done < <(find "$FEATURES_DIR" -type f -name '*.page.html' | sort)

MISSING_PAGE_FRAME_PAGES=()
for page in "${PAGE_TEMPLATES[@]}"; do
  if ! grep -q '<app-page-frame' "$page"; then
    MISSING_PAGE_FRAME_PAGES+=("$page")
  fi
done

write_line "# Scripted Design-System Baseline Report"
write_line ""
write_line "- Generated by: \`scripts/generate-design-system-baseline-report.sh\`"
write_line "- Date: $(date '+%Y-%m-%d %H:%M:%S %z')"
write_line "- Scope: production app code only unless a section explicitly says otherwise"
write_line "- Preview files under \`branding-studio/previews/\` are excluded from live-component counts"
write_line ""
write_line "## Quantified Violations"
write_line ""
write_line "| Metric | Current State |"
write_line "|---|---:|"
write_line "| Raw \`<button>\` in live templates | $raw_buttons_count |"
write_line "| Custom button-class anchors / buttons | $button_class_count |"
write_line "| Live \`p-button\` / \`pButton\` usages | $live_p_button_count |"
write_line "| Live \`p-card\` | $live_p_card_count |"
write_line "| Native \`<select>\` | $native_select_count |"
write_line "| Live \`p-select\` | $live_p_select_count |"
write_line "| Live \`p-selectbutton\` | $live_p_selectbutton_count |"
write_line "| Live \`p-multiSelect\` | $live_p_multiselect_count |"
write_line "| Live \`p-tabs\` | $live_p_tabs_count |"
write_line "| Deprecated \`p-tabView\` / \`p-tabview\` | $deprecated_tabview_count |"
write_line "| Raw \`<table>\` | $raw_table_count |"
write_line "| Live \`p-table\` | $live_p_table_count |"
write_line "| Custom/native dialogs (\`<dialog>\` or \`role=\"dialog\"\`) | $custom_dialog_count |"
write_line "| Live \`p-dialog\` | $live_p_dialog_count |"
write_line "| Live \`p-paginator\` | $live_p_paginator_count |"
write_line "| Live \`p-datePicker\` | $live_p_datepicker_count |"
write_line "| Live \`p-fieldset\` | $live_p_fieldset_count |"
write_line "| Live \`p-toggleSwitch\` | $live_p_toggle_count |"
write_line "| Live \`p-stepper\` | $live_p_stepper_count |"
write_line "| Live \`p-menu\` / \`p-menubar\` / \`p-tieredMenu\` | $live_p_menu_count |"
write_line "| Live \`p-message\` | $live_p_message_count |"
write_line "| Live \`p-toast\` | $live_p_toast_count |"
write_line "| Live \`p-checkbox\` | $live_p_checkbox_count |"
write_line "| Live \`p-tag\` | $live_p_tag_count |"
write_line "| Live \`p-progressSpinner\` | $live_p_progress_spinner_count |"
write_line "| Live \`p-progressBar\` | $live_p_progress_bar_count |"
write_line "| Live \`p-skeleton\` | $live_p_skeleton_count |"
write_line "| Live \`p-confirmDialog\` / \`p-confirmPopup\` | $live_p_confirm_count |"
write_line "| Live \`p-inputNumber\` | $live_p_inputnumber_count |"
write_line "| Live \`pTextarea\` | $live_p_textarea_count |"
write_line "| Live \`pTooltip\` directives | $live_p_tooltip_count |"
write_line "| Live \`p-iconField\` / \`p-inputIcon\` | $live_p_iconfield_count |"
write_line "| \`[pt]\` passthrough usages in app code | $pt_binding_count |"
write_line "| Files with \`::ng-deep\` | $ng_deep_file_count |"
write_line "| Files with raw \`.p-*\` overrides | $raw_primeng_override_file_count |"
write_line "| Files with RTL/logical-property debt | $rtl_debt_file_count |"
write_line "| Date formatting violations | $date_violation_count |"
write_line "| Raw text/password/email/search inputs without \`pInputText\` | $raw_text_input_count |"
write_line "| Raw \`<textarea>\` without \`pTextarea\` | $raw_textarea_count |"
write_line "| Raw native checkboxes | $raw_checkbox_count |"
write_line "| Raw date inputs | $raw_date_input_count |"
write_line "| Raw number inputs | $raw_number_input_count |"
write_line "| Raw date/number inputs | $raw_date_number_input_count |"
write_line "| Live search inputs | $search_input_count |"
write_line "| Custom wizard implementations | $custom_wizard_count |"
write_line "| Spacing warnings (from \`check-spacing-scale.sh\`) | $spacing_warning_count |"
write_line "| Hardcoded border-radius warnings | $radius_warning_count |"
write_line "| Page templates missing \`app-page-frame\` | ${#MISSING_PAGE_FRAME_PAGES[@]} / ${#PAGE_TEMPLATES[@]} |"

write_line ""
write_line "## Contract Index Status Drift"
write_line ""
contract_mismatches=0
while IFS= read -r line; do
  rel_target="$(printf '%s\n' "$line" | sed -E 's#.*\(\./([^)]*)\).*#\1#')"
  contract_status="$(printf '%s\n' "$line" | sed -E 's#.*-- \[([^]]+)\].*#\1#')"
  target_file="$DESIGN_SYSTEM_DIR/$rel_target"

  if [[ ! -f "$target_file" ]]; then
    if [[ $contract_mismatches -eq 0 ]]; then
      write_line "- Missing referenced document(s):"
    fi
    write_line "  - \`Documentation/design-system/$rel_target\` referenced as \`[$contract_status]\` but file does not exist"
    contract_mismatches=$((contract_mismatches + 1))
    continue
  fi

  source_status="$(extract_doc_status "$target_file" || true)"
  if [[ -z "$source_status" ]]; then
    if [[ $contract_mismatches -eq 0 ]]; then
      write_line "- Status mismatch(es):"
    fi
    write_line "  - \`$(relative_path "$target_file")\` is missing a \`**Status:** [..]\` line"
    contract_mismatches=$((contract_mismatches + 1))
    continue
  fi

  if [[ "$contract_status" != "$source_status" ]]; then
    if [[ $contract_mismatches -eq 0 ]]; then
      write_line "- Status mismatch(es):"
    fi
    write_line "  - \`Documentation/design-system/$rel_target\`: contract says \`[$contract_status]\`, source says \`[$source_status]\`"
    contract_mismatches=$((contract_mismatches + 1))
  fi
done < <(grep -E '^- \[.+\]\(\./(foundations|blocks|patterns|components|technical)/.+\) -- \[[^]]+\]$' "$CONTRACT_FILE")

if [[ $contract_mismatches -eq 0 ]]; then
  write_line "- None"
fi

write_doc_inventory
write_planned_doc_gaps

write_line ""
write_line "## Pattern Documentation Gaps"
write_line ""
write_line "| Pattern Doc | Live Evidence | Exact Action |"
write_line "|---|---|---|"
pattern_gap_rows=0
if [[ "$(extract_doc_status "$DESIGN_SYSTEM_DIR/patterns/search.md" || true)" == "PLANNED" ]]; then
  write_line "| \`Documentation/design-system/patterns/search.md\` | \`$search_input_count\` live search inputs | Author the search contract and enforce debounce, minimum-character threshold, clear/reset, and loading treatment. |"
  pattern_gap_rows=$((pattern_gap_rows + 1))
fi
if [[ "$(extract_doc_status "$DESIGN_SYSTEM_DIR/patterns/pagination.md" || true)" == "PLANNED" ]]; then
  write_line "| \`Documentation/design-system/patterns/pagination.md\` | \`$live_p_paginator_count\` live paginator and custom pagination still present on list surfaces | Author the pagination contract and fail governance on custom paginator implementations. |"
  pattern_gap_rows=$((pattern_gap_rows + 1))
fi
if [[ "$(extract_doc_status "$DESIGN_SYSTEM_DIR/patterns/date-time.md" || true)" == "PLANNED" ]]; then
  write_line "| \`Documentation/design-system/patterns/date-time.md\` | \`$date_violation_count\` display-format violations and \`$raw_date_input_count\` raw date inputs | Author the display/input date contract and wire automated format checks. |"
  pattern_gap_rows=$((pattern_gap_rows + 1))
fi
if [[ "$(extract_doc_status "$DESIGN_SYSTEM_DIR/patterns/form-validation.md" || true)" == "PLANNED" ]]; then
  write_line "| \`Documentation/design-system/patterns/form-validation.md\` | \`$raw_text_input_count\` raw text-like inputs and \`$live_p_message_count\` inline messages | Author field-level validation/error rules and bind them to forms and tests. |"
  pattern_gap_rows=$((pattern_gap_rows + 1))
fi
if [[ "$(extract_doc_status "$DESIGN_SYSTEM_DIR/patterns/loading-states.md" || true)" == "PLANNED" ]]; then
  write_line "| \`Documentation/design-system/patterns/loading-states.md\` | \`$live_p_progress_spinner_count\` spinners and \`$live_p_skeleton_count\` skeletons | Author the loading-state matrix and enforce skeleton-first behavior on initial loads. |"
  pattern_gap_rows=$((pattern_gap_rows + 1))
fi
if [[ "$(extract_doc_status "$DESIGN_SYSTEM_DIR/patterns/error-handling.md" || true)" == "PLANNED" ]]; then
  write_line "| \`Documentation/design-system/patterns/error-handling.md\` | \`$live_p_message_count\` messages, \`$live_p_toast_count\` toast, \`$custom_dialog_count\` custom/native dialogs | Author inline-vs-toast-vs-dialog error handling rules and remove ad hoc modal error shells. |"
  pattern_gap_rows=$((pattern_gap_rows + 1))
fi
if [[ "$(extract_doc_status "$DESIGN_SYSTEM_DIR/patterns/table-actions.md" || true)" == "PLANNED" ]]; then
  write_line "| \`Documentation/design-system/patterns/table-actions.md\` | \`$raw_table_count\` raw tables, \`$raw_buttons_count\` raw buttons, \`$live_p_tooltip_count\` tooltips | Author row-action/menu/tooltip rules and apply them consistently to table/list surfaces. |"
  pattern_gap_rows=$((pattern_gap_rows + 1))
fi
if [[ $pattern_gap_rows -eq 0 ]]; then
  write_line "| None | None | None |"
fi

write_line ""
write_line "## Page Templates Missing app-page-frame"
write_line ""
if [[ ${#MISSING_PAGE_FRAME_PAGES[@]} -eq 0 ]]; then
  write_line "- None"
else
  for page in "${MISSING_PAGE_FRAME_PAGES[@]}"; do
    write_line "- \`$(relative_path "$page")\`"
  done
fi

write_line ""
write_line "## Component-Showcase Rows With Automated Mismatches"
write_line ""
write_line "| Showcase Section | Evidence | Verdict | Exact Action |"
write_line "|---|---|---|---|"
showcase_verdict_line "1. Button" "\`$raw_buttons_count\` raw \`<button>\`, \`$button_class_count\` custom button-class controls, \`$pt_binding_count\` \`[pt]\` usages" "$button_showcase_verdict" "$button_showcase_action"
showcase_verdict_line "3. Input" "\`$raw_text_input_count\` raw text-like inputs, \`$raw_textarea_count\` raw textareas, \`$raw_number_input_count\` raw number inputs" "$input_showcase_verdict" "$input_showcase_action"
showcase_verdict_line "4. Select & MultiSelect" "\`$native_select_count\` native \`<select>\`, \`$live_p_select_count\` \`p-select\`, \`$live_p_multiselect_count\` \`p-multiSelect\`" "$select_showcase_verdict" "$select_showcase_action"
showcase_verdict_line "5. Tabs" "\`$live_p_tabs_count\` live \`p-tabs\`, \`$deprecated_tabview_count\` deprecated tab views, \`$pt_binding_count\` \`[pt]\` usages" "$tabs_showcase_verdict" "$tabs_showcase_action"
showcase_verdict_line "6. DataTable" "\`$raw_table_count\` raw tables, \`$live_p_table_count\` \`p-table\`, \`$pt_binding_count\` \`[pt]\` usages" "$datatable_showcase_verdict" "$datatable_showcase_action"
showcase_verdict_line "7. Paginator" "\`$live_p_paginator_count\` live \`p-paginator\`, \`${#MISSING_PAGE_FRAME_PAGES[@]}\` page-frame gaps" "$paginator_showcase_verdict" "$paginator_showcase_action"
showcase_verdict_line "8. Dialog" "\`$custom_dialog_count\` custom/native dialogs, \`$live_p_dialog_count\` \`p-dialog\`, \`$live_p_confirm_count\` confirm dialogs" "$dialog_showcase_verdict" "$dialog_showcase_action"
showcase_verdict_line "12. DatePicker" "\`$raw_date_input_count\` raw date inputs, \`$live_p_datepicker_count\` live \`p-datePicker\`, \`$date_violation_count\` display-format violations" "$datepicker_showcase_verdict" "$datepicker_showcase_action"
showcase_verdict_line "14. ToggleSwitch" "\`$raw_checkbox_count\` raw native checkboxes, \`$live_p_checkbox_count\` live \`p-checkbox\`, \`$live_p_toggle_count\` live \`p-toggleSwitch\`" "$toggle_showcase_verdict" "$toggle_showcase_action"
showcase_verdict_line "15. Stepper / Wizard Dialog" "\`$custom_wizard_count\` custom wizard markers, \`$live_p_stepper_count\` live \`p-stepper\`" "$stepper_showcase_verdict" "$stepper_showcase_action"
showcase_verdict_line "16. Login Page" "$login_showcase_evidence" "$login_showcase_verdict" "$login_showcase_action"

write_line ""
write_line "## Live PrimeNG Governance Gaps"
write_line ""
write_line "| Live Component Without Matching Baseline Doc | Evidence | Exact Action |"
write_line "|---|---|---|"
governance_gap_rows=0
if [[ "$live_p_checkbox_count" -gt 0 ]]; then
  live_governance_gap_line "p-checkbox" "\`$live_p_checkbox_count\` live usages and no matching doc under \`Documentation/design-system/components/\`" "Add a checkbox contract or eliminate checkbox usage where toggle/select patterns should apply."
  governance_gap_rows=$((governance_gap_rows + 1))
fi
if [[ "$live_p_tag_count" -gt 0 ]] && ! component_doc_is_governed "tag"; then
  live_governance_gap_line "p-tag" "\`$live_p_tag_count\` live usages and no matching doc under \`Documentation/design-system/components/\`" "Add a tag/chip contract covering severity, rounded usage, and table/list status labeling."
  governance_gap_rows=$((governance_gap_rows + 1))
fi
if [[ "$live_p_progress_spinner_count" -gt 0 ]] && ! component_doc_is_governed "progressspinner"; then
  live_governance_gap_line "p-progressSpinner" "\`$live_p_progress_spinner_count\` live usages and no matching component doc; align loading behavior to the documented loading-states pattern." "Document spinner usage inside \`patterns/loading-states.md\` and replace initial-load spinners with skeletons where required."
  governance_gap_rows=$((governance_gap_rows + 1))
fi
if [[ "$live_p_progress_bar_count" -gt 0 ]]; then
  live_governance_gap_line "p-progressBar" "\`$live_p_progress_bar_count\` live usages and no matching doc under \`Documentation/design-system/components/\`" "Add a progress-bar/loading contract before introducing or expanding usage."
  governance_gap_rows=$((governance_gap_rows + 1))
fi
if [[ "$live_p_selectbutton_count" -gt 0 ]] && ! component_doc_is_governed "selectbutton"; then
  live_governance_gap_line "p-selectbutton" "\`$live_p_selectbutton_count\` live usages and no matching doc under \`Documentation/design-system/components/\`" "Add a select-button contract or replace usages with a documented component."
  governance_gap_rows=$((governance_gap_rows + 1))
fi
if [[ "$live_p_tooltip_count" -gt 0 ]] && ! component_doc_is_governed "tooltip"; then
  live_governance_gap_line "pTooltip" "\`$live_p_tooltip_count\` live directives and no matching doc under \`Documentation/design-system/components/\`" "Document tooltip content, trigger, and accessibility rules or remove non-governed tooltip usage."
  governance_gap_rows=$((governance_gap_rows + 1))
fi
if [[ $governance_gap_rows -eq 0 ]]; then
  write_line "| None | None | None |"
fi

write_file_count_list "Raw Buttons By File" by_file_html_with_perl 'BEGIN { $c = 0 } while (/<button\b(?:(?!>).|\n)*?>/gms) { $tag = $&; if ($tag !~ /(?:\bpButton\b|\bp-button\b)/) { $c++ } } END { print $c }'
write_file_count_list "Custom Button-Class Anchors / Buttons By File" by_file_counts 'class=\"[^\"]*(app-btn|nm-btn|submit-btn|sort-btn|tenant-name-link|modal-close|island-btn|sign-out-btn|back-btn|signin-btn|icon-btn)' "$APP_DIR" --glob '*.html'
write_file_count_list "Native Selects By File" by_file_counts '<select' "$APP_DIR" --glob '*.html'
write_file_count_list "Raw Tables By File" by_file_counts '<table' "$APP_DIR" --glob '*.html'
write_file_count_list "Custom / Native Dialogs By File" by_file_counts '<dialog|role=\"dialog\"' "$APP_DIR" --glob '*.html'
write_file_count_list "Date Format Violations By File" by_file_counts "mediumDate|date:\\s*'short'|date:\\s*'medium'|toLocaleString\\(" "$APP_DIR" --glob '*.html' --glob '*.ts'
write_file_count_list "Checkbox Mismatches By File" by_file_counts 'type=\"checkbox\"|<p-checkbox' "$APP_DIR" --glob '*.html' --glob '*.ts' --glob '!**/previews/**'
write_file_count_list "Raw Date / Number Inputs By File" by_file_counts 'type=\"date\"|type=\"number\"' "$APP_DIR" --glob '*.html'
write_file_count_list "Files With ::ng-deep" by_file_counts '::ng-deep' "$APP_DIR" --glob '*.scss'
write_file_count_list "Files With Raw .p-* Overrides" by_file_counts '\.p-' "$APP_DIR" --glob '*.scss'
write_file_count_list "Files With RTL / Logical-Property Debt" by_file_counts 'margin-left|margin-right|padding-left|padding-right|left:|right:|border-left|border-right|text-align:\s*left|text-align:\s*right' "$APP_DIR" --glob '*.scss'

write_line ""
write_line "## Source Files Used"
write_line ""
write_line "- \`$CONTRACT_FILE\`"
write_line "- \`$CHECKLIST_FILE\`"
write_line "- \`$APP_DIR\`"
write_line "- \`$ROOT_DIR/scripts/check-spacing-scale.sh\`"
write_line "- \`$ROOT_DIR/scripts/check-frontend-layout-contract.sh\`"
write_line ""

if [[ -z "$OUTPUT_FILE" ]]; then
  cat "$OUT_FILE"
fi
