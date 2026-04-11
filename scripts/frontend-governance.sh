#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT/frontend"

echo "Running frontend governance checks..."
"$REPO_ROOT/scripts/check-frontend-layout-contract.sh" frontend
"$REPO_ROOT/scripts/check-design-doc-governance.sh"
npm run lint:design-system
npm run check:design-tokens
npm run check:spacing-scale
npm run check:showcase-alignment
npm run check:admin-style-tokens
bash "$REPO_ROOT/scripts/check-primeng-override-governance.sh"
npm run test:design-system
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run e2e:quality:runtime

echo "frontend governance checks passed."
