#!/bin/bash

# k6 Test Summary Generator
# Generates a beautiful summary of test results with fun messages

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Input parameters
REPORT_DIR="${1:-reports}"
CLIENT="${2:-local}"
TEST="${3:-test}"

# Find the latest test results
LATEST_DIR=$(find "$REPORT_DIR/$CLIENT/$TEST" -type d -name "*" 2>/dev/null | sort -r | head -1)

if [ -z "$LATEST_DIR" ]; then
  echo -e "${RED}❌ No test results found in $REPORT_DIR/$CLIENT/$TEST${NC}"
  exit 1
fi

# Find files
JSON_FILE=$(find "$LATEST_DIR" -name "k6-output-*.json" | head -1)
SUMMARY_FILE=$(find "$LATEST_DIR" -name "k6-summary-*.txt" | head -1)
DASHBOARD_FILE=$(find "$LATEST_DIR" -name "k6-dashboard-*.html" | head -1)
ENTERPRISE_FILE=$(find "$LATEST_DIR" -name "enterprise-report-*.html" | head -1)

# Extract metrics from summary file
if [ -f "$SUMMARY_FILE" ]; then
  # Extract checks
  CHECKS_LINE=$(grep "checks_succeeded" "$SUMMARY_FILE" | head -1)
  CHECKS_PASSED=$(echo "$CHECKS_LINE" | grep -oE '[0-9]+ out of' | grep -oE '[0-9]+' | head -1 || echo "0")
  CHECKS_TOTAL=$(echo "$CHECKS_LINE" | grep -oE 'out of [0-9]+' | grep -oE '[0-9]+' | head -1 || echo "0")
  
  CHECKS_FAILED_LINE=$(grep "checks_failed" "$SUMMARY_FILE" | head -1)
  CHECKS_FAILED=$(echo "$CHECKS_FAILED_LINE" | grep -oE '[0-9]+ out of' | grep -oE '[0-9]+' | head -1 || echo "0")
  
  # Extract HTTP requests and iterations
  HTTP_LINE=$(grep "http_reqs" "$SUMMARY_FILE" | head -1)
  HTTP_REQS=$(echo "$HTTP_LINE" | grep -oE ': [0-9]+' | grep -oE '[0-9]+' | head -1 || echo "0")
  
  ITER_LINE=$(grep "iterations" "$SUMMARY_FILE" | grep -v "iteration_duration" | head -1)
  ITERATIONS=$(echo "$ITER_LINE" | grep -oE ': [0-9]+' | grep -oE '[0-9]+' | head -1 || echo "0")
  
  # Extract duration
  DURATION=$(grep -oE 'running \([^)]+\)' "$SUMMARY_FILE" | tail -1 | sed 's/running (//' | sed 's/)//' || echo "unknown")
  
  # Check if thresholds passed
  THRESHOLDS_PASSED=true
  if grep -q "✗" "$SUMMARY_FILE"; then
    THRESHOLDS_PASSED=false
  fi
else
  CHECKS_PASSED=0
  CHECKS_TOTAL=0
  CHECKS_FAILED=0
  HTTP_REQS=0
  ITERATIONS=0
  DURATION="unknown"
  THRESHOLDS_PASSED=false
fi

# Calculate success rate
if [ "$CHECKS_TOTAL" -gt 0 ]; then
  SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($CHECKS_PASSED/$CHECKS_TOTAL)*100}")
else
  SUCCESS_RATE=0
fi

# Determine overall status
if [ "$THRESHOLDS_PASSED" = true ] && [ "$CHECKS_FAILED" -eq 0 ]; then
  STATUS="PASSED"
  STATUS_EMOJI="✅"
  STATUS_COLOR=$GREEN
else
  STATUS="FAILED"
  STATUS_EMOJI="❌"
  STATUS_COLOR=$RED
fi

