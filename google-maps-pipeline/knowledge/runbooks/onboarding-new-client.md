# Onboarding neues Kundenprojekt — Checkliste

> Basierend auf dem Localweb Google Maps Pipeline Setup.

---

## 1. Infrastruktur aufsetzen

- [ ] Supabase-Projekt erstellen (eu-central-1)
- [ ] Tabellen + ENUMs per Migration erstellen (locations, businesses, cities, system_logs, dead_letter_queue)
- [ ] RLS auf allen Tabellen aktivieren
- [ ] RLS Policies erstellen (authenticated: SELECT, service_role: ALL)
- [ ] Views erstellen (search_query_stats, pipeline_errors, system_logs_summary, throughput)
- [ ] Indizes erstellen (pipeline_stage, search_string)

## 2. n8n Docker einrichten

- [ ] Docker Compose Dateien kopieren (`clients/[kunde]/n8n/docker/`)
- [ ] `.env` Datei erstellen (von `.env.example`)
- [ ] Credentials setzen:
  - [ ] `N8N_ENCRYPTION_KEY` generieren (`openssl rand -hex 32`)
  - [ ] `POSTGRES_PASSWORD` generieren
  - [ ] Supabase Service Role Key eintragen
  - [ ] Apify API Token eintragen
  - [ ] OpenAI API Key eintragen
  - [ ] SMTP Credentials eintragen
  - [ ] NOTIFICATION_EMAIL setzen
- [ ] `docker compose up -d` — Container starten
- [ ] Health-Check: `curl http://localhost:5678/healthz`

## 3. n8n Workflows importieren

- [ ] Workflow-JSONs aus Repo importieren (`n8n/workflows/google-maps-pipeline/`)
- [ ] Credentials in Workflows zuweisen
- [ ] Error Workflow (WF 07) als Error-Handler fuer alle Workflows setzen
- [ ] Schedule-Trigger aktivieren (WF 01, 01b, 02, 03, 04a, 05)
- [ ] Ops-Workflows aktivieren (WF 08, 09, 10, 11) — nach Bedarf

## 4. Frontend deployen

- [ ] Vercel-Projekt erstellen
- [ ] Environment Variables setzen:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN`
  - [ ] `SENTRY_ORG` + `SENTRY_PROJECT` + `SENTRY_AUTH_TOKEN`
- [ ] Git Repository verbinden → Auto-Deploy
- [ ] Supabase Auth: User fuer Kunden-Login erstellen

## 5. Monitoring einrichten

- [ ] Sentry-Projekt erstellen → DSN in Vercel Env setzen
- [ ] NOTIFICATION_EMAIL auf Kunden-relevante Adresse setzen
- [ ] Ops Dashboard pruefen: /dashboard/ops
- [ ] Health Check (WF 08) aktivieren
- [ ] Daily Digest (WF 09) aktivieren

## 6. Test-Durchlauf

- [ ] Location manuell hinzufuegen (Dashboard)
- [ ] Pipeline-Durchlauf beobachten (new → scraping → scraped → imported → qualified → enriched)
- [ ] CSV-Export pruefen (WF 05 manuell ausloesen)
- [ ] Error Logger testen (WF absichtlich fehlschlagen lassen)
- [ ] Ops Dashboard pruefen: Logs und Pipeline-Status korrekt?

## 7. Dokumentation

- [ ] `knowledge/` Verzeichnis mit Projekt-spezifischen Infos
- [ ] Supabase Projekt-Ref dokumentieren
- [ ] Workflow IDs dokumentieren
- [ ] Credential IDs dokumentieren
- [ ] CLAUDE.md fuer das Projekt erstellen
