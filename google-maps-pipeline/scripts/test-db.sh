#!/bin/bash
# pgTAP Test-Runner fuer Supabase
# Ausfuehrung: bash scripts/test-db.sh
#
# Voraussetzungen:
# - pgTAP Extension auf Staging aktiviert
# - STAGING_DB_URL Umgebungsvariable gesetzt
# - pg_prove installiert (brew install perl && cpan TAP::Parser::SourceHandler::pgTAP)
#
# WICHTIG: Laeuft NUR gegen Staging — nie gegen Production!

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_DIR="$PROJECT_DIR/tests/db"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=== pgTAP Datenbank-Tests ==="
echo ""

# Sicherheitscheck: Nur Staging erlaubt
if [ -z "${STAGING_DB_URL:-}" ]; then
  echo -e "${RED}FEHLER: STAGING_DB_URL nicht gesetzt${NC}"
  echo ""
  echo "Setze die URL deines Staging-Supabase-Projekts:"
  echo "  export STAGING_DB_URL='postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres'"
  echo ""
  echo "WARNUNG: Verwende NIEMALS die Production-URL!"
  exit 1
fi

# Production-Schutz
if echo "$STAGING_DB_URL" | grep -q "wknzyrvcrcdchnysntii"; then
  echo -e "${RED}ABBRUCH: Production-Projekt erkannt!${NC}"
  echo "Tests duerfen NUR gegen ein Staging-Projekt laufen."
  exit 1
fi

# Pruefen ob pg_prove verfuegbar ist
if ! command -v pg_prove &> /dev/null; then
  echo -e "${YELLOW}pg_prove nicht gefunden. Installation:${NC}"
  echo "  brew install perl"
  echo "  cpan TAP::Parser::SourceHandler::pgTAP"
  echo ""
  echo "Alternative: Tests direkt mit psql ausfuehren:"
  echo "  psql \"\$STAGING_DB_URL\" -f tests/db/rls_policies.test.sql"
  exit 1
fi

# Tests ausfuehren
echo -e "${GREEN}Starte Tests gegen Staging...${NC}"
echo ""

FAILED=0

for test_file in "$TEST_DIR"/*.test.sql; do
  test_name=$(basename "$test_file")
  echo "--- $test_name ---"
  if pg_prove -d "$STAGING_DB_URL" "$test_file" 2>&1; then
    echo -e "${GREEN}PASS${NC}"
  else
    echo -e "${RED}FAIL${NC}"
    FAILED=$((FAILED + 1))
  fi
  echo ""
done

echo "=== Ergebnis ==="
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}Alle DB-Tests bestanden!${NC}"
  exit 0
else
  echo -e "${RED}$FAILED Test-Datei(en) fehlgeschlagen!${NC}"
  exit 1
fi
