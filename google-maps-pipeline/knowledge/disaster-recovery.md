# Disaster Recovery — Google Maps Lead Pipeline

> Letzte Aktualisierung: 2026-03-04

---

## Szenario 1: n8n-Server (Docker lokal) faellt aus

| Aspekt | Details |
|--------|---------|
| Recovery Time | < 30 Minuten |
| Datenverlust-Risiko | Gering — Workflow-Daten in PostgreSQL Volume, Workflows als JSON im Repo |
| Impact | Pipeline pausiert, keine neuen Scrapes/Enrichments/Exports |

### Schritte
1. Docker-Status pruefen: `docker compose ps`
2. Logs pruefen: `docker compose logs --tail 100 n8n`
3. Container neu starten: `docker compose up -d --force-recreate n8n`
4. Health-Check: `curl http://localhost:5678/healthz`
5. Falls Volume korrupt: Volume loeschen + Workflows neu importieren (JSONs aus Repo)
6. Credentials muessen manuell neu eingegeben werden (verschluesselt in n8n-DB)

---

## Szenario 2: Supabase nicht erreichbar

| Aspekt | Details |
|--------|---------|
| Recovery Time | Abhaengig von Supabase (managed Service) |
| Impact | Dashboard nicht nutzbar, n8n Workflows schlagen fehl → WF 07 Alert |
| Datenverlust-Risiko | Keins — Supabase hat managed Backups |

### Schritte
1. Supabase Status pruefen: https://status.supabase.com
2. n8n Workflows laufen in Error-Queue (retryOnFail greift)
3. Items bleiben im aktuellen pipeline_stage — werden nach Recovery automatisch verarbeitet
4. Falls laengerer Ausfall: n8n Workflows temporaer deaktivieren um Error-Logs zu reduzieren

---

## Szenario 3: Vercel Deployment kaputt

| Aspekt | Details |
|--------|---------|
| Recovery Time | < 5 Minuten |
| Impact | Dashboard nicht erreichbar, Pipeline laeuft weiter (n8n unabhaengig) |

### Schritte
1. Vercel Dashboard oeffnen → Deployments
2. Vorheriges funktionierendes Deployment auswaehlen
3. "Promote to Production" klicken
4. Alternativ: `vercel rollback` via CLI

---

## Szenario 4: n8n Credentials verloren

| Aspekt | Details |
|--------|---------|
| Recovery Time | 15-30 Minuten |
| Impact | Workflows koennen nicht auf externe Services zugreifen |

### Schritte
1. Neue Credentials anlegen in n8n UI
2. Werte aus .env Datei (Apify, OpenAI) oder jeweiligem Service Dashboard holen
3. SMTP: Mail-Passwort aus Hetzner Robot Dashboard
4. Workflows die betroffene Credentials nutzen: Credential-Zuweisung aktualisieren

---

## Szenario 5: Datenbank-Korruption / Datenverlust

| Aspekt | Details |
|--------|---------|
| Recovery Time | 1-4 Stunden (abhaengig von Backup-Groesse) |
| Impact | Alle Daten verloren, Pipeline muss neu starten |

### Schritte
1. Supabase Dashboard → Database → Backups
2. Letzten funktionierenden Backup auswaehlen
3. Point-in-Time-Recovery ausfuehren (Pro Plan erforderlich)
4. RLS Policies pruefen — Backup schliesst Policies ein
5. n8n Workflows muessen nicht angepasst werden (gleiche Tabellen-Struktur)

---

## Backup-Strategie

| Komponente | Methode | Frequenz | Aufbewahrung |
|------------|---------|----------|--------------|
| Supabase DB | Managed Backup (Supabase) | Taeglich automatisch | 7 Tage (Free), 30 Tage (Pro) |
| n8n Workflows | JSON-Export im Git-Repo | Bei jeder Aenderung | Unbegrenzt (Git History) |
| n8n Workflows | WF 10 automatischer Export | Taeglich 02:00 | Im system_logs |
| n8n Credentials | Verschluesselt in n8n PostgreSQL | Mit Docker Volume | Solange Volume existiert |
| Frontend Code | Git Repository | Bei jedem Push | Unbegrenzt |
| .env Secrets | Lokale Datei + Passwort-Manager | Manuell | Manuell |

---

## Kontakt bei Notfall

| Rolle | Kontakt | Zustaendig fuer |
|-------|---------|-----------------|
| Entwickler | [OFFEN] | n8n, Frontend, Supabase |
| Supabase Support | support@supabase.io | Datenbank-Recovery |
| Vercel Support | Vercel Dashboard | Frontend-Deployment |
| Hetzner Support | Hetzner Robot Dashboard | Server-Infrastruktur |
