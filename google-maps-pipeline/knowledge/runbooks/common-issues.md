# Haeufige Probleme — Google Maps Lead Pipeline

---

## n8n Workflow haengt / reagiert nicht

**Symptom:** Workflow-Executions bleiben stehen, keine neuen Items verarbeitet.

**Diagnose:**
```bash
cd clients/localweb/n8n/docker
docker compose ps          # Container-Status pruefen
docker compose logs --tail 50 n8n  # Logs pruefen
```

**Loesung:**
```bash
docker compose restart n8n
# Falls nicht reicht:
docker compose down && docker compose up -d
```

**Nach Restart:** Pipeline Integrity Check (WF 11) manuell ausloesen um stuck Items zu finden.

---

## Apify Rate Limit / Quota erschoepft

**Symptom:** WF 01 schlaegt fehl mit "API rate limit exceeded" oder "Insufficient credits".

**Diagnose:**
- Apify Dashboard → Usage pruefen
- system_logs: `source = 'n8n' AND workflow_name LIKE '%01%'`

**Loesung:**
1. Abwarten bis Rate Limit zurueckgesetzt wird (meistens 1min)
2. Falls Quota: Apify Plan upgraden oder Actor Runs reduzieren
3. Batch-Size in WF 01 temporaer reduzieren (LIMIT 4 statt 8)

---

## OpenAI API Fehler (WF 03 / 04b)

**Symptom:** "Rate limit reached" oder "Server error" bei Qualifizierung/Enrichment.

**Loesung:**
1. Rate Limit Node in WF 03 pruefen (aktuell: 200ms)
2. Falls 429: Wartezeit erhoehen auf 500ms
3. Falls 500/503: Abwarten, OpenAI Status pruefen (status.openai.com)

---

## Supabase Connection Limit erreicht

**Symptom:** "Too many connections" oder "Connection pool exhausted".

**Diagnose:**
- Supabase Dashboard → Database → Connection Pool
- Supabase Logs pruefen

**Loesung:**
1. n8n Concurrency reduzieren: `N8N_CONCURRENCY_PRODUCTION_LIMIT=20`
2. Offene Connections identifizieren: `SELECT * FROM pg_stat_activity WHERE state = 'idle';`
3. Idle Connections terminieren: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND query_start < now() - interval '5 minutes';`
4. Container neu starten: `docker compose up -d --force-recreate n8n`

---

## Pipeline-Items stecken in "scraping" / "enriching"

**Symptom:** Items bleiben laenger als 30min in einem Zwischenstatus.

**Diagnose:**
- Ops Dashboard → Pipeline-Fehler pruefen
- View: `SELECT * FROM pipeline_errors;`

**Loesung:**
```sql
-- Stuck Locations zuruecksetzen
UPDATE locations
SET pipeline_stage = 'failed_scrape',
    last_error = 'Manuell zurueckgesetzt: Stuck in scraping'
WHERE pipeline_stage = 'scraping'
AND updated_at < now() - interval '1 hour';

-- Stuck Businesses zuruecksetzen
UPDATE businesses
SET pipeline_stage = 'failed_enrich',
    last_error = 'Manuell zurueckgesetzt: Stuck in enriching'
WHERE pipeline_stage = 'enriching'
AND updated_at < now() - interval '30 minutes';
```

---

## CSV-Export Email kommt nicht an (WF 05)

**Symptom:** Keine taegliche CSV-Email trotz exportierbarer Businesses.

**Diagnose:**
1. n8n UI: WF 05 Execution pruefen
2. SMTP Credentials pruefen: Hetzner Robot → Mail
3. Spam-Ordner pruefen

**Loesung:**
1. WF 05 manuell ausloesen (Webhook: test-wf05)
2. Falls SMTP-Fehler: Passwort in n8n Credential Store aktualisieren
3. Falls keine Items: `SELECT count(*) FROM businesses WHERE pipeline_stage = 'enriched';`

---

## Vercel Deployment fehlgeschlagen

**Symptom:** Build Error auf Vercel, Dashboard nicht erreichbar.

**Loesung:**
1. Vercel Dashboard → Deployments → Build Logs pruefen
2. Lokal testen: `cd frontend && npm run build`
3. Falls Environment Vars fehlen: Vercel Dashboard → Settings → Environment Variables
4. Rollback: Vorheriges Deployment → "Promote to Production"

---

## Sentry zeigt keine Errors

**Symptom:** Sentry Dashboard ist leer trotz bekannter Fehler.

**Pruefen:**
1. `NEXT_PUBLIC_SENTRY_DSN` auf Vercel gesetzt?
2. `SENTRY_DSN` (server-side) auf Vercel gesetzt?
3. `SENTRY_AUTH_TOKEN` fuer Source Maps gesetzt?
4. Sentry ist nur in Production aktiv (`enabled: process.env.NODE_ENV === "production"`)
