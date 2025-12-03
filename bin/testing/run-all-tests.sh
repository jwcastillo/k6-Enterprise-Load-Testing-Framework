#!/bin/bash

# run-all-tests.sh - Run all tests in a client's scenarios directory
# Usage: ./bin/testing/run-all-tests.sh --client=examples [--env=default] [--concurrency=4]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
CLIENT=""
ENV="default"
CONCURRENCY=1
PATTERN=""

# Parse arguments
for arg in "$@"; do
  case $arg in
    --client=*)
      CLIENT="${arg#*=}"
      shift
      ;;
    --env=*)
      ENV="${arg#*=}"
      shift
      ;;
    --concurrency=*)
      CONCURRENCY="${arg#*=}"
      shift
      ;;
    --pattern=*)
      PATTERN="${arg#*=}"
      shift
      ;;
    --help)
      echo "Usage: ./bin/testing/run-all-tests.sh --client=<client> [options]"
      echo ""
      echo "Options:"
      echo "  --client        Client name (required)"
      echo "  --env           Environment (default: default)"
      echo "  --concurrency   Number of parallel tests (default: 1)"
      echo "  --pattern       Test file pattern (default: *.ts)"
      echo ""
      echo "Examples:"
      echo "  ./bin/testing/run-all-tests.sh --client=examples"
      echo "  ./bin/testing/run-all-tests.sh --client=examples --env=staging --concurrency=2"
      echo "  ./bin/testing/run-all-tests.sh --client=examples --pattern=auth*.ts"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown argument: $arg${NC}"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [ -z "$CLIENT" ]; then
  echo -e "${RED}Error: --client is required${NC}"
  echo "Run with --help for usage information"
  exit 1
fi

# Set pattern if not provided
if [ -z "$PATTERN" ]; then
  PATTERN="*.ts"
fi

# Check if client directory exists
CLIENT_DIR="clients/$CLIENT/scenarios"
if [ ! -d "$CLIENT_DIR" ]; then
  echo -e "${RED}Error: Client directory not found: $CLIENT_DIR${NC}"
  exit 1
fi

# Build the project
echo -e "${BLUE}📦 Building project...${NC}"
npm run build > /dev/null 2>&1

# Validate configuration
echo -e "${BLUE}🔍 Validating configuration...${NC}"
if [ -f "bin/cli/validate-config.js" ]; then
  if ! node bin/cli/validate-config.js --client="$CLIENT" --env="$ENV" 2>/dev/null; then
    echo -e "${RED}❌ Configuration validation failed${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Configuration is valid${NC}"
else
  echo -e "${YELLOW}⚠️  Config validator not found, skipping validation${NC}"
fi

# Find test files
TEST_FILES=($CLIENT_DIR/$PATTERN)
TEST_COUNT=${#TEST_FILES[@]}

if [ $TEST_COUNT -eq 0 ]; then
  echo -e "${RED}Error: No test files found matching pattern: $CLIENT_DIR/$PATTERN${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Running All Tests for Client: $CLIENT       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Client:${NC}       $CLIENT"
echo -e "${BLUE}Environment:${NC}  $ENV"
echo -e "${BLUE}Tests Found:${NC}  $TEST_COUNT"
echo -e "${BLUE}Concurrency:${NC}  $CONCURRENCY"
echo -e "${BLUE}Pattern:${NC}      $PATTERN"
echo ""

# Create results directory
RESULTS_DIR="reports/$CLIENT/all-tests-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"

# Run tests using parallel runner
echo -e "${GREEN}🚀 Starting test execution...${NC}"
echo ""

node bin/testing/run-parallel.js \
  --client="$CLIENT" \
  --env="$ENV" \
  --tests="$CLIENT_DIR/$PATTERN" \
  --concurrency="$CONCURRENCY" \
  | tee "$RESULTS_DIR/execution.log"

EXIT_CODE=${PIPESTATUS[0]}

# Generate summary report
echo ""
echo -e "${BLUE}📊 Generating summary report...${NC}"

cat > "$RESULTS_DIR/summary.md" << EOF
# Test Execution Summary

## Configuration
- **Client**: $CLIENT
- **Environment**: $ENV
- **Date**: $(date '+%Y-%m-%d %H:%M:%S')
- **Tests Found**: $TEST_COUNT
- **Concurrency**: $CONCURRENCY
- **Pattern**: $PATTERN

## Results

See \`execution.log\` for detailed output.

## Individual Test Reports

EOF

# List all generated reports
for test_file in "${TEST_FILES[@]}"; do
  test_name=$(basename "$test_file" .ts)
  test_report_dir="reports/$CLIENT/$test_name"
  
  if [ -d "$test_report_dir" ]; then
    latest_report=$(ls -t "$test_report_dir"/k6-dashboard-*.html 2>/dev/null | head -1)
    if [ -n "$latest_report" ]; then
      echo "- [$test_name]($latest_report)" >> "$RESULTS_DIR/summary.md"
    fi
  fi
done

echo ""
echo -e "${GREEN}✅ Summary report generated: $RESULTS_DIR/summary.md${NC}"
echo ""

# Print results location
echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  Results Location                      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}      $RESULTS_DIR/summary.md"
echo -e "${BLUE}Logs:${NC}         $RESULTS_DIR/execution.log"
echo -e "${BLUE}Reports:${NC}      reports/$CLIENT/<test-name>/"
echo ""

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
else
  echo -e "${RED}❌ Some tests failed. Check the logs for details.${NC}"
fi

exit $EXIT_CODE
