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
if [ -z "$CLIENT" ]; then
  echo -e "${RED}Error: --client is required${NC}"
  exit 1
fi

if [ -z "$TEST" ]; then
  echo -e "${RED}Error: --test is required${NC}"
  exit 1
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

echo -e "${GREEN}Test completed!${NC}"
