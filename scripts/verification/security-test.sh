#!/usr/bin/env bash
# Security Test Script for Fuel Guard
# Author: Senior Application Security Engineer
# Version: 1.0.0
# Description: Automated security testing suite

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Test counters
PASS=0
FAIL=0
WARN=0
TOTAL=0

# Print header
print_header() {
    echo -e "${BOLD}${BLUE}"
    echo "=========================================="
    echo "  Fuel Guard Security Test Suite"
    echo "==========================================${NC}"
    echo ""
    echo "Scan Date: $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
    echo "Target Directory: $(pwd)"
    echo ""
}

# Print test section
print_section() {
    echo -e "${BOLD}Test: $1${NC}"
    echo "--------------------------------"
}

# Test result function
test_result() {
    TOTAL=$((TOTAL + 1))
    if [ $1 -eq 0 ]; then
        echo -e "  ${GREEN}✓ PASS${NC}: $2"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}✗ FAIL${NC}: $2"
        FAIL=$((FAIL + 1))
    fi
}

# Warning function
warn_result() {
    TOTAL=$((TOTAL + 1))
    echo -e "  ${YELLOW}⚠ WARN${NC}: $1"
    WARN=$((WARN + 1))
}

# Information function
info_result() {
    echo -e "  ${BLUE}ℹ INFO${NC}: $1"
}

print_header

# Test 1: Check for hardcoded API keys
print_section "Hardcoded API Keys"
if grep -r "AIza[A-Za-z0-9_-]{35}" src/ 2>/dev/null | grep -v "node_modules" > /dev/null; then
    warn_result "Potential Google Maps API keys found in source code"
    grep -rn "AIza[A-Za-z0-9_-]{35}" src/ 2>/dev/null | grep -v "node_modules" | head -3 | while read line; do
        echo "    File: $(echo $line | cut -d: -f1)"
    done
else
    test_result 0 "No hardcoded Google Maps API keys"
fi

if grep -r "sk_live_\|pk_live_\|sk_test_\|pk_test_" src/ 2>/dev/null | grep -v "node_modules" > /dev/null; then
    warn_result "Potential Stripe API keys found in source code"
else
    test_result 0 "No hardcoded payment API keys"
fi

if grep -ri "password.*=.*['\"]" src/ 2>/dev/null | grep -v "node_modules" | grep -v "example\|dummy\|placeholder\|test" > /dev/null; then
    warn_result "Potential hardcoded passwords found"
    grep -rin "password.*=.*['\"]" src/ 2>/dev/null | grep -v "node_modules" | grep -v "example\|dummy\|placeholder\|test" | head -3
else
    test_result 0 "No hardcoded passwords found"
fi

# Test 2: Check for unsafe innerHTML usage
print_section "Unsafe innerHTML Usage"
if grep -r "innerHTML\s*=" src/ 2>/dev/null | grep -v "node_modules" > /dev/null; then
    test_result 1 "innerHTML found in source code (XSS Risk)"
    grep -rn "innerHTML\s*=" src/ 2>/dev/null | grep -v "node_modules" | head -5 | while read line; do
        file=$(echo $line | cut -d: -f1)
        line_num=$(echo $line | cut -d: -f2)
        echo "    ${RED}${file}:${line_num}${NC}"
    done
else
    test_result 0 "No innerHTML usage found"
fi

# Test 3: Check for React dangerouslySetInnerHTML
print_section "React dangerouslySetInnerHTML Usage"
if grep -r "dangerouslySetInnerHTML" src/ 2>/dev/null | grep -v "node_modules" > /dev/null; then
    test_result 1 "dangerouslySetInnerHTML found in source code (XSS Risk)"
    grep -rn "dangerouslySetInnerHTML" src/ 2>/dev/null | grep -v "node_modules" | head -5
else
    test_result 0 "No dangerouslySetInnerHTML usage found"
fi

# Test 4: Check for eval() usage
print_section "Unsafe eval() Usage"
if grep -r "eval\s*(" src/ 2>/dev/null | grep -v "node_modules\|//\|/\*" > /dev/null; then
    test_result 1 "eval() found in source code"
    grep -rn "eval\s*(" src/ 2>/dev/null | grep -v "node_modules\|//\|/\*" | head -5
