# Project Blueprint — Google Maps Lead Pipeline

> Source of Truth fuer dieses Projekt. Alle anderen Dokumente referenzieren hierauf.
> Zuletzt aktualisiert: 2026-03-03

---

## 1. Ziel & Outcome

**Problem das wir loesen:**
Localweb braucht einen automatisierten Prozess um potenzielle Kunden (lokale Unternehmen) ueber Google Maps zu finden, deren Kontaktdaten zu extrahieren und als CSV fuer den Vertrieb aufzubereiten.

**Loesung:**
Automatisierte Pipeline: Google Maps Scraping → Qualifizierung → Kontakt-Enrichment → CSV-Export. Bestehend aus 7 unabhaengigen n8n Workflows (Event-driven State Machine).

**Erfolg sieht so aus:**
- Pipeline verarbeitet neue Locations vollautomatisch von Scraping bis CSV-Export
- Fehler in einem Schritt blockieren nicht die gesamte Pipeline
- Automatischer Retry bei transienten Fehlern (max 3x)
- Taeglich CSV mit qualifizierten Leads per Email

---

## 2. Scope

### In Scope
- Google Maps Scraping via Apify (DE/AT/CH)
- Automatische Kategorie-Qualifizierung (OpenAI GPT-4o-mini)
- Website-Enrichment (Impressum-Kontakte via Puppeteer)
- CSV-Export per Email (Hetzner SMTP)
- Fehlerbehandlung mit Retry und Error-Logging
- Pipeline-Stage basierte State Machine (PostgreSQL ENUMs)

### Out of Scope
- Close.io CRM Integration (WF 06 — spaeter separat)
- Frontend-Dashboard fuer Pipeline-Monitoring
- Multi-Mandanten-Faehigkeit

### Phase 2 (bekannt, aber nicht jetzt)
- Frontend mit Pipeline-Status-Uebersicht
- Manueller Retry ueber Dashboard
- Close.io Direct-Export

---

## 3. Stakeholder

| Rolle | Name | Verantwortung |
|---|---|---|
| Auftraggeber | Localweb | Anforderungen, Abnahme |
| Entwicklung | Bao Hoang | Umsetzung, Testing |

---

## 4. User Journeys

### Journey 1: Neue Location anlegen
1. Location wird in Supabase erstellt (country, city, query) mit pipeline_stage=new
2. WF 01 pickt Location auf, startet Apify Scrape
3. WF 01b prueft ob Apify fertig ist
4. WF 02 importiert Ergebnisse als Businesses
5. WF 03 qualifiziert Businesses per OpenAI
6. WF 04a/04b enrichen qualifizierte Businesses (Website-Scraping)
7. WF 05 exportiert enriched Businesses als CSV per Email

### Journey 2: Fehlerfall
1. WF schlaegt fehl → pipeline_stage wird auf failed_* gesetzt
2. retry_count wird incrementiert, last_error gespeichert
3. Automatischer Retry nach Wartezeit (wenn retry_count < 3)
4. WF 07 Error Logger sendet Alert-Email

---

## 5. Systeme & Integrationen

| System | Rolle | Auth | Source of Truth fuer |
|---|---|---|---|
| Supabase | Datenbank & REST API | Service Role Key | Alle Daten + Pipeline-Status |
| Apify | Google Maps Scraper | Bearer Token | Scraping-Ergebnisse |
| OpenAI | Kategorie-Qualifizierung | API Key | Qualification Reason |
| n8n | Workflow-Automation | Self-hosted | Workflow-Logik |
| Hetzner Mail | SMTP Email | SMTP Credentials | CSV-Versand |
| Cloudflare | Tunnel fuer Webhooks | Tunnel Token | - |

---

## 6. Idempotenz

- Businesses per `place_id` dedupliziert (UPSERT mit merge-duplicates)
- Locations per UNIQUE(country, city, query)
- Jeder Workflow verarbeitet nur Items im erwarteten `pipeline_stage`
- Doppeltes Ausfuehren verarbeitet Items nicht erneut (Stage wurde schon verschoben)

---

## 7. Datenmodell-Uebersicht

> Details in `knowledge/data_models.md`

- **locations** — Stadt × Suchbegriff Kombinationen (pipeline_stage: new → scraping → scraped → imported)
- **businesses** — Google Maps Ergebnisse (pipeline_stage: new → qualified → enriching → enriched → exported)
- **pipeline_runs** — Workflow-Monitoring (optional)
- **workflow_logs** — Error-Logs (WF 07)
