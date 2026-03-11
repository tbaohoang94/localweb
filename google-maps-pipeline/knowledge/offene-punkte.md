# Offene Punkte — Google Maps Lead Pipeline

> Gesammelt aus dem Infrastructure Audit (2026-03-04)
> Status: Offen — manuell abzuarbeiten

---

## Hohe Prioritaet

### 1. Sentry-Projekt erstellen + DSN konfigurieren
- **Was:** Sentry-Projekt auf sentry.io anlegen, DSN kopieren
- **Wo:** Vercel Environment Variables setzen:
  - `SENTRY_DSN`
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
  - `SENTRY_AUTH_TOKEN`
- **Status:** Code ist fertig (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts`, `global-error.tsx`). Braucht nur das Sentry-Projekt + DSN.
- [ ] Sentry-Projekt erstellen
- [ ] DSN in Vercel Env setzen
- [ ] Testfehler ausloesen und Sentry-Dashboard pruefen

### 2. n8n API Key erneuern
- **Was:** Der n8n API Key ist abgelaufen (Ablaufdatum: 2025-11-29)
- **Wo:** n8n UI → Settings → API Keys → Neuen Key generieren
- **Auswirkung:** Ohne gueltigen Key funktionieren WF 08 (Health Check) und WF 10 (Backup) nicht
- [ ] Neuen API Key generieren
- [ ] In `.env` aktualisieren: `N8N_API_KEY=...`
- [ ] Container neu starten: `docker compose up -d --force-recreate n8n`
- [ ] Health Check WF 08 testen

### 3. Neue Workflows deployen (WF 08-11)
- **Was:** 4 neue Operations-Workflows muessen in n8n importiert werden
- **Dateien:**
  - `n8n/workflows/google-maps-pipeline/08-health-check.json`
  - `n8n/workflows/google-maps-pipeline/09-daily-digest.json`
  - `n8n/workflows/google-maps-pipeline/10-workflow-backup.json`
  - `n8n/workflows/google-maps-pipeline/11-pipeline-integrity-check.json`
- [ ] JSONs in n8n UI importieren
- [ ] Credentials zuweisen (Supabase, SMTP)
- [ ] Error Workflow (WF 07) als Error-Handler setzen
- [ ] Schedule-Trigger aktivieren
- [ ] Jeden Workflow einmal manuell testen

---

## Mittlere Prioritaet

### 4. Staging-Umgebung aufsetzen
- **Was:** Separates Supabase-Projekt fuer Staging, damit Vercel Preview Deployments nicht gegen Production laufen
- [ ] Supabase Staging-Projekt erstellen (eu-central-1)
- [ ] Alle Migrations ausfuehren
- [ ] Vercel Preview Deployments auf Staging-Supabase umleiten
- [ ] Optional: n8n Test-Instanz (oder Test-Workflows auf bestehender Instanz)

---

## Niedrige Prioritaet

### 5. DSGVO: Auftragsverarbeitungsvertraege (AVV) pruefen
- **Was:** Datenverarbeitungsvertraege mit allen Drittanbietern pruefen/abschliessen
- [ ] Supabase AVV pruefen (GDPR DPA auf supabase.com)
- [ ] Vercel AVV pruefen
- [ ] Hetzner AVV pruefen
- [ ] Apify AVV pruefen
- [ ] OpenAI AVV pruefen

### 6. Log-Retention automatisieren
- **Was:** `system_logs` Tabelle waechst unbegrenzt — Eintraege > 90 Tage automatisch loeschen
- **Optionen:**
  - pg_cron Extension in Supabase aktivieren + Scheduled Job
  - Oder neuer n8n Workflow (einfacher)
- [ ] Retention-Policy implementieren
- [ ] Testen dass alte Logs geloescht werden

### 7. De-Duplizierung in WF 07 (Error Logger)
- **Was:** Gleicher Fehler kann aktuell 50x hintereinander als Email gesendet werden
- **Loesung:** Vor Email-Versand pruefen ob gleicher Error in letzten 5 Minuten bereits geloggt wurde
- [ ] De-Duplizierungs-Logik in WF 07 einbauen
- [ ] Testen mit wiederholtem Fehler