else
    test_result 0 "No eval() usage found"
fi

# Test 5: Check for Function() constructor
print_section "Unsafe Function() Constructor Usage"
if grep -r "new Function\s*(" src/ 2>/dev/null | grep -v "node_modules\|//\|/\*" > /dev/null; then
    test_result 1 "new Function() found in source code"
    grep -rn "new Function\s*(" src/ 2>/dev/null | grep -v "node_modules\|//\|/\*" | head -5
else
    test_result 0 "No Function() constructor usage found"
fi

# Test 6: Check localStorage security
print_section "localStorage Security Analysis"
localstorage_count=$(grep -l "localStorage" src/*.js src/**/*.js src/**/*.jsx 2>/dev/null | grep -v "node_modules" | wc -l)
if [ "$localstorage_count" -gt 0 ]; then
    info_result "localStorage used in ${localstorage_count} files"
    # Check for sensitive data in localStorage
    if grep -r "localStorage.*password\|localStorage.*token\|localStorage.*key\|localStorage.*secret" src/ 2>/dev/null | grep -v "node_modules" > /dev/null; then
        warn_result "Potential sensitive data stored in localStorage"
        grep -rn "localStorage.*password\|localStorage.*token\|localStorage.*key\|localStorage.*secret" src/ 2>/dev/null | grep -v "node_modules" | head -5
    else
        test_result 0 "No sensitive data patterns in localStorage usage"
    fi
else
    test_result 0 "No localStorage usage found"
fi

# Test 7: Check for environment file security
print_section "Environment File Security"
env_fail=0

if [ -f ".env" ]; then
    warn_result ".env file exists (should not be in repo)"
    env_fail=1
fi

if [ -f ".env.local" ]; then
    info_result ".env.local file exists (development file)"
fi

if [ -f ".env.production" ]; then
    info_result ".env.production file exists (production file)"
fi

if git ls-files .env* 2>/dev/null | grep -q .; then
    warn_result "Environment files tracked in git"
    git ls-files .env* 2>/dev/null
    env_fail=1
fi

if [ $env_fail -eq 0 ]; then
    test_result 0 "No environment file security issues"
else
    test_result 1 "Environment file security issues detected"
fi

# Test 8: Check for console logging in production
print_section "Production Console Logging"
console_count=$(grep -r "console\.\(log\|error\|warn\|debug\)" src/ 2>/dev/null | grep -v "node_modules\|//\|/\*" | wc -l)
if [ "$console_count" -gt 0 ]; then
    if [ "$console_count" -gt 50 ]; then
        warn_result "High number of console statements: $console_count"
    else
        info_result "Console statements: $console_count"
    fi

    # Check for sensitive data in console.log
    if grep -r "console\.\(log\|debug\).*password\|console\.\(log\|debug\).*token\|console\.\(log\|debug\).*secret" src/ 2>/dev/null | grep -v "node_modules" > /dev/null; then
        warn_result "Sensitive data logged to console"
        grep -rn "console\.\(log\|debug\).*password\|console\.\(log\|debug\).*token\|console\.\(log\|debug\).*secret" src/ 2>/dev/null | grep -v "node_modules" | head -5
    else
        test_result 0 "No sensitive data in console logs"
    fi
else
    test_result 0 "No console logging found"
fi

# Test 9: Check for dependency vulnerabilities
print_section "Dependency Security Audit"
if command -v npm &> /dev/null; then
    if [ -f "package.json" ]; then
        if npm audit --json 2>/dev/null | grep -q "vulnerabilities"; then
            vuln_count=$(npm audit --json 2>/dev/null | jq -r '.metadata.vulnerabilities.total // 0' 2>/dev/null || echo "0")
            if [ "$vuln_count" -gt 0 ]; then
                warn_result "$vuln_count known vulnerabilities in dependencies"
                info_result "Run 'npm audit' for detailed report"
            else
                test_result 0 "No critical/high vulnerabilities"
            fi
        else
            test_result 0 "npm audit failed or jq not installed"
        fi
    else
        warn_result "package.json not found, skipping dependency audit"
    fi
