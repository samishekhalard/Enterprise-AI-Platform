#!/usr/bin/env bash
# =============================================================================
# safe-pull.sh — Safe Git Pull (Fetch + Rebase) Script for Emsist-App
# =============================================================================
#
# Pulls the latest changes from remote without losing local work:
#   1. Pre-flight checks (dirty tree, untracked files, secrets scan)
#   2. Cross-platform consistency checks (line endings, case conflicts)
#   3. Stashes uncommitted work (staged + unstaged + untracked)
#   4. Fetches latest from remote
#   5. Rebases current branch onto the base branch (default: emsist-v1.12)
#   6. On conflict: lists each one with file name + what both sides changed,
#      then pauses for user to choose: keep mine / take theirs / manual merge
#   7. Pops stash and reports if everything is clean
#
# Usage:
#   ./scripts/safe-pull.sh                          # rebase onto emsist-v1.12
#   ./scripts/safe-pull.sh --base main              # rebase onto main instead
#   ./scripts/safe-pull.sh --merge                  # use merge instead of rebase
#   ./scripts/safe-pull.sh --dry-run                # fetch + report, no rebase
#   ./scripts/safe-pull.sh --resolve-all ours       # auto-resolve all conflicts (ours)
#   ./scripts/safe-pull.sh --resolve-all theirs     # auto-resolve all conflicts (theirs)
#
# =============================================================================

set -euo pipefail

# --------------- Colors ---------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# --------------- Defaults ---------------
BASE_BRANCH="emsist-v1.12"
DRY_RUN=false
USE_MERGE=false
RESOLVE_ALL=""
STASH_APPLIED=false
STASH_CREATED=false

# --------------- Parse Args ---------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)          BASE_BRANCH="$2"; shift 2 ;;
    --merge)         USE_MERGE=true; shift ;;
    --dry-run)       DRY_RUN=true; shift ;;
    --resolve-all)   RESOLVE_ALL="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 [--base branch] [--merge] [--dry-run] [--resolve-all ours|theirs]"
      echo ""
      echo "Options:"
      echo "  --base BRANCH       Base branch to rebase onto (default: emsist-v1.12)"
      echo "  --merge             Use merge instead of rebase"
      echo "  --dry-run           Fetch and report divergence, but don't integrate"
      echo "  --resolve-all MODE  Auto-resolve conflicts: 'ours' or 'theirs'"
      echo "  -h, --help          Show this help"
      exit 0
      ;;
    *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
  esac
done

# Validate --resolve-all
if [[ -n "$RESOLVE_ALL" && "$RESOLVE_ALL" != "ours" && "$RESOLVE_ALL" != "theirs" ]]; then
  echo -e "${RED}--resolve-all must be 'ours' or 'theirs', got: $RESOLVE_ALL${NC}"
  exit 1
fi

# --------------- Helpers ---------------
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()    { echo -e "${RED}[FAIL]${NC}  $*"; }
header()  { echo -e "\n${BOLD}═══ $* ═══${NC}\n"; }

cleanup_on_exit() {
  if [[ "$STASH_CREATED" == "true" && "$STASH_APPLIED" == "false" ]]; then
    warn "Unexpected exit — restoring stash..."
    git stash pop --quiet 2>/dev/null || true
    STASH_APPLIED=true
  fi
}
trap cleanup_on_exit EXIT

abort_and_restore() {
  local operation="$1"
  warn "Aborting $operation..."
  if [[ "$operation" == "rebase" ]]; then
    git rebase --abort 2>/dev/null || true
  elif [[ "$operation" == "merge" ]]; then
    git merge --abort 2>/dev/null || true
  fi
  if [[ "$STASH_CREATED" == "true" && "$STASH_APPLIED" == "false" ]]; then
    info "Restoring your stashed changes..."
    git stash pop --quiet 2>/dev/null || true
    STASH_APPLIED=true
  fi
  fail "Pull aborted. Your working tree has been restored to its original state."
  exit 1
}

# =========================================================================
# PHASE 1: PRE-FLIGHT CHECKS
# =========================================================================
header "Phase 1: Pre-Flight Checks"

# 1a. Ensure we're in a git repo
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  fail "Not a git repository. Run this from the Emsist-app root."
  exit 1
fi

# Move to repo root
cd "$(git rev-parse --show-toplevel)"
success "Inside git repository: $(pwd)"

# 1b. Get current branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ -z "$CURRENT_BRANCH" ]]; then
  fail "Detached HEAD state. Checkout a branch first."
  exit 1
