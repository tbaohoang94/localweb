#!/bin/bash
set -e

# Basis-Ordner ermitteln (hier: localweb)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$SCRIPT_DIR/files"
DOCKER_DIR="$SCRIPT_DIR/infra/docker"   # compose liegt in infra/docker

WORKFLOW_DIR="$BASE_DIR/workflows"
CREDENTIAL_DIR="$BASE_DIR/credentials"

# Ordner vorbereiten
mkdir -p "$WORKFLOW_DIR"
mkdir -p "$CREDENTIAL_DIR"

echo "📦 Exportiere Workflows nach $WORKFLOW_DIR ..."
docker compose -f "$DOCKER_DIR/docker-compose.yml" exec n8n \
  n8n export:workflow --all --output=/files/workflows/ --separate

echo "🔑 Exportiere Credentials nach $CREDENTIAL_DIR ..."
docker compose -f "$DOCKER_DIR/docker-compose.yml" exec n8n \
  n8n export:credentials --all --output=/files/credentials/ --separate

echo "🧹 Bereinige evtl. alte Artefakte (optional) ..."
find "$WORKFLOW_DIR" -type f -name "*.json" -exec chmod 600 {} \;
find "$CREDENTIAL_DIR" -type f -name "*.json" -exec chmod 600 {} \;

echo "✅ Export abgeschlossen. Bereit für GitHub:"
echo "   - $WORKFLOW_DIR"
echo "   - $CREDENTIAL_DIR"