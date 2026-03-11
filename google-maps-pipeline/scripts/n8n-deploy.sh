#!/bin/bash
# n8n Deployment — Google Maps Lead Pipeline
# Deployt Workflows auf die lokale oder remote n8n-Instanz.
# Aufruf: ./scripts/n8n-deploy.sh [local|prod] [workflow-file.json]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENV="${1:-local}"
WORKFLOW_FILE="$2"
N8N_DIR="$(dirname "$0")/../../n8n/workflows/google-maps-pipeline"

if [ "$ENV" = "local" ]; then
  N8N_URL="http://localhost:5678"
  API_KEY="${N8N_LOCAL_API_KEY}"
elif [ "$ENV" = "prod" ]; then
  echo -e "${RED}ACHTUNG: Produktion-Deployment!${NC}"
  echo -n "Fortfahren? (ja/nein): "
  read -r CONFIRM
  if [ "$CONFIRM" != "ja" ]; then
    echo "Abgebrochen."
    exit 0
  fi
  N8N_URL="http://116.203.205.153:5678"
  API_KEY="${N8N_PROD_API_KEY}"
else
  echo "Usage: $0 [local|prod] [workflow-file.json]"
  exit 1
fi

if [ -z "$API_KEY" ]; then
  echo -e "${RED}API Key nicht gesetzt.${NC}"
  echo "Setze: export N8N_LOCAL_API_KEY='...' oder N8N_PROD_API_KEY='...'"
  exit 1
fi

# Health-Check
echo "--- Health-Check: $N8N_URL ---"
if ! curl -sf "$N8N_URL/healthz" > /dev/null 2>&1; then
  echo -e "${RED}n8n ist nicht erreichbar: $N8N_URL${NC}"
  exit 1
fi
echo -e "${GREEN}n8n erreichbar${NC}"

deploy_workflow() {
  local FILE="$1"
  local WF_NAME
  WF_NAME=$(jq -r '.name' "$FILE")
  local WF_ID
  WF_ID=$(jq -r '.id // empty' "$FILE")

  echo ""
  echo "--- Deploying: $WF_NAME ---"

  if [ -n "$WF_ID" ]; then
    # Update bestehenden Workflow
    local PAYLOAD
    PAYLOAD=$(jq '{name, nodes, connections, settings}' "$FILE")
    local RESPONSE
    RESPONSE=$(curl -sf -X PUT "$N8N_URL/api/v1/workflows/$WF_ID" \
      -H "X-N8N-API-KEY: $API_KEY" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD" 2>&1) || true

    if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
      echo -e "${GREEN}Aktualisiert: $WF_NAME ($WF_ID)${NC}"
    else
      echo -e "${YELLOW}Update fehlgeschlagen, versuche neuen Workflow zu erstellen...${NC}"
      RESPONSE=$(curl -sf -X POST "$N8N_URL/api/v1/workflows" \
        -H "X-N8N-API-KEY: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$(jq '{name, nodes, connections, settings}' "$FILE")" 2>&1) || true
      if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
        echo -e "${GREEN}Neu erstellt: $WF_NAME${NC}"
      else
        echo -e "${RED}Deployment fehlgeschlagen: $WF_NAME${NC}"
        echo "$RESPONSE"
      fi
    fi
  else
    echo -e "${YELLOW}Keine ID in $FILE — uebersprungen${NC}"
  fi
}

if [ -n "$WORKFLOW_FILE" ]; then
  # Einzelnen Workflow deployen
  deploy_workflow "$WORKFLOW_FILE"
else
  # Alle Workflows deployen
  echo "Deploye alle Workflows aus: $N8N_DIR"
  for FILE in "$N8N_DIR"/*.json; do
    [ -f "$FILE" ] && deploy_workflow "$FILE"
  done
fi

echo ""
echo -e "${GREEN}=== Deployment abgeschlossen ===${NC}"