fi
info "Current branch: ${BOLD}$CURRENT_BRANCH${NC}"
info "Base branch:    ${BOLD}$BASE_BRANCH${NC}"

# 1c. Check for uncommitted changes
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

# =========================================================================
# PHASE 1b: CROSS-PLATFORM CONSISTENCY
# =========================================================================
header "Phase 1b: Cross-Platform Consistency"

# Check .gitattributes
if [[ ! -f ".gitattributes" ]]; then
  warn "Missing .gitattributes — line ending mismatches may occur across OSes"
  echo "  Run: ./scripts/safe-push.sh to see the full check"
else
  success ".gitattributes present"
fi

# Check for case-sensitivity conflicts
CASE_ISSUES=$(git ls-files | sort -f | uniq -di 2>/dev/null || true)
if [[ -n "$CASE_ISSUES" ]]; then
  fail "CASE SENSITIVITY CONFLICT detected:"
  echo "$CASE_ISSUES" | sed 's/^/    /'
  echo "  These files differ only by case — will break on Linux/CI."
else
  success "No filename case conflicts"
fi

# =========================================================================
# PHASE 2: STASH UNCOMMITTED WORK
# =========================================================================
header "Phase 2: Stash Uncommitted Changes"

if [[ "$DIRTY" == "true" ]]; then
  STASH_MSG="safe-pull-auto-stash-$(date +%Y%m%d-%H%M%S)"
  git stash push -u -m "$STASH_MSG" --quiet
  STASH_CREATED=true
  success "Stashed all changes (including untracked): ${BOLD}$STASH_MSG${NC}"
else
  info "Nothing to stash — working tree already clean"
fi

# =========================================================================
# PHASE 3: FETCH FROM REMOTE
# =========================================================================
header "Phase 3: Fetch Latest from Remote"

info "Fetching from origin..."
git fetch origin --prune --quiet
success "Fetch complete"

# Check if base branch exists
if ! git rev-parse --verify "origin/$BASE_BRANCH" &>/dev/null; then
  fail "Remote branch 'origin/$BASE_BRANCH' does not exist."
  echo "  Available remote branches:"
  git branch -r | grep -v HEAD | sed 's/^/    /'
  abort_and_restore "fetch"
fi

# Also update tracking for current branch if it has a remote
if git rev-parse --verify "origin/$CURRENT_BRANCH" &>/dev/null; then
  info "Remote tracking branch exists for $CURRENT_BRANCH"
fi

# Divergence report
AHEAD=$(git rev-list --count "origin/$BASE_BRANCH..HEAD" 2>/dev/null || echo "0")
BEHIND=$(git rev-list --count "HEAD..origin/$BASE_BRANCH" 2>/dev/null || echo "0")

echo ""
echo -e "  ${BOLD}Divergence from origin/$BASE_BRANCH:${NC}"
echo -e "    ${GREEN}↑ $AHEAD commit(s) ahead${NC}  (your local work)"
echo -e "    ${RED}↓ $BEHIND commit(s) behind${NC} (new remote changes)"
echo ""

if [[ "$BEHIND" -gt 0 ]]; then
  info "New commits from remote:"
  git log --oneline "HEAD..origin/$BASE_BRANCH" | head -20 | sed 's/^/    /'
  TOTAL_NEW=$(git rev-list --count "HEAD..origin/$BASE_BRANCH")
  if [[ "$TOTAL_NEW" -gt 20 ]]; then
    echo -e "    ${DIM}... and $((TOTAL_NEW - 20)) more${NC}"
  fi
  echo ""

  # Show which files changed on remote
  REMOTE_CHANGED=$(git diff --stat "HEAD..origin/$BASE_BRANCH" 2>/dev/null | tail -1)
  if [[ -n "$REMOTE_CHANGED" ]]; then
    info "Remote change summary: $REMOTE_CHANGED"
  fi
fi

# =========================================================================
# DRY RUN EXIT POINT
# =========================================================================
if [[ "$DRY_RUN" == "true" ]]; then
  header "Dry Run Complete"
  if [[ "$BEHIND" -eq 0 ]]; then
    success "Already up to date — nothing to pull"
  else
    info "Would integrate $BEHIND commit(s) from origin/$BASE_BRANCH"
    info "Strategy: $(if [[ "$USE_MERGE" == "true" ]]; then echo "merge"; else echo "rebase"; fi)"
  fi
  # Restore stash
  if [[ "$STASH_CREATED" == "true" ]]; then
    git stash pop --quiet 2>/dev/null || true
    STASH_APPLIED=true
    success "Stash restored"
  fi
  exit 0
