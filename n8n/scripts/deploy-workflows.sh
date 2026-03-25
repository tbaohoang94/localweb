#!/bin/bash
# Deploy n8n Workflows auf Hetzner (Prod)
# Deployed nur geaenderte Workflows via n8n Public API.
#
# Nutzung:
#   ./scripts/deploy-workflows.sh                    # Alle geaenderten seit letztem Deploy
#   ./scripts/deploy-workflows.sh --all              # Alle Workflows forcieren
#   ./scripts/deploy-workflows.sh --file 23-eg-stattgefunden.json  # Einzelne Datei
#   ./scripts/deploy-workflows.sh --dry-run          # Nur anzeigen, nichts deployen
#
# Voraussetzung: n8n API Key als N8N_PROD_API_KEY env var oder in .env

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WORKFLOW_DIR="${PROJECT_DIR}/workflows/close-crm-sync"
MAPPING_FILE="${PROJECT_DIR}/deploy/id-mapping.json"
LAST_DEPLOY_FILE="${PROJECT_DIR}/deploy/.last-deploy"

# Prod API
PROD_HOST="${N8N_PROD_HOST:-https://n8n-prod.hoba-consulting.com}"
PROD_API_KEY="${N8N_PROD_API_KEY:-n8n_api_deploy_temp_key_2026}"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Argumente
DRY_RUN=false
DEPLOY_ALL=false
SINGLE_FILE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run) DRY_RUN=true; shift ;;
    --all) DEPLOY_ALL=true; shift ;;
    --file) SINGLE_FILE="$2"; shift 2 ;;
    *) echo "Unbekanntes Argument: $1"; exit 1 ;;
  esac
done

# --- Pre-Checks ---
if [ ! -f "$MAPPING_FILE" ]; then
  echo -e "${RED}FEHLER: ID-Mapping nicht gefunden: ${MAPPING_FILE}${NC}"
  exit 1
fi

if [ ! -d "$WORKFLOW_DIR" ]; then
  echo -e "${RED}FEHLER: Workflow-Verzeichnis nicht gefunden: ${WORKFLOW_DIR}${NC}"
  exit 1
fi

# API erreichbar?
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "X-N8N-API-KEY: ${PROD_API_KEY}" "${PROD_HOST}/api/v1/workflows?limit=1" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  echo -e "${RED}FEHLER: n8n API nicht erreichbar (HTTP ${HTTP_CODE})${NC}"
  echo "  Host: ${PROD_HOST}"
  echo "  Pruefe N8N_PROD_API_KEY und Netzwerk."
  exit 1
fi

echo "=== n8n Workflow Deploy ==="
echo "  Quelle: ${WORKFLOW_DIR}"
echo "  Ziel:   ${PROD_HOST}"
if $DRY_RUN; then echo -e "  ${YELLOW}DRY RUN — keine Aenderungen${NC}"; fi
echo ""

# --- Dateien sammeln ---
FILES_TO_DEPLOY=()

if [ -n "$SINGLE_FILE" ]; then
  # Einzelne Datei
  if [ ! -f "${WORKFLOW_DIR}/${SINGLE_FILE}" ]; then
    echo -e "${RED}FEHLER: Datei nicht gefunden: ${SINGLE_FILE}${NC}"
    exit 1
  fi
  FILES_TO_DEPLOY+=("$SINGLE_FILE")

