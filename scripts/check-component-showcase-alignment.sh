#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SHOWCASE="$ROOT_DIR/Documentation/design-system/component-showcase.html"
TOKENS_DOC="$ROOT_DIR/Documentation/design-system/tokens.css"
STYLES_SCSS="$ROOT_DIR/frontend/src/styles.scss"
DEFAULT_PRESET_SCSS="$ROOT_DIR/frontend/src/app/core/theme/default-preset.scss"
GOVERNANCE_SCSS="$ROOT_DIR/frontend/src/app/core/theme/advanced-css-governance.scss"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

errors=0

fail() {
  printf "${RED}FAIL:${NC} %s\n" "$1"
  errors=$((errors + 1))
}

echo "=========================================="
echo "  Component Showcase Alignment"
echo "=========================================="
echo ""

[[ -f "$SHOWCASE" ]] || fail "Missing showcase file: Documentation/design-system/component-showcase.html"
[[ -f "$TOKENS_DOC" ]] || fail "Missing token snapshot: Documentation/design-system/tokens.css"
[[ -f "$STYLES_SCSS" ]] || fail "Missing frontend token source: frontend/src/styles.scss"
[[ -f "$DEFAULT_PRESET_SCSS" ]] || fail "Missing composite token source: frontend/src/app/core/theme/default-preset.scss"
[[ -f "$GOVERNANCE_SCSS" ]] || fail "Missing governance token source: frontend/src/app/core/theme/advanced-css-governance.scss"

if [[ ! -f "$SHOWCASE" || ! -f "$TOKENS_DOC" || ! -f "$STYLES_SCSS" || ! -f "$DEFAULT_PRESET_SCSS" || ! -f "$GOVERNANCE_SCSS" ]]; then
  exit 1
fi

if ! grep -q '@font-face' "$SHOWCASE"; then
  fail "component-showcase.html must keep its inline font-face contract"
fi

if ! grep -Eq ':root[[:space:]]*\{' "$SHOWCASE"; then
  fail "component-showcase.html must keep its inline token contract"
fi

python_output="$(
python3 - "$SHOWCASE" "$STYLES_SCSS" "$DEFAULT_PRESET_SCSS" "$GOVERNANCE_SCSS" "$TOKENS_DOC" <<'PY'
import pathlib
import re
import sys

showcase_path = pathlib.Path(sys.argv[1])
styles_path = pathlib.Path(sys.argv[2])
default_preset_path = pathlib.Path(sys.argv[3])
governance_path = pathlib.Path(sys.argv[4])
tokens_path = pathlib.Path(sys.argv[5])
pattern = re.compile(r'--([\w-]+)\s*:\s*([^;]+);')

def parse(path: pathlib.Path) -> dict[str, str]:
    text = path.read_text()
    values: dict[str, str] = {}
    for key, value in pattern.findall(text):
        values[key] = value.strip()
    return values

def normalize(value: str | None) -> str | None:
    if value is None:
        return value
    return re.sub(r'\s*,\s*', ',', re.sub(r'\s+\)', ')', re.sub(r'\(\s+', '(', re.sub(r'\s+', ' ', value.strip()))))

showcase = parse(showcase_path)
styles = parse(styles_path)
default_preset = parse(default_preset_path)
governance = parse(governance_path)
tokens = parse(tokens_path)

failures: list[str] = []

source = {}
source.update(default_preset)
source.update(governance)
source.update(styles)

for token, showcase_value in showcase.items():
    source_value = source.get(token)
    snapshot_value = tokens.get(token)

    if source_value is None:
        failures.append(f"Frontend token source is missing --{token}")
        continue
    if snapshot_value is None:
        failures.append(f"Documentation/design-system/tokens.css is missing --{token}")
        continue
    if normalize(source_value) != normalize(showcase_value):
        failures.append(
            f"Showcase drift for --{token}: showcase={showcase_value!r} source={source_value!r}"
        )
    if normalize(snapshot_value) != normalize(showcase_value):
        failures.append(
            f"Snapshot drift for --{token}: showcase={showcase_value!r} tokens.css={snapshot_value!r}"
        )

if failures:
    for item in failures:
        print(item)
    sys.exit(1)
PY
)" || true

if [[ -n "$python_output" ]]; then
  while IFS= read -r line; do
    [[ -n "$line" ]] && fail "$line"
  done <<< "$python_output"
fi

if [[ $errors -gt 0 ]]; then
  echo ""
  echo "${RED}FAILED:${NC} Component showcase alignment found $errors issue(s)."
  exit 1
fi

echo "${GREEN}PASSED:${NC} Showcase contract, frontend token sources, and token snapshot are aligned."
