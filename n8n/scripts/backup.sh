#!/bin/bash
# n8n Backup-Script fuer Hetzner
# Erstellt:
#   1. PostgreSQL Dump (n8n DB)
#   2. n8n Workflow-Export (alle Workflows als JSON)
#
# Ausfuehrung: ./scripts/backup.sh
# Cronjob (taeglich 03:00): 0 3 * * * /opt/n8n/scripts/backup.sh >> /var/log/n8n-backup.log 2>&1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="${PROJECT_DIR}/docker"
BACKUP_DIR="${PROJECT_DIR}/backups"
DATE=$(date +%Y-%m-%d_%H%M)
RETENTION_DAYS=14

echo "=== n8n Backup — ${DATE} ==="

# Backup-Verzeichnis erstellen
mkdir -p "${BACKUP_DIR}/db" "${BACKUP_DIR}/workflows"

# --- 1. PostgreSQL Dump ---
echo "[1/3] PostgreSQL Dump..."

# Lese DB-Credentials aus .env
if [ -f "${DOCKER_DIR}/.env" ]; then
  source "${DOCKER_DIR}/.env"
fi

DUMP_FILE="${BACKUP_DIR}/db/n8n_db_${DATE}.sql.gz"
docker compose -f "${DOCKER_DIR}/docker-compose.yml" -f "${DOCKER_DIR}/docker-compose.prod.yml" \
  exec -T postgres pg_dump -U "${POSTGRES_USER:-n8n}" "${POSTGRES_DB:-n8n}" \
  | gzip > "${DUMP_FILE}"

DUMP_SIZE=$(du -h "${DUMP_FILE}" | cut -f1)
echo "  Gespeichert: ${DUMP_FILE} (${DUMP_SIZE})"

# --- 2. n8n Workflow-Export ---
echo "[2/3] Workflow-Export..."

WF_DIR="${BACKUP_DIR}/workflows/${DATE}"
mkdir -p "${WF_DIR}"
docker compose -f "${DOCKER_DIR}/docker-compose.yml" -f "${DOCKER_DIR}/docker-compose.prod.yml" \
  exec -T n8n n8n export:workflow --all --output="${WF_DIR}/" 2>/dev/null || {
    # Fallback: Ueber n8n API exportieren
    echo "  Docker exec fehlgeschlagen, versuche API..."
    if [ -n "${N8N_API_KEY:-}" ]; then
      curl -sf "http://localhost:5678/api/v1/workflows" \
        -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
        -o "${WF_DIR}/all-workflows.json"
    else
      echo "  WARNUNG: Kein N8N_API_KEY — Workflow-Export uebersprungen"
    fi
  }

WF_COUNT=$(find "${WF_DIR}" -name "*.json" 2>/dev/null | wc -l | tr -d ' ')
echo "  Exportiert: ${WF_COUNT} Workflows nach ${WF_DIR}/"

# --- 3. Alte Backups loeschen ---
echo "[3/3] Alte Backups loeschen (aelter als ${RETENTION_DAYS} Tage)..."
find "${BACKUP_DIR}/db" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
find "${BACKUP_DIR}/workflows" -mindepth 1 -maxdepth 1 -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null || true

echo ""
echo "=== Backup abgeschlossen ==="
echo "DB:        ${DUMP_FILE}"
echo "Workflows: ${WF_DIR}/"