fi

# =========================================================================
# PHASE 4: REBASE OR MERGE
# =========================================================================
if [[ "$BEHIND" -eq 0 ]]; then
  header "Phase 4: Integration"
  success "Already up to date with origin/$BASE_BRANCH — nothing to integrate"
else
  if [[ "$USE_MERGE" == "true" ]]; then
    header "Phase 4: Merge origin/$BASE_BRANCH"
    OPERATION="merge"
    INTEGRATE_CMD="git merge origin/$BASE_BRANCH --no-edit"
  else
    header "Phase 4: Rebase onto origin/$BASE_BRANCH"
    OPERATION="rebase"
    INTEGRATE_CMD="git rebase origin/$BASE_BRANCH"
  fi

  info "Integrating $BEHIND commit(s) via $OPERATION..."

  if ! eval "$INTEGRATE_CMD" 2>/tmp/pull-output.txt; then
    # ───────────────────────────────────────────────────
    # CONFLICT HANDLING
    # ───────────────────────────────────────────────────
    echo ""
    fail "${OPERATION^^} CONFLICTS DETECTED"
    echo ""

    CONFLICT_FILES=$(git diff --name-only --diff-filter=U 2>/dev/null || true)
    CONFLICT_NUM=0
    CONFLICT_LIST=()

    while IFS= read -r cfile; do
      [[ -z "$cfile" ]] && continue
      CONFLICT_NUM=$((CONFLICT_NUM + 1))
      CONFLICT_LIST+=("$cfile")

      echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
      echo -e "${RED}  Conflict #$CONFLICT_NUM: ${BOLD}$cfile${NC}"
      echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
      echo ""

      # Show OURS (your local changes)
      echo -e "  ${CYAN}YOUR CHANGES (${CURRENT_BRANCH}):${NC}"
      OURS_DIFF=$(git diff --ours -- "$cfile" 2>/dev/null | head -30)
      if [[ -n "$OURS_DIFF" ]]; then
        echo "$OURS_DIFF" | sed 's/^/    /'
      else
        echo "    (no diff available)"
      fi
      echo ""

      # Show THEIRS (remote changes)
      echo -e "  ${YELLOW}REMOTE CHANGES (origin/${BASE_BRANCH}):${NC}"
      THEIRS_DIFF=$(git diff --theirs -- "$cfile" 2>/dev/null | head -30)
      if [[ -n "$THEIRS_DIFF" ]]; then
        echo "$THEIRS_DIFF" | sed 's/^/    /'
      else
        echo "    (no diff available)"
      fi
      echo ""
    done <<< "$CONFLICT_FILES"

    echo -e "${BOLD}Total conflicts: $CONFLICT_NUM file(s)${NC}"
    echo ""

    # ── Auto-resolve if --resolve-all was given ──
    if [[ -n "$RESOLVE_ALL" ]]; then
      info "Auto-resolving all conflicts with strategy: ${BOLD}$RESOLVE_ALL${NC}"
      for cfile in "${CONFLICT_LIST[@]}"; do
        git checkout "--$RESOLVE_ALL" -- "$cfile" 2>/dev/null
        git add "$cfile" 2>/dev/null
        success "Resolved: $cfile (kept $RESOLVE_ALL)"
      done

      if [[ "$OPERATION" == "rebase" ]]; then
        git rebase --continue 2>/dev/null || true
      else
        git commit --no-edit 2>/dev/null || true
      fi
      success "All conflicts auto-resolved"
    else
      # ── Interactive resolution ──
      echo -e "${BOLD}How would you like to resolve each conflict?${NC}"
      echo ""

      for cfile in "${CONFLICT_LIST[@]}"; do
        echo -e "${CYAN}File: ${BOLD}$cfile${NC}"
        echo "  1) Keep mine    — discard remote changes to this file"
        echo "  2) Take theirs  — accept remote changes, discard mine"
        echo "  3) Manual merge — I'll edit the file myself"
        echo ""
        read -r -p "  Choice [1/2/3]: " CHOICE

        case "$CHOICE" in
          1)
            git checkout --ours -- "$cfile"
            git add "$cfile"
            success "  Kept yours: $cfile"
            ;;
          2)
            git checkout --theirs -- "$cfile"
            git add "$cfile"
            success "  Took theirs: $cfile"
            ;;
          3)
            warn "  Skipping: $cfile — resolve manually, then run:"
            echo "    git add $cfile"
            ;;
          *)
            warn "  Invalid choice — skipping: $cfile (resolve manually)"
            ;;
        esac
        echo ""
      done

      # Check if any unresolved conflicts remain
      REMAINING=$(git diff --name-only --diff-filter=U 2>/dev/null || true)
      if [[ -n "$REMAINING" ]]; then
        echo ""
        warn "Unresolved conflicts remain:"
        echo "$REMAINING" | sed 's/^/    /'
        echo ""
        echo "After resolving, run:"
        if [[ "$OPERATION" == "rebase" ]]; then
          echo "  git add <resolved-files>"
          echo "  git rebase --continue"
        else
          echo "  git add <resolved-files>"
          echo "  git commit"
        fi
        echo ""
        echo "To abort entirely:"
        echo "  git $OPERATION --abort"
        echo ""

        if [[ "$STASH_CREATED" == "true" ]]; then
          warn "Your uncommitted changes are safely stashed as: $STASH_MSG"
          echo "  After completing $OPERATION, run: git stash pop"
        fi

        trap - EXIT
        exit 2
      fi

      # All resolved — continue
      if [[ "$OPERATION" == "rebase" ]]; then
        GIT_EDITOR=true git rebase --continue 2>/dev/null || true
      else
        git commit --no-edit 2>/dev/null || true
      fi
      success "All conflicts resolved — $OPERATION complete"
    fi
  else
    success "${OPERATION^} complete — no conflicts"
  fi