elif $DEPLOY_ALL; then
  # Alle JSON-Dateien (ausser _manifest.json)
  for f in "${WORKFLOW_DIR}"/*.json; do
    basename=$(basename "$f")
    if [ "$basename" = "_manifest.json" ]; then continue; fi
    FILES_TO_DEPLOY+=("$basename")
  done

else
  # Nur seit letztem Deploy geaenderte
  if [ -f "$LAST_DEPLOY_FILE" ]; then
    LAST_DEPLOY=$(cat "$LAST_DEPLOY_FILE")
    echo "  Letzter Deploy: ${LAST_DEPLOY}"
  else
    LAST_DEPLOY="1970-01-01"
    echo "  Kein vorheriger Deploy — alle Dateien werden geprueft"
  fi

  for f in "${WORKFLOW_DIR}"/*.json; do
    basename=$(basename "$f")
    if [ "$basename" = "_manifest.json" ]; then continue; fi

    # Datei neuer als letzter Deploy?
    if [ -f "$LAST_DEPLOY_FILE" ] && [ "$f" -ot "$LAST_DEPLOY_FILE" ]; then
      continue
    fi
    FILES_TO_DEPLOY+=("$basename")
  done
fi

if [ ${#FILES_TO_DEPLOY[@]} -eq 0 ]; then
  echo -e "${GREEN}Keine geaenderten Workflows gefunden. Alles aktuell.${NC}"
  exit 0
fi

echo "  Workflows zu deployen: ${#FILES_TO_DEPLOY[@]}"
echo ""

# --- Deploy ---
SUCCESS=0
FAILED=0
SKIPPED=0

for filename in "${FILES_TO_DEPLOY[@]}"; do
  filepath="${WORKFLOW_DIR}/${filename}"

  # Workflow-Name aus JSON lesen
  WF_NAME=$(python3 -c "import json; print(json.load(open('${filepath}')).get('name',''))" 2>/dev/null)
  if [ -z "$WF_NAME" ]; then
    echo -e "  ${YELLOW}SKIP${NC} ${filename} — kein Name im JSON"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # Prod-ID aus Mapping
  PROD_ID=$(python3 -c "
import json
mapping = json.load(open('${MAPPING_FILE}'))
print(mapping.get('${WF_NAME}', ''))
" 2>/dev/null)

  if [ -z "$PROD_ID" ]; then
    echo -e "  ${YELLOW}SKIP${NC} ${filename} — keine Prod-ID im Mapping fuer '${WF_NAME}'"
    echo "         Fuege die ID zu deploy/id-mapping.json hinzu."
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if $DRY_RUN; then
    echo -e "  ${YELLOW}DRY${NC}  ${filename} → ${PROD_ID} (${WF_NAME})"
    continue
  fi

  # Workflow-JSON vorbereiten: ID auf Prod-ID setzen, Metadaten entfernen
  DEPLOY_JSON=$(python3 -c "
import json, sys

with open('${filepath}') as f:
    wf = json.load(f)

# Pflichtfelder fuer PUT
payload = {
    'name': wf.get('name', ''),
    'nodes': wf.get('nodes', []),
    'connections': wf.get('connections', {}),
    'settings': wf.get('settings', {}),
}

# Optional: staticData beibehalten wenn vorhanden
if 'staticData' in wf:
    payload['staticData'] = wf['staticData']

print(json.dumps(payload))
" 2>/dev/null)

  if [ -z "$DEPLOY_JSON" ]; then
    echo -e "  ${RED}FAIL${NC} ${filename} — JSON-Verarbeitung fehlgeschlagen"
    FAILED=$((FAILED + 1))
    continue
  fi

  # Deaktivieren (falls aktiv)
  curl -s -X POST \
    -H "X-N8N-API-KEY: ${PROD_API_KEY}" \
    "${PROD_HOST}/api/v1/workflows/${PROD_ID}/deactivate" >/dev/null 2>&1

  # PUT Update
  HTTP_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X PUT \
    -H "X-N8N-API-KEY: ${PROD_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "${DEPLOY_JSON}" \
    "${PROD_HOST}/api/v1/workflows/${PROD_ID}" 2>/dev/null)

  HTTP_BODY=$(echo "$HTTP_RESPONSE" | head -n -1)
  HTTP_CODE=$(echo "$HTTP_RESPONSE" | tail -1)

  if [ "$HTTP_CODE" = "200" ]; then
    # Reaktivieren
    curl -s -X POST \
      -H "X-N8N-API-KEY: ${PROD_API_KEY}" \
      "${PROD_HOST}/api/v1/workflows/${PROD_ID}/activate" >/dev/null 2>&1

    echo -e "  ${GREEN}OK${NC}   ${filename} → ${PROD_ID}"
    SUCCESS=$((SUCCESS + 1))
  else
    ERROR_MSG=$(echo "$HTTP_BODY" | python3 -c "import json,sys; print(json.load(sys.stdin).get('message',''))" 2>/dev/null || echo "$HTTP_BODY")
    echo -e "  ${RED}FAIL${NC} ${filename} → HTTP ${HTTP_CODE}: ${ERROR_MSG}"
    FAILED=$((FAILED + 1))

    # Reaktivieren trotz Fehler (war evtl. vorher aktiv)
    curl -s -X POST \
      -H "X-N8N-API-KEY: ${PROD_API_KEY}" \
      "${PROD_HOST}/api/v1/workflows/${PROD_ID}/activate" >/dev/null 2>&1
  fi
done

# --- Timestamp speichern ---
if ! $DRY_RUN && [ $SUCCESS -gt 0 ]; then
  date -u +"%Y-%m-%dT%H:%M:%SZ" > "$LAST_DEPLOY_FILE"
fi

# --- Zusammenfassung ---
echo ""
echo "=== Ergebnis ==="
echo -e "  ${GREEN}Erfolgreich: ${SUCCESS}${NC}"
if [ $FAILED -gt 0 ]; then echo -e "  ${RED}Fehlgeschlagen: ${FAILED}${NC}"; fi
if [ $SKIPPED -gt 0 ]; then echo -e "  ${YELLOW}Uebersprungen: ${SKIPPED}${NC}"; fi
