#!/bin/bash

#==============================================================================
# Governance Principles Validation Script
# Version: 1.0.0
# Date: 2026-02-25
#
# Purpose: Validate that all governance principle files exist and contain
#          required sections.
#
# Usage: ./validate-principles.sh [--verbose] [--fix]
#==============================================================================

# Don't exit on error - we track failures manually
# set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GOVERNANCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENTS_DIR="${GOVERNANCE_DIR}/agents"
CHECKLISTS_DIR="${GOVERNANCE_DIR}/checklists"
VALIDATION_DIR="${GOVERNANCE_DIR}/validation"

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Verbose mode
VERBOSE=false
if [[ "$1" == "--verbose" ]] || [[ "$2" == "--verbose" ]]; then
    VERBOSE=true
fi

#==============================================================================
# Helper Functions
#==============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

log_failure() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

log_verbose() {
    if $VERBOSE; then
        echo -e "       $1"
    fi
}

#==============================================================================
# Validation Functions
#==============================================================================

# Check if a file exists
check_file_exists() {
    local file="$1"
    local description="$2"

    if [[ -f "$file" ]]; then
        log_success "$description exists"
        return 0
    else
        log_failure "$description missing: $file"
        return 1
    fi
}

# Check if a section exists in a file
check_section_exists() {
    local file="$1"
    local section="$2"
    local description="$3"

    if grep -q "^## $section" "$file" 2>/dev/null || grep -q "^# $section" "$file" 2>/dev/null; then
        log_verbose "Section '$section' found"
        return 0
    else
        log_failure "$description: Missing section '$section'"
        return 1
    fi
}

# Count items in a section (numbered list or checkboxes)
count_section_items() {
    local file="$1"
    local section="$2"
    local minimum="$3"

    # Extract section and count numbered items or checkboxes
    # The section ends at the next ## heading
    local count
    count=$(awk "/^## ${section}/,/^## [^${section}]/" "$file" 2>/dev/null | grep -cE "^[0-9]+\. |^- \[|^- Never|^- \*\*" 2>/dev/null || true)
    count=${count:-0}
    count=$(echo "$count" | tr -d '[:space:]')

    if [[ "$count" -ge "$minimum" ]]; then
        log_verbose "Section '$section' has $count items (minimum: $minimum)"
        return 0
    else
        log_warning "Section '$section' has $count items (minimum: $minimum)"
        return 1
    fi
}

# Validate version format
check_version_format() {
    local file="$1"

    if grep -qE "Version:.*[0-9]+\.[0-9]+\.[0-9]+" "$file"; then
        log_verbose "Version format valid"
        return 0
    else
        log_warning "Version format may be invalid in $file"
        return 1
    fi
}

# Validate date format
check_date_format() {
    local file="$1"

    if grep -qE "Last Updated:.*[0-9]{4}-[0-9]{2}-[0-9]{2}" "$file"; then
        log_verbose "Date format valid"
        return 0
    else
        log_warning "Date format may be invalid in $file"
        return 1
    fi
}

#==============================================================================
# Main Validation
#==============================================================================

echo ""
echo "=============================================="
echo "  Governance Principles Validation"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="
echo ""

#------------------------------------------------------------------------------
# 1. Check Governance Framework
#------------------------------------------------------------------------------
log_info "Checking Governance Framework..."

check_file_exists "${GOVERNANCE_DIR}/GOVERNANCE-FRAMEWORK.md" "Governance Framework"
check_file_exists "${GOVERNANCE_DIR}/PENDING-QUESTIONS.md" "Pending Questions"

#------------------------------------------------------------------------------
# 2. Check Agent Principle Files
#------------------------------------------------------------------------------
log_info "Checking Agent Principle Files..."

AGENT_FILES=(
    "ARCH-PRINCIPLES.md"
    "SA-PRINCIPLES.md"
    "BA-PRINCIPLES.md"
    "DEV-PRINCIPLES.md"
    "DBA-PRINCIPLES.md"
    "QA-PRINCIPLES.md"
    "SEC-PRINCIPLES.md"
    "DEVOPS-PRINCIPLES.md"
    "DOC-PRINCIPLES.md"
)

REQUIRED_SECTIONS=(
    "Version"
    "MANDATORY (Read Before Any Work)"
    "Standards"
    "Forbidden Practices"
    "Checklist Before Completion"
    "Continuous Improvement"
    "Changelog"
)

for file in "${AGENT_FILES[@]}"; do
    filepath="${AGENTS_DIR}/${file}"
    agent_name="${file%-PRINCIPLES.md}"

    echo ""
    log_info "Validating ${agent_name} principles..."

    if check_file_exists "$filepath" "${agent_name} principles file"; then
        # Check required sections
        for section in "${REQUIRED_SECTIONS[@]}"; do
            check_section_exists "$filepath" "$section" "$agent_name"
        done

        # Check version and date format
        check_version_format "$filepath"
        check_date_format "$filepath"

        # Check minimum items in key sections
        count_section_items "$filepath" "MANDATORY" 5
        count_section_items "$filepath" "Forbidden Practices" 5
        count_section_items "$filepath" "Checklist Before Completion" 5
    fi
done

#------------------------------------------------------------------------------
# 3. Check Checklist Files
#------------------------------------------------------------------------------
echo ""
log_info "Checking Checklist Files..."

CHECKLIST_FILES=(
    "pre-commit-checklist.md"
    "design-review-checklist.md"
    "release-checklist.md"
)

for file in "${CHECKLIST_FILES[@]}"; do
    filepath="${CHECKLISTS_DIR}/${file}"

    if check_file_exists "$filepath" "Checklist: $file"; then
        # Check for checkbox items
        checkbox_count=$(grep -cE "^- \[ \]" "$filepath" || echo "0")
        if [[ "$checkbox_count" -ge 5 ]]; then
            log_verbose "Checklist has $checkbox_count items"
        else
            log_warning "Checklist has only $checkbox_count items (minimum: 5)"
        fi
    fi
done

#------------------------------------------------------------------------------
# 4. Check Validation Files
#------------------------------------------------------------------------------
echo ""
log_info "Checking Validation Files..."

check_file_exists "${VALIDATION_DIR}/validation-rules.json" "Validation rules"

#------------------------------------------------------------------------------
# 5. Check Metrics Files
#------------------------------------------------------------------------------
echo ""
log_info "Checking Metrics Files..."

check_file_exists "${GOVERNANCE_DIR}/metrics/METRICS-DASHBOARD.md" "Metrics Dashboard"
check_file_exists "${GOVERNANCE_DIR}/metrics/governance-metrics.json" "Metrics Data"

#------------------------------------------------------------------------------
# Summary
#------------------------------------------------------------------------------
echo ""
echo "=============================================="
echo "  Validation Summary"
echo "=============================================="
echo ""
echo -e "Total Checks:  ${TOTAL_CHECKS}"
echo -e "Passed:        ${GREEN}${PASSED_CHECKS}${NC}"
echo -e "Failed:        ${RED}${FAILED_CHECKS}${NC}"
echo -e "Warnings:      ${YELLOW}${WARNINGS}${NC}"
echo ""

if [[ $FAILED_CHECKS -eq 0 ]]; then
    echo -e "${GREEN}All validations passed!${NC}"
    exit 0
else
    echo -e "${RED}Validation failed with ${FAILED_CHECKS} errors.${NC}"
    exit 1
fi
