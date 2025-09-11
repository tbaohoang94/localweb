#!/bin/bash
set -e

# Abbruch, wenn keine Repo-URL übergeben wurde
if [ -z "$1" ]; then
  echo "❌ Bitte die GitHub-Repo-URL angeben!"
  echo "👉 Beispiel: ./setup_github.sh git@github.com:USERNAME/n8n-infra.git"
  exit 1
fi

REPO_URL=$1

echo "📦 Initialisiere Git..."
git init

echo "🌿 Setze Branch main..."
git branch -M main

echo "🔗 Verbinde mit Remote: $REPO_URL"
git remote set-url origin "$REPO_URL"

echo "✅ Setup abgeschlossen. Du kannst jetzt mit ./push_github.sh pushen."
