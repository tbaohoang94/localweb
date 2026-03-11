#!/bin/bash
# Pre-Deploy Check — Google Maps Lead Pipeline
# Prueft alle Voraussetzungen vor einem Deployment.
# Aufruf: ./scripts/pre-deploy-check.sh

set -e

FRONTEND_DIR="$(dirname "$0")/../frontend"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

check_pass() { echo -e "${GREEN}[OK]${NC} $1"; }
check_fail() { echo -e "${RED}[FEHLER]${NC} $1"; ERRORS=$((ERRORS + 1)); }
check_warn() { echo -e "${YELLOW}[WARNUNG]${NC} $1"; WARNINGS=$((WARNINGS + 1)); }

echo "=== Pre-Deploy Check ==="
echo ""

# 1. TypeScript Build
echo "--- TypeScript ---"
if (cd "$FRONTEND_DIR" && npx tsc --noEmit 2>/dev/null); then
  check_pass "TypeScript kompiliert fehlerfrei"
else
  check_fail "TypeScript-Fehler gefunden"
fi

# 2. ESLint
echo "--- ESLint ---"
if (cd "$FRONTEND_DIR" && npx next lint 2>/dev/null | grep -q "No ESLint warnings or errors"); then
  check_pass "Keine ESLint-Fehler"
else
  check_warn "ESLint-Warnungen vorhanden (pruefen mit: cd frontend && npx next lint)"
fi

# 3. Prettier
echo "--- Prettier ---"
if (cd "$FRONTEND_DIR" && npx prettier --check . 2>/dev/null); then
  check_pass "Code ist Prettier-konform"
else
  check_warn "Code nicht Prettier-konform (fixen mit: cd frontend && npm run format)"
fi

# 4. Environment Variables (Vercel)
echo "--- Environment ---"
REQUIRED_VARS="NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY"
for var in $REQUIRED_VARS; do
  if [ -z "${!var}" ]; then
    check_warn "Env-Variable $var nicht gesetzt (wird auf Vercel benoetigt)"
  else
    check_pass "Env-Variable $var vorhanden"
  fi
done

# 5. Next.js Build
echo "--- Next.js Build ---"
if (cd "$FRONTEND_DIR" && npm run build 2>/dev/null); then
  check_pass "Next.js Build erfolgreich"
else
  check_fail "Next.js Build fehlgeschlagen"
fi

# Ergebnis
echo ""
echo "=== Ergebnis ==="
if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}$ERRORS Fehler, $WARNINGS Warnungen — NICHT deployen!${NC}"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}0 Fehler, $WARNINGS Warnungen — Deploy moeglich, aber pruefen.${NC}"
  exit 0
else
  echo -e "${GREEN}Alle Checks bestanden — bereit zum Deploy.${NC}"
  exit 0
fi
