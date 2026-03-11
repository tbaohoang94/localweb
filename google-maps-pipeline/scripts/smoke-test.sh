#!/bin/bash
# Smoke Test Suite — laeuft nach jedem Deployment
# Dauer: < 60 Sekunden
# Exit 1 bei jedem Fehler → Deployment-Rollback
#
# Ausfuehrung:
#   bash scripts/smoke-test.sh
#   NEXT_URL=https://staging.example.com bash scripts/smoke-test.sh
#
# Environment Variables:
#   NEXT_URL            — Frontend URL (default: http://localhost:3000)
#   SUPABASE_URL        — Supabase URL
#   SUPABASE_ANON_KEY   — Supabase Anon Key
#   N8N_URL             — n8n URL (default: http://localhost:5678)

set -euo pipefail

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

NEXT_URL="${NEXT_URL:-http://localhost:3000}"
SUPABASE_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"
N8N_URL="${N8N_URL:-http://localhost:5678}"

PASSED=0
FAILED=0
SKIPPED=0

check() {
  local name="$1"
  local cmd="$2"

  printf "  %-50s " "$name"
  if eval "$cmd" > /dev/null 2>&1; then
    echo -e "${GREEN}PASS${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}FAIL${NC}"
    FAILED=$((FAILED + 1))
  fi
}

skip() {
  local name="$1"
  local reason="$2"
  printf "  %-50s " "$name"
  echo -e "${YELLOW}SKIP ($reason)${NC}"
  SKIPPED=$((SKIPPED + 1))
}

echo "=== Smoke Test Suite ==="
echo ""
echo "  Next.js:  $NEXT_URL"
echo "  Supabase: ${SUPABASE_URL:-nicht gesetzt}"
echo "  n8n:      $N8N_URL"
echo ""

# 1. Next.js Health
check "Next.js Health-Endpoint" \
  "curl -sf '$NEXT_URL/api/health' | grep -q 'healthy\|unhealthy'"

# 2. Next.js Dashboard (antwortet mit 200 oder 302/redirect)
check "Dashboard erreichbar" \
  "curl -sf -o /dev/null -w '%{http_code}' '$NEXT_URL/dashboard' | grep -qE '200|302|307'"

# 3. Supabase erreichbar
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_ANON_KEY" ]; then
  check "Supabase REST API" \
    "curl -sf '$SUPABASE_URL/rest/v1/cities?limit=1' -H 'apikey: $SUPABASE_ANON_KEY'"
else
  skip "Supabase REST API" "SUPABASE_URL oder SUPABASE_ANON_KEY nicht gesetzt"
fi

# 4. n8n Health
check "n8n Health-Endpoint" \
  "curl -sf '$N8N_URL/healthz' | grep -q 'ok\|status'"

# 5. Kritische Seiten laden (HTTP Status)
check "Login-Seite erreichbar" \
  "curl -sf -o /dev/null -w '%{http_code}' '$NEXT_URL/login' | grep -qE '200|302'"

# Ergebnis
echo ""
echo "=== Ergebnis ==="
echo -e "  Bestanden:    ${GREEN}$PASSED${NC}"
echo -e "  Fehlgeschl.:  ${RED}$FAILED${NC}"
echo -e "  Uebersprungen: ${YELLOW}$SKIPPED${NC}"

if [ $FAILED -gt 0 ]; then
  echo ""
  echo -e "${RED}Smoke Tests FEHLGESCHLAGEN — Deployment-Rollback empfohlen!${NC}"
  exit 1
else
  echo ""
  echo -e "${GREEN}Alle Smoke Tests bestanden!${NC}"
  exit 0
fi
