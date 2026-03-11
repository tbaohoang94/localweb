#!/bin/bash
# Deploy n8n auf Hetzner
# Ausfuehrung: ./scripts/deploy-hetzner.sh
# Voraussetzung: SSH-Key fuer Hetzner-Server konfiguriert

set -euo pipefail

HETZNER_HOST="${HETZNER_HOST:-116.203.205.153}"
HETZNER_USER="${HETZNER_USER:-root}"
REMOTE_DIR="${REMOTE_DIR:-/opt/n8n}"
SSH_CMD="ssh ${HETZNER_USER}@${HETZNER_HOST}"

echo "=== n8n Hetzner Deployment ==="
echo "Host: ${HETZNER_HOST}"
echo ""

# --- Pre-Checks ---
echo "[1/6] Pre-Checks..."

# SSH erreichbar?
if ! $SSH_CMD "echo ok" >/dev/null 2>&1; then
  echo "FEHLER: SSH-Verbindung zu ${HETZNER_HOST} fehlgeschlagen"
  exit 1
fi
echo "  SSH: OK"

# Docker laeuft?
if ! $SSH_CMD "docker info >/dev/null 2>&1"; then
  echo "FEHLER: Docker laeuft nicht auf ${HETZNER_HOST}"
  exit 1
fi
echo "  Docker: OK"

# Disk-Space pruefen (mind. 2GB frei)
FREE_KB=$($SSH_CMD "df / | tail -1 | awk '{print \$4}'")
FREE_GB=$((FREE_KB / 1024 / 1024))
if [ "$FREE_GB" -lt 2 ]; then
  echo "WARNUNG: Nur ${FREE_GB}GB frei auf ${HETZNER_HOST}"
fi
echo "  Disk: ${FREE_GB}GB frei"

# .env vorhanden?
if ! $SSH_CMD "test -f ${REMOTE_DIR}/docker/.env"; then
  echo "FEHLER: ${REMOTE_DIR}/docker/.env nicht gefunden"
  echo "Bitte zuerst .env auf dem Server anlegen."
  exit 1
fi
echo "  .env: OK"

# --- Git Pull ---
echo ""
echo "[2/6] Git Pull auf Hetzner..."
$SSH_CMD "cd ${REMOTE_DIR} && git pull"

# --- Docker Build + Up ---
echo ""
echo "[3/6] Docker Compose Build + Up..."
$SSH_CMD "cd ${REMOTE_DIR} && make prod-up-build"

# --- Warte auf Healthcheck ---
echo ""
echo "[4/6] Warte auf n8n Healthcheck (max 120s)..."
for i in $(seq 1 24); do
  if $SSH_CMD "wget -qO- http://localhost:5678/healthz >/dev/null 2>&1"; then
    echo "  n8n: HEALTHY"
    break
  fi
  if [ "$i" -eq 24 ]; then
    echo "WARNUNG: n8n Healthcheck nach 120s nicht erreichbar"
    echo "Pruefe Logs: ssh ${HETZNER_USER}@${HETZNER_HOST} 'cd ${REMOTE_DIR} && make prod-logs'"
    exit 1
  fi
  sleep 5
done

# --- Container-Status ---
echo ""
echo "[5/6] Container-Status:"
$SSH_CMD "cd ${REMOTE_DIR} && make prod-ps"

# --- Caddy/HTTPS Check ---
echo ""
echo "[6/6] HTTPS-Check..."
if curl -sf "https://n8n.hoba-consulting.com/healthz" >/dev/null 2>&1; then
  echo "  https://n8n.hoba-consulting.com: OK"
else
  echo "  WARNUNG: HTTPS nicht erreichbar (Cloudflare Tunnel oder Caddy Problem?)"
fi

echo ""
echo "=== Deployment abgeschlossen ==="
