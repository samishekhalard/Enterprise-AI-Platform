#!/usr/bin/env bash
# =============================================================================
# safe-push.sh — Safe Git Push Script for Emsist-App
# =============================================================================
#
# Performs a safe rebase-and-push workflow:
#   1. Pre-flight checks (dirty tree, untracked files, secrets scan)
#   2. Stashes uncommitted work
#   3. Fetches latest from remote
#   4. Rebases onto target branch (default: emsist-v1.12)
#   5. On conflict: lists each conflict with context and pauses for user input
#   6. Optionally runs Playwright quality-gate tests
#   7. Pushes to your feature branch (never directly to the base branch)
#   8. Pops stash and reports final status
#
# Usage:
#   ./scripts/safe-push.sh                          # push current branch
#   ./scripts/safe-push.sh -b my-feature            # push to specific branch
#   ./scripts/safe-push.sh --skip-tests             # skip Playwright tests
#   ./scripts/safe-push.sh --base main              # rebase onto main instead
#   ./scripts/safe-push.sh --dry-run                # do everything except push
#
# =============================================================================

set -euo pipefail

# --------------- Colors ---------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# --------------- Defaults ---------------
BASE_BRANCH="emsist-v1.12"
PUSH_BRANCH=""
SKIP_TESTS=false
DRY_RUN=false
STASH_APPLIED=false
STASH_CREATED=false

# --------------- Parse Args ---------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    -b|--branch)   PUSH_BRANCH="$2"; shift 2 ;;
    --base)        BASE_BRANCH="$2"; shift 2 ;;
    --skip-tests)  SKIP_TESTS=true; shift ;;
    --dry-run)     DRY_RUN=true; shift ;;
    -h|--help)
      echo "Usage: $0 [-b branch] [--base branch] [--skip-tests] [--dry-run]"
      exit 0
      ;;
    *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
  esac
done

# --------------- Helpers ---------------
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()    { echo -e "${RED}[FAIL]${NC}  $*"; }
header()  { echo -e "\n${BOLD}═══ $* ═══${NC}\n"; }

abort_rebase() {
  warn "Aborting rebase..."
  git rebase --abort 2>/dev/null || true
  if [[ "$STASH_CREATED" == "true" && "$STASH_APPLIED" == "false" ]]; then
    info "Restoring your stashed changes..."
    git stash pop --quiet 2>/dev/null || true
  fi
  fail "Push aborted. Your working tree has been restored."
  exit 1
}

# Trap to clean up on unexpected exit
trap 'if [[ "$STASH_CREATED" == "true" && "$STASH_APPLIED" == "false" ]]; then warn "Unexpected exit — restoring stash..."; git stash pop --quiet 2>/dev/null || true; fi' EXIT

# =========================================================================
# PHASE 1: PRE-FLIGHT CHECKS
# =========================================================================
header "Phase 1: Pre-Flight Checks"

# 1a. Ensure we're in a git repo
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  fail "Not a git repository. Run this from the Emsist-app root."
  exit 1
fi
success "Inside git repository"

# 1b. Get current branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ -z "$CURRENT_BRANCH" ]]; then
  fail "Detached HEAD state. Checkout a branch first."
  exit 1
fi
info "Current branch: ${BOLD}$CURRENT_BRANCH${NC}"

# 1c. Determine push branch
if [[ -z "$PUSH_BRANCH" ]]; then
  PUSH_BRANCH="$CURRENT_BRANCH"
fi

# 1d. PROTECT base branch — never push directly
if [[ "$PUSH_BRANCH" == "$BASE_BRANCH" || "$PUSH_BRANCH" == "main" || "$PUSH_BRANCH" == "master" ]]; then
  fail "Refusing to push directly to '${PUSH_BRANCH}'."
  echo "  Create a feature branch first:"
  echo "    git checkout -b feature/your-feature-name"
  exit 1