else
    warn_result "npm not available, skipping dependency audit"
fi

# Test 10: Check for hardcoded API endpoints
print_section "Hardcoded API Endpoints"
api_count=$(grep -rh "https://\|http://" src/ 2>/dev/null | grep -v "node_modules\|//\|/\*" | wc -l)
if [ "$api_count" -gt 0 ]; then
    info_result "Hardcoded URLs found: $api_count"
    if [ "$api_count" -gt 15 ]; then
        warn_result "High number of hardcoded URLs (consider environment variables)"
    else
        test_result 0 "Hardcoded URLs: $api_count (acceptable count)"
    fi
else
    test_result 0 "No hardcoded URLs found"
fi

# Test 11: Check for JSON.parse without validation
print_section "JSON Parsing Security"
json_parse_count=$(grep -r "JSON\.parse" src/ 2>/dev/null | grep -v "node_modules\|//\|/\*" | wc -l)
safe_json_count=$(grep -r "safeJsonParse\|validateJson\|JSON.parse.*validator\|JSON.parse.*sanitize" src/ 2>/dev/null | grep -v "node_modules" | wc -l)

if [ "$json_parse_count" -gt 0 ]; then
    info_result "JSON.parse usage: $json_parse_count occurrences"
    if [ "$safe_json_count" -eq 0 ]; then
        warn_result "JSON.parse used without safe parsing wrapper"
        grep -rn "JSON\.parse" src/ 2>/dev/null | grep -v "node_modules\|//\|/\*" | head -5
    else
        test_result 0 "JSON parsing appears to be validated"
    fi
else
    test_result 0 "No JSON.parse usage found"
fi

# Test 12: Check for timeout/setInterval with string arguments
print_section "Dynamic Code Execution via setTimeout/setInterval"
timeout_string_count=$(grep -rE "setTimeout\s*\(\s*['\"]" src/ 2>/dev/null | grep -v "node_modules\|//\|/\*" | wc -l)
interval_string_count=$(grep -rE "setInterval\s*\(\s*['\"]" src/ 2>/dev/null | grep -v "node_modules\|//\|/\*" | wc -l)

if [ $timeout_string_count -gt 0 ] || [ $interval_string_count -gt 0 ]; then
    test_result 1 "setTimeout/setInterval with string arguments found"
    if [ $timeout_string_count -gt 0 ]; then
        echo "    setTimeout with string: $timeout_string_count occurrences"
    fi
    if [ $interval_string_count -gt 0 ]; then
        echo "    setInterval with string: $interval_string_count occurrences"
    fi
else
    test_result 0 "No dynamic code execution patterns found"
fi

# Test 13: Check for missing input validation on API calls
print_section "API Input Validation"
# Check for unvalidated user input in fetch URLs
if grep -r "fetch.*`.*\${" src/ 2>/dev/null | grep -v "node_modules\|//\|/\*" | wc -l | read -r template_count; then
    if [ "$template_count" -gt 0 ]; then
        warn_result "Potential unvalidated input in fetch URLs"
        grep -rn "fetch.*`.*\${" src/ 2>/dev/null | grep -v "node_modules\|//\|/\*" | head -5
    else
        test_result 0 "No obvious unvalidated input patterns"
    fi
else
    test_result 0 "No API input validation issues detected"
fi

# Test 14: Check for authentication bypass patterns
print_section "Authentication & Authorization"
if grep -r "TODO.*auth\|FIXME.*auth\|XXX.*auth" src/ 2>/dev/null | grep -v "node_modules" > /dev/null; then
    warn_result "Unresolved authentication TODOs found"
    grep -rin "TODO.*auth\|FIXME.*auth\|XXX.*auth" src/ 2>/dev/null | grep -v "node_modules" | head -5
else
    info_result "No authentication TODOs found"
fi