# Fun messages based on status
if [ "$STATUS" = "PASSED" ]; then
  MESSAGES=(
    "🎉 ¡Épico! Todo pasó como mantequilla"
    "🚀 ¡A la luna! Tests perfectos"
    "💎 Calidad diamante detectada"
    "🔥 ¡Ardiendo en éxito!"
    "⚡ Velocidad y precisión - combo perfecto"
    "🎯 Bullseye! Todos los checks en verde"
    "🏆 MVP del día - estos tests"
    "✨ Magia pura - cero errores"
    "🎪 Show perfecto, standing ovation"
    "🌟 Estrella dorada para este test"
  )
else
  MESSAGES=(
    "💥 Houston, tenemos un problema"
    "🔴 Código rojo - revisar urgente"
    "⚠️  Algo huele mal por aquí..."
    "🐛 Bugs detectados - exterminación necesaria"
    "🚨 Alerta máxima - tests fallando"
    "😅 Casi casi... pero no"
    "🎭 Drama en producción evitado (por ahora)"
    "🔧 Tiempo de arreglar cosas"
    "📉 Bajón detectado - a debuggear"
    "🎲 La suerte no estuvo de nuestro lado"
  )
fi

# Select random message
RANDOM_MESSAGE=${MESSAGES[$RANDOM % ${#MESSAGES[@]}]}

# Print beautiful summary
echo ""
echo -e "${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║           ${CYAN}🚀 k6 ENTERPRISE TEST RESULTS 🚀${NC}${BOLD}              ║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}📊 Test Information:${NC}"
echo -e "   ${BLUE}Client:${NC}    $CLIENT"
echo -e "   ${BLUE}Test:${NC}      $TEST"
echo -e "   ${BLUE}Duration:${NC}  $DURATION"
echo ""
echo -e "${BOLD}${STATUS_COLOR}$STATUS_EMOJI Status: $STATUS${NC}"
echo -e "${YELLOW}💬 $RANDOM_MESSAGE${NC}"
echo ""
echo -e "${BOLD}📈 Metrics Summary:${NC}"
echo -e "   ${GREEN}✓ Checks Passed:${NC}    $CHECKS_PASSED / $CHECKS_TOTAL (${SUCCESS_RATE}%)"
if [ "$CHECKS_FAILED" -gt 0 ]; then
  echo -e "   ${RED}✗ Checks Failed:${NC}    $CHECKS_FAILED"
fi
echo -e "   ${PURPLE}🔄 HTTP Requests:${NC}   $HTTP_REQS"
echo -e "   ${CYAN}🔁 Iterations:${NC}      $ITERATIONS"
echo ""
echo -e "${BOLD}📁 Generated Files:${NC}"
[ -f "$JSON_FILE" ] && echo -e "   ${GREEN}✓${NC} JSON Output:       $(basename "$JSON_FILE")"
[ -f "$DASHBOARD_FILE" ] && echo -e "   ${GREEN}✓${NC} k6 Dashboard:      $(basename "$DASHBOARD_FILE")"
[ -f "$ENTERPRISE_FILE" ] && echo -e "   ${GREEN}✓${NC} Enterprise Report: $(basename "$ENTERPRISE_FILE")"
[ -f "$SUMMARY_FILE" ] && echo -e "   ${GREEN}✓${NC} Summary:           $(basename "$SUMMARY_FILE")"
echo ""
echo -e "${BOLD}📂 Report Directory:${NC} $LATEST_DIR"
echo ""
echo -e "${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
if [ "$STATUS" = "PASSED" ]; then
  echo -e "${BOLD}║  ${GREEN}${STATUS_EMOJI}  ALL TESTS PASSED - READY TO DEPLOY! ${STATUS_EMOJI}${NC}${BOLD}              ║${NC}"
else
  echo -e "${BOLD}║  ${RED}${STATUS_EMOJI}  TESTS FAILED - REVIEW REQUIRED ${STATUS_EMOJI}${NC}${BOLD}                  ║${NC}"
fi
echo -e "${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Exit with appropriate code
if [ "$STATUS" = "PASSED" ]; then
  exit 0
else
  exit 1
fi