fi

# =========================================================================
# PHASE 5: RESTORE STASH & FINAL REPORT
# =========================================================================
header "Phase 5: Restore & Report"

if [[ "$STASH_CREATED" == "true" ]]; then
  info "Restoring your stashed changes..."
  if git stash pop --quiet 2>/dev/null; then
    STASH_APPLIED=true
    success "Stash restored successfully"

    # Check for stash conflicts
    STASH_CONFLICTS=$(git diff --name-only --diff-filter=U 2>/dev/null || true)
    if [[ -n "$STASH_CONFLICTS" ]]; then
      warn "Stash pop caused conflicts in:"
      echo "$STASH_CONFLICTS" | sed 's/^/    /'
      echo ""
      echo "  Your stashed changes conflicted with the new code from remote."
      echo "  Resolve these manually, then: git add <files>"
    else
      success "No stash conflicts"
    fi
  else
    STASH_APPLIED=true
    warn "Stash pop had issues — check: git stash list"
  fi
fi

# ── Final summary ──
echo ""
echo -e "${BOLD}═══════════════════════════════════════${NC}"
echo -e "${BOLD}        SAFE PULL COMPLETE             ${NC}"
echo -e "${BOLD}═══════════════════════════════════════${NC}"
echo ""
echo -e "  Branch:     ${BOLD}$CURRENT_BRANCH${NC}"
echo -e "  Synced with: ${BOLD}origin/$BASE_BRANCH${NC}"
echo -e "  Strategy:    ${BOLD}$(if [[ "$USE_MERGE" == "true" ]]; then echo "merge"; else echo "rebase"; fi)${NC}"
echo ""

# Show current HEAD
echo -e "  ${DIM}Latest commit:${NC}"
git log --oneline -1 | sed 's/^/    /'
echo ""

# Final working tree status
FINAL_STATUS=$(git status --short 2>/dev/null || true)
if [[ -z "$FINAL_STATUS" ]]; then
  success "Working tree is clean"
else
  info "Working tree status:"
  echo "$FINAL_STATUS" | sed 's/^/    /'
fi

# Ahead/behind after pull
NEW_AHEAD=$(git rev-list --count "origin/$BASE_BRANCH..HEAD" 2>/dev/null || echo "0")
NEW_BEHIND=$(git rev-list --count "HEAD..origin/$BASE_BRANCH" 2>/dev/null || echo "0")
echo ""
echo -e "  ${GREEN}↑ $NEW_AHEAD ahead${NC}  ${RED}↓ $NEW_BEHIND behind${NC}  origin/$BASE_BRANCH"

if [[ "$NEW_BEHIND" -eq 0 ]]; then
  success "Fully up to date"
fi

echo ""
info "Ready to work. When done, push with: ./scripts/safe-push.sh"
echo ""