fi
success "Push target: ${BOLD}origin/$PUSH_BRANCH${NC} (not a protected branch)"

# 1e. Check for uncommitted changes
DIRTY=false
UNTRACKED_COUNT=0
MODIFIED_COUNT=0
STAGED_COUNT=0

STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || true)
MODIFIED_FILES=$(git diff --name-only 2>/dev/null || true)
UNTRACKED_FILES=$(git ls-files --others --exclude-standard 2>/dev/null || true)

if [[ -n "$STAGED_FILES" ]]; then
  STAGED_COUNT=$(echo "$STAGED_FILES" | wc -l | tr -d ' ')
  DIRTY=true
fi
if [[ -n "$MODIFIED_FILES" ]]; then
  MODIFIED_COUNT=$(echo "$MODIFIED_FILES" | wc -l | tr -d ' ')
  DIRTY=true
fi
if [[ -n "$UNTRACKED_FILES" ]]; then
  UNTRACKED_COUNT=$(echo "$UNTRACKED_FILES" | wc -l | tr -d ' ')
  DIRTY=true
fi

if [[ "$DIRTY" == "true" ]]; then
  warn "Working tree is dirty:"
  [[ $STAGED_COUNT -gt 0 ]]    && echo -e "  ${GREEN}Staged:${NC}    $STAGED_COUNT file(s)"
  [[ $MODIFIED_COUNT -gt 0 ]]  && echo -e "  ${YELLOW}Modified:${NC}  $MODIFIED_COUNT file(s)"
  [[ $UNTRACKED_COUNT -gt 0 ]] && echo -e "  ${RED}Untracked:${NC} $UNTRACKED_COUNT file(s)"
  echo ""

  # List specific files
  if [[ -n "$STAGED_FILES" ]]; then
    echo -e "  ${GREEN}Staged files:${NC}"
    echo "$STAGED_FILES" | sed 's/^/    /'
  fi
  if [[ -n "$MODIFIED_FILES" ]]; then
    echo -e "  ${YELLOW}Modified files:${NC}"
    echo "$MODIFIED_FILES" | sed 's/^/    /'
  fi
  if [[ -n "$UNTRACKED_FILES" ]]; then
    echo -e "  ${RED}Untracked files:${NC}"
    echo "$UNTRACKED_FILES" | sed 's/^/    /'
  fi
  echo ""
else
  success "Working tree is clean"
fi

# 1f. Secrets scan — check for accidentally committed sensitive files
header "Phase 1b: Secrets & Sensitive File Scan"

SECRETS_FOUND=false
SENSITIVE_PATTERNS=(
  ".env"
  ".env.local"
  ".env.production"
  "credentials.json"
  "service-account.json"
  "*.pem"
  "*.key"
  "*.p12"
  "*.jks"
  "id_rsa"
  "id_ed25519"
)

# Check staged files for secrets
ALL_PENDING_FILES=""
[[ -n "$STAGED_FILES" ]] && ALL_PENDING_FILES="$STAGED_FILES"
[[ -n "$MODIFIED_FILES" ]] && ALL_PENDING_FILES="${ALL_PENDING_FILES}${MODIFIED_FILES:+$'\n'$MODIFIED_FILES}"

if [[ -n "$ALL_PENDING_FILES" ]]; then
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    for pattern in "${SENSITIVE_PATTERNS[@]}"; do
      basename_file=$(basename "$file")
      if [[ "$basename_file" == $pattern ]]; then
        fail "SENSITIVE FILE DETECTED: $file"
        SECRETS_FOUND=true
      fi
    done
  done <<< "$ALL_PENDING_FILES"

  # Scan for hardcoded secrets in staged diffs
  if [[ -n "$STAGED_FILES" ]]; then
    SECRETS_IN_DIFF=$(git diff --cached -G '(password|secret|api_key|apikey|token|private_key)\s*[:=]' --name-only 2>/dev/null || true)
    if [[ -n "$SECRETS_IN_DIFF" ]]; then
      warn "Possible hardcoded secrets in staged changes:"
      echo "$SECRETS_IN_DIFF" | sed 's/^/    /'
      SECRETS_FOUND=true
    fi
  fi
