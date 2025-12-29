#!/bin/bash

# ANSI Color Codes for Rich Aesthetics
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TESTS_DIR="./tests"
FAILED=0
PASSED=0

# Support custom all_in_one.cjs location via argument or environment variable
# Usage: ./test.sh [path/to/all_in_one.cjs]
# Or: ALL_IN_ONE=path/to/all_in_one.cjs ./test.sh
ALL_IN_ONE="${1:-${ALL_IN_ONE:-./all_in_one.cjs}}"
# Convert to absolute path for tests running in subdirectories
ALL_IN_ONE="$(cd "$(dirname "$ALL_IN_ONE")" && pwd)/$(basename "$ALL_IN_ONE")"
export ALL_IN_ONE

echo -e "${BOLD}${BLUE}🚀 Starting Functional JS Library Test Suite${NC}"
echo -e "   Using: ${YELLOW}$ALL_IN_ONE${NC}\n"

# Check if tests directory exists
if [ ! -d "$TESTS_DIR" ]; then
    echo -e "${RED}❌ Error: '$TESTS_DIR' directory not found.${NC}"
    exit 1
fi

# Find all *.test.js files
TEST_FILES=($(find "$TESTS_DIR" -name "*.test.js" | sort))

if [ ${#TEST_FILES[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️ No test files found (*.test.js) in $TESTS_DIR.${NC}"
    exit 0
fi

TOTAL=${#TEST_FILES[@]}
echo -e "${BOLD}Found $TOTAL test file(s)${NC}\n"

for i in "${!TEST_FILES[@]}"; do
    FILE="${TEST_FILES[$i]}"
    COUNT=$((i + 1))
    
    echo -e "${BOLD}[$COUNT/$TOTAL] Testing:${NC} ${BLUE}$FILE${NC}"
    echo -e "${BLUE}----------------------------------------${NC}"
    
    # Run node test file
    node "$FILE"
    
    if [ $? -eq 0 ]; then
        ((PASSED++))
    else
        echo -e "${RED}❌ Process failed for $FILE${NC}"
        ((FAILED++))
    fi
    
    echo -e "${BLUE}----------------------------------------${NC}\n"
done

# Final Summary
echo -e "${BOLD}📊 Test Summary${NC}"
echo -e "${BOLD}===============${NC}"
echo -e "Total Files:  $TOTAL"
echo -e "Passed:       ${GREEN}$PASSED${NC}"
echo -e "Failed:       ${RED}$FAILED${NC}"

if [ $FAILED -ne 0 ]; then
    echo -e "\n${RED}${BOLD}Tests finished with errors.${NC}"
    exit 1
else
    echo -e "\n${GREEN}${BOLD}All tests passed successfully!${NC}"
    exit 0
fi
