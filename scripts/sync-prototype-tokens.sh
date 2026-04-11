#!/bin/bash
# ==================================================================
# sync-prototype-tokens.sh
# Compiles frontend/src/styles.scss → Documentation/design-system/tokens.css
# as the canonical design-system token snapshot.
#
# Prototype-only extras remain in Documentation/design-system/prototype-extras.css
# and must be loaded explicitly by prototype entrypoints. They must not be
# appended into tokens.css because the showcase-alignment contract treats
# tokens.css as the frozen snapshot of frontend source tokens.
#
# Usage: ./scripts/sync-prototype-tokens.sh
# ==================================================================

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
SCSS_SOURCE="$FRONTEND_DIR/src/styles.scss"
TOKENS_TARGET="$PROJECT_ROOT/Documentation/design-system/tokens.css"
if [ ! -f "$SCSS_SOURCE" ]; then
  echo "ERROR: $SCSS_SOURCE not found"
  exit 1
fi

SASS_BIN="$FRONTEND_DIR/node_modules/.bin/sass"
if [ ! -x "$SASS_BIN" ]; then
  case "$PROJECT_ROOT" in
    */.worktrees/*)
      PRIMARY_ROOT="${PROJECT_ROOT%%/.worktrees/*}"
      FALLBACK_SASS="$PRIMARY_ROOT/frontend/node_modules/.bin/sass"
      if [ -x "$FALLBACK_SASS" ]; then
        SASS_BIN="$FALLBACK_SASS"
      fi
      ;;
  esac
fi

if [ ! -x "$SASS_BIN" ] && command -v sass >/dev/null 2>&1; then
  SASS_BIN="$(command -v sass)"
fi

if [ ! -x "$SASS_BIN" ]; then
  echo "ERROR: sass not found in worktree frontend/node_modules, primary checkout frontend/node_modules, or PATH"
  exit 1
fi

echo "Compiling $SCSS_SOURCE..."

# Compile SCSS to CSS (no source map)
COMPILED=$("$SASS_BIN" "$SCSS_SOURCE" --no-source-map 2>&1)

# Write header + compiled output
{
  cat <<'HEADER'
/* ================================================================== */
/* EMSIST Design System — Compiled Token Definitions                  */
/*                                                                    */
/* AUTO-GENERATED from: frontend/src/styles.scss                      */
/* DO NOT EDIT MANUALLY — run scripts/sync-prototype-tokens.sh        */
/*                                                                    */
/* Scope: canonical frontend token snapshot only.                     */
/* Prototype-only extras stay in prototype-extras.css.                */
/*                                                                    */
/* Namespaces:                                                        */
/*   --tp-*   ThinkPLUS global tokens (color, spacing, typography)    */
/*   --nm-*   Neumorphic depth & shadow tokens                        */
/*   --icon-* Icon sizing scale                                       */
/* ================================================================== */

HEADER

  echo "$COMPILED"
} > "$TOKENS_TARGET"

echo "OK: $TOKENS_TARGET updated ($(wc -l < "$TOKENS_TARGET" | tr -d ' ') lines)"