fi

if [[ "$SECRETS_FOUND" == "true" ]]; then
  fail "Secrets detected! Remove sensitive files before pushing."
  echo "  Use:  git reset HEAD <file>  to unstage"
  echo "  Add to .gitignore to prevent future accidents"
  exit 1
fi
success "No sensitive files or hardcoded secrets detected"

# 1g. Check .gitignore coverage
if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
  warn ".env not in .gitignore — consider adding it"
fi

# 1h. Cross-platform consistency checks
header "Phase 1c: Cross-Platform Consistency"

# Check .gitattributes exists
if [[ ! -f ".gitattributes" ]]; then
  fail "Missing .gitattributes — line endings will differ across macOS/Windows/Linux!"
  echo "  This causes phantom diffs and broken shell scripts on other OSes."
  echo "  Create one with: * text=auto eol=lf"
  exit 1
fi
success ".gitattributes exists — line endings enforced"

# Check for CRLF line endings in text files (shouldn't happen on macOS but catches copy-paste issues)
CRLF_FILES=""
if [[ -n "$STAGED_FILES" ]]; then
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    [[ ! -f "$file" ]] && continue
    # Skip binary files
    if file "$file" 2>/dev/null | grep -q "text"; then
      if grep -Plr '\r\n' "$file" &>/dev/null; then
        CRLF_FILES="${CRLF_FILES}${file}\n"
      fi
    fi
  done <<< "$STAGED_FILES"
fi

if [[ -n "$CRLF_FILES" ]]; then
  warn "Files with Windows-style line endings (CRLF) detected:"
  echo -e "$CRLF_FILES" | sed 's/^/    /'
  echo "  Fix with: git add --renormalize ."
else
  success "No CRLF line endings detected in staged files"
fi

# Check for case-sensitivity issues (macOS is case-insensitive, Linux is not)
CASE_ISSUES=$(git ls-files | sort -f | uniq -di 2>/dev/null || true)
if [[ -n "$CASE_ISSUES" ]]; then
  fail "CASE SENSITIVITY CONFLICT — these files differ only by case:"
  echo "$CASE_ISSUES" | sed 's/^/    /'
  echo "  macOS treats these as the same file; Linux/CI will see two different files."
  echo "  Rename one of the conflicting files."
else
  success "No filename case conflicts"
fi

# Check .editorconfig exists
if [[ ! -f ".editorconfig" ]]; then
  warn "No root .editorconfig — IDE formatting may vary across team members"
fi

# Check execute permissions on shell scripts
MISSING_EXEC=()
while IFS= read -r script; do
  [[ -z "$script" ]] && continue
  if [[ ! -x "$script" ]]; then
    MISSING_EXEC+=("$script")
  fi
done < <(find scripts/ -name "*.sh" 2>/dev/null)