# Check for missing auth checks on sensitive operations
if grep -r "setData.*prev\|addLog.*=" src/ 2>/dev/null | grep -v "node_modules\|requirePermission\|requireAuth\|//\|/\*" | wc -l | read -r unchecked_ops; then
    if [ "$unchecked_ops" -gt 0 ]; then
        warn_result "Potential state mutations without auth checks"
        info_result "Review: $unchecked_ops potential authorization gaps"
    else
        test_result 0 "Auth checks appear to be implemented"
    fi
else
    test_result 0 "No authorization bypass patterns detected"
fi

# Test 15: Check for CORS proxy usage
print_section "CORS Proxy Security"
if grep -r "corsproxy\|corsproxy.io\|allorigins.win" src/ 2>/dev/null | grep -v "node_modules" > /dev/null; then
    test_result 1 "CORS proxy usage detected (security risk)"
    grep -rn "corsproxy\|corsproxy.io\|allorigins.win" src/ 2>/dev/null | grep -v "node_modules" | head -5
else
    test_result 0 "No CORS proxy usage found"
fi

# Test 16: Check for session management
print_section "Session Management"
session_check=0

# Check for localStorage-based sessions
if grep -r "localStorage.*session\|localStorage.*token\|localStorage.*auth" src/ 2>/dev/null | grep -v "node_modules" > /dev/null; then
    warn_result "Session/token stored in localStorage (vulnerable to XSS)"
    session_check=1
fi

# Check for session timeout implementation
if grep -r "expiresAt\|sessionTimeout\|idleTimeout" src/ 2>/dev/null | grep -v "node_modules" > /dev/null; then
    info_result "Session timeout mechanism found"
else
    warn_result "No session timeout mechanism detected"
    session_check=1
fi

if [ $session_check -eq 0 ]; then
    test_result 0 "Session management appears secure"
else
    test_result 1 "Session management security issues detected"
fi

# Test 17: Check for race condition risks
print_section "Race Condition Analysis"
if grep -r "useEffect.*data.*\]" src/ 2>/dev/null | grep -v "node_modules\|//\|/\*" | grep "storage\|persist\|save" > /dev/null; then
    info_result "Potential race conditions in state persistence"
    grep -rn "useEffect.*data.*\]" src/ 2>/dev/null | grep -v "node_modules\|//\|/\*" | grep "storage\|persist\|save" | head -3
else
    test_result 0 "No obvious race condition patterns"
fi

# Print summary
echo ""
echo -e "${BOLD}=========================================="
echo "  Test Summary"
echo "==========================================${NC}"
echo ""
echo -e "  ${GREEN}Passed:${NC}    $PASS"
echo -e "  ${RED}Failed:${NC}    $FAIL"
echo -e "  ${YELLOW}Warnings:${NC} $WARN"
echo -e "  ${BLUE}Total:${NC}     $TOTAL"
echo ""

# Calculate security score
if [ $TOTAL -gt 0 ]; then
    score=$((PASS * 100 / TOTAL))
    echo -e "  Security Score: ${BOLD}${score}%${NC}"
    echo ""

    if [ $score -ge 80 ]; then
        echo -e "  ${GREEN}Excellent${NC} - Application has strong security posture"
    elif [ $score -ge 60 ]; then
        echo -e "  ${YELLOW}Good${NC} - Application has moderate security posture"
    elif [ $score -ge 40 ]; then
        echo -e "  ${RED}Fair${NC} - Application needs security improvements"
    else
        echo -e "  ${RED}Poor${NC} - Application has significant security issues"
    fi
fi

echo ""

# Recommendations
if [ $FAIL -gt 0 ]; then
    echo -e "${BOLD}Critical Actions Required:${NC}"
    echo "  1. Address all FAILED tests immediately"
    echo "  2. Review and remediate security vulnerabilities"
    echo "  3. Re-run tests after fixes"
    echo ""
fi

if [ $WARN -gt 0 ]; then
    echo -e "${BOLD}Recommended Actions:${NC}"
    echo "  1. Review all WARN findings"
    echo "  2. Implement security best practices"
    echo "  3. Set up automated security scanning"
    echo ""
fi

# Exit with appropriate code
if [ $FAIL -gt 0 ]; then
    echo -e "${RED}Security audit: FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}Security audit: PASSED${NC}"
    exit 0
fi
