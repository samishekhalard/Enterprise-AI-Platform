#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT/frontend"

echo "Running frontend governance checks..."
"$REPO_ROOT/scripts/check-frontend-layout-contract.sh" frontend
npm run check:admin-style-tokens
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build

echo "frontend governance checks passed."
