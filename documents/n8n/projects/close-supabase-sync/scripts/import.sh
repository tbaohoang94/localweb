#!/bin/bash
set -e

CONTAINER="docker-n8n-1"

echo "🔑 Importiere Credentials..."
for file in ./files/credentials/*.json; do
  echo "➡️ $file"
  docker exec -it $CONTAINER n8n import:credentials --input="/files/credentials/$(basename $file)"
done

echo "📦 Importiere Workflows..."
for file in ./files/workflows/*.json; do
  echo "➡️ $file"
  docker exec -it $CONTAINER n8n import:workflow --input="/files/workflows/$(basename $file)"
done

echo "✅ Alles erfolgreich importiert!"
