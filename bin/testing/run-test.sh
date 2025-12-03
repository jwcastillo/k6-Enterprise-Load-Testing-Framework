#!/bin/bash

# run-test.sh - Wrapper script for running k6 tests
# Usage: ./bin/run-test.sh --client=client-a --env=staging --test=example.ts [--profile=load]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
CLIENT=""
ENV="default"
TEST=""
PROFILE=""

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
    --test=*)
      TEST="${arg#*=}"
      shift
      ;;
    --profile=*)
      PROFILE="${arg#*=}"
      shift
      ;;
    --help)
      echo "Usage: ./bin/run-test.sh --client=<client> --env=<env> --test=<test> [--profile=<profile>]"
      echo ""
      echo "Options:"
      echo "  --client    Client name (required)"
      echo "  --env       Environment (default: default)"
      echo "  --test      Test file name (required)"
      echo "  --profile   Load profile: smoke, load, stress, spike (optional)"
      echo ""
      echo "Examples:"
      echo "  ./bin/run-test.sh --client=client-a --test=example.ts"
      echo "  ./bin/run-test.sh --client=client-a --env=staging --test=auth-flow.ts --profile=load"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown argument: $arg${NC}"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [ -z "$CLIENT" ] || [ -z "$TEST" ]; then
  echo -e "${RED}Error: --client and --test are required${NC}"
  echo "Run with --help for usage information"
  exit 1
fi

echo -e "${GREEN}🔍 Validating configuration...${NC}"

# Validate configuration before running test
if [ -f "bin/cli/validate-config.js" ]; then
  if ! node bin/cli/validate-config.js --client="$CLIENT" --env="$ENV"; then
    echo -e "${RED}❌ Configuration validation failed${NC}"
    echo -e "${YELLOW}💡 Fix the configuration errors above before running tests${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Configuration is valid${NC}"
  echo ""
else
  echo -e "${YELLOW}⚠️  Config validator not found, skipping validation${NC}"
  echo -e "${YELLOW}   Run 'npm run build' to enable config validation${NC}"
  echo ""
fi

# Build the project
echo -e "${YELLOW}Building project...${NC}"
npm run build

# Prepare command
CMD="node dist/core/cli.js --client=$CLIENT --env=$ENV --test=$TEST"

# Add profile if specified
if [ -n "$PROFILE" ]; then
  echo -e "${YELLOW}Using profile: $PROFILE${NC}"
  export K6_PROFILE=$PROFILE
fi

# Run the test
echo -e "${GREEN}Running test: $TEST for client: $CLIENT (env: $ENV)${NC}"
echo "Command: $CMD"
echo ""

$CMD

TEST_EXIT_CODE=$?

# Auto-compare with previous results
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo ""
  echo -e "${BLUE}🔍 Comparing with previous results...${NC}"
  
  if [ -f "bin/testing/auto-compare.js" ]; then
    node bin/testing/auto-compare.js --client="$CLIENT" --test="$TEST" || true
  else
    echo -e "${YELLOW}⚠️  Auto-compare not available${NC}"
  fi
fi

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}Test completed successfully!${NC}"
else
  echo -e "${RED}Test failed!${NC}"
fi

exit $TEST_EXIT_CODE