if [[ ${#MISSING_EXEC[@]} -gt 0 ]]; then
  warn "Shell scripts missing execute permission (will break on Linux/CI):"
  for s in "${MISSING_EXEC[@]}"; do
    echo "    $s"
  done
  echo "  Fix with: chmod +x scripts/*.sh"
else
  success "All shell scripts have execute permission"
fi

# =========================================================================
# PHASE 2: STASH UNCOMMITTED WORK
# =========================================================================
header "Phase 2: Stash Uncommitted Changes"

if [[ "$DIRTY" == "true" ]]; then
  STASH_MSG="safe-push-auto-stash-$(date +%Y%m%d-%H%M%S)"
  git stash push -u -m "$STASH_MSG" --quiet
  STASH_CREATED=true
  success "Stashed all changes (including untracked): $STASH_MSG"
else
  info "Nothing to stash — working tree already clean"
fi

# =========================================================================
# PHASE 3: FETCH & REBASE
# =========================================================================
header "Phase 3: Fetch & Rebase onto origin/$BASE_BRANCH"

info "Fetching latest from origin..."
git fetch origin --prune --quiet
success "Fetch complete"

# Check if base branch exists on remote
if ! git rev-parse --verify "origin/$BASE_BRANCH" &>/dev/null; then
  fail "Remote branch 'origin/$BASE_BRANCH' does not exist."
  abort_rebase
fi

# Count commits ahead/behind
AHEAD=$(git rev-list --count "origin/$BASE_BRANCH..HEAD" 2>/dev/null || echo "0")
BEHIND=$(git rev-list --count "HEAD..origin/$BASE_BRANCH" 2>/dev/null || echo "0")
info "Your branch: ${GREEN}$AHEAD ahead${NC}, ${RED}$BEHIND behind${NC} origin/$BASE_BRANCH"

if [[ "$BEHIND" -eq 0 ]]; then
  success "Already up to date with origin/$BASE_BRANCH"
else
  info "Rebasing $BEHIND commit(s) from origin/$BASE_BRANCH..."

  if ! git rebase "origin/$BASE_BRANCH" 2>/tmp/rebase-output.txt; then
    # ---- CONFLICT HANDLING ----
    echo ""
    fail "REBASE CONFLICTS DETECTED"
    echo ""
    echo -e "${BOLD}Conflicting files:${NC}"
    echo ""

    CONFLICT_FILES=$(git diff --name-only --diff-filter=U 2>/dev/null || true)
    CONFLICT_NUM=0

    while IFS= read -r cfile; do
      [[ -z "$cfile" ]] && continue
      CONFLICT_NUM=$((CONFLICT_NUM + 1))

      echo -e "${RED}━━━ Conflict #$CONFLICT_NUM: $cfile ━━━${NC}"

      # Show what both sides changed
      echo -e "  ${CYAN}OURS (your branch: $CURRENT_BRANCH):${NC}"
      git diff --ours -- "$cfile" 2>/dev/null | head -20 | sed 's/^/    /'
      echo ""
      echo -e "  ${YELLOW}THEIRS (base: $BASE_BRANCH):${NC}"
      git diff --theirs -- "$cfile" 2>/dev/null | head -20 | sed 's/^/    /'
      echo ""
    done <<< "$CONFLICT_FILES"

    echo -e "${BOLD}Resolution options for each file:${NC}"
    echo "  1) Keep mine:    git checkout --ours <file> && git add <file>"
    echo "  2) Take theirs:  git checkout --theirs <file> && git add <file>"
    echo "  3) Manual merge: Edit the file, resolve markers, then git add <file>"
    echo ""
    echo "After resolving ALL conflicts:"
    echo "  git rebase --continue"
    echo ""
    echo "To abort entirely:"
    echo "  git rebase --abort"
    echo ""

    # Restore stash info for user
    if [[ "$STASH_CREATED" == "true" ]]; then
      warn "Your uncommitted changes are safely stashed as: $STASH_MSG"
      echo "  After resolving conflicts and completing rebase, run:"
      echo "    git stash pop"
    fi

    # Don't use abort_rebase here — let user resolve manually
    fail "Rebase paused. Resolve conflicts and re-run this script, or continue manually."
    # Disable the EXIT trap since we want to leave the rebase state for the user
    trap - EXIT
    exit 2
  fi

  success "Rebase complete — no conflicts"
fi

# =========================================================================
# PHASE 4: PLAYWRIGHT QUALITY GATES (Optional)
# =========================================================================
header "Phase 4: Quality Gate Tests"

if [[ "$SKIP_TESTS" == "true" ]]; then
  warn "Tests skipped (--skip-tests flag)"
else
  # Check if Playwright is installed
  if [[ -f "frontend/package.json" ]] && command -v npx &>/dev/null; then
    if [[ -d "frontend/node_modules/@playwright" ]]; then
      info "Running Playwright quality-gate tests..."
      echo ""

      # Run E2E tests (non-blocking — report results but don't fail push)
      if (cd frontend && npx playwright test -c playwright.quality.config.ts --reporter=list 2>&1); then
        success "All Playwright quality-gate tests passed"
      else
        warn "Some Playwright tests failed — review output above"
        echo ""
        read -r -p "$(echo -e "${YELLOW}Continue with push despite test failures? [y/N]:${NC} ")" CONTINUE_PUSH
        if [[ "$CONTINUE_PUSH" != "y" && "$CONTINUE_PUSH" != "Y" ]]; then
          info "Push cancelled. Fix tests and re-run."
          # Pop stash before exit
          if [[ "$STASH_CREATED" == "true" ]]; then
            git stash pop --quiet 2>/dev/null || true
            STASH_APPLIED=true
          fi
          exit 1
        fi
      fi
    else
      warn "Playwright not installed in frontend/node_modules — skipping tests"
      echo "  Run: cd frontend && npm install"
    fi
  else
    warn "Frontend not set up — skipping Playwright tests"
  fi
fi

# =========================================================================
# PHASE 5: PUSH
# =========================================================================
header "Phase 5: Push to origin/$PUSH_BRANCH"

if [[ "$DRY_RUN" == "true" ]]; then
  warn "DRY RUN — would push to origin/$PUSH_BRANCH"
  info "Command: git push -u origin ${CURRENT_BRANCH}:${PUSH_BRANCH}"
else
  info "Pushing to origin/$PUSH_BRANCH..."
  if git push -u origin "${CURRENT_BRANCH}:${PUSH_BRANCH}" 2>&1; then
    success "Pushed successfully to origin/$PUSH_BRANCH"
  else
    fail "Push failed — check permissions or branch protection rules"
    # Still pop stash
    if [[ "$STASH_CREATED" == "true" ]]; then
      git stash pop --quiet 2>/dev/null || true
      STASH_APPLIED=true
    fi
    exit 1
  fi
fi

# =========================================================================
# PHASE 6: RESTORE STASH & FINAL REPORT
# =========================================================================
header "Phase 6: Restore & Report"

if [[ "$STASH_CREATED" == "true" ]]; then
  info "Popping stashed changes..."
  if git stash pop --quiet 2>/dev/null; then
    STASH_APPLIED=true
    success "Stash restored successfully"

    # Check for stash conflicts
    STASH_CONFLICTS=$(git diff --name-only --diff-filter=U 2>/dev/null || true)
    if [[ -n "$STASH_CONFLICTS" ]]; then
      warn "Stash pop caused merge conflicts in:"
      echo "$STASH_CONFLICTS" | sed 's/^/    /'
      echo "  Resolve these manually."
    fi
  else
    STASH_APPLIED=true
    warn "Stash pop had issues — your stash may still exist"
    echo "  Check: git stash list"
  fi
fi

# Final status
echo ""
echo -e "${BOLD}═══════════════════════════════════════${NC}"
echo -e "${BOLD}        SAFE PUSH COMPLETE             ${NC}"
echo -e "${BOLD}═══════════════════════════════════════${NC}"
echo ""
echo -e "  Branch:     ${BOLD}$CURRENT_BRANCH${NC}"
echo -e "  Pushed to:  ${BOLD}origin/$PUSH_BRANCH${NC}"
echo -e "  Rebased on: ${BOLD}origin/$BASE_BRANCH${NC}"
echo ""

# Final working tree status
FINAL_STATUS=$(git status --short 2>/dev/null || true)
if [[ -z "$FINAL_STATUS" ]]; then
  success "Working tree is clean"
else
  info "Working tree status:"
  echo "$FINAL_STATUS" | sed 's/^/    /'
fi

echo ""
info "To create a PR: gh pr create --base $BASE_BRANCH"
echo ""
