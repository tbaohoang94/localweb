# Testing Audit — Google Maps Lead Pipeline

> Erstellt: 2026-03-04
> Status: Alle 8 Phasen abgeschlossen

---

## Bestandsaufnahme

### Bestehende Tests

| Aspekt | Status | Details |
|--------|--------|---------|
| Test-Dateien | **KEINE** | 0 eigene Test-Dateien im Projekt |
| Test-Framework | **KEINES** | Weder Vitest noch Jest konfiguriert |
| Coverage | **0%** | Keine Tests = keine Coverage |
| E2E Tests | **KEINE** | Kein Playwright/Cypress |
| DB Tests | **KEINE** | Kein pgTAP |
| n8n Tests | **KEINE** | Kein Workflow-Testing |

### Staging-Umgebung

| Aspekt | Status | Details |
|--------|--------|---------|
| Supabase Staging | **FEHLT** | Nur Production-Projekt (wknzyrvcrcdchnysntii) |
| n8n Test-Instanz | **FEHLT** | Nur lokale Docker-Instanz (= Production) |
| Vercel Preview | **VORHANDEN** | Auto-Deploy auf Push, aber nutzt Production-Supabase |
| Test-Credentials | **FEHLT** | Keine separaten API Keys fuer Testing |

### Testdaten

| Aspekt | Status | Details |
|--------|--------|---------|
| Seed-Script | **FEHLT** | Kein automatisiertes Testdaten-Setup |
| Test-Fixtures | **FEHLT** | Keine Mock-Daten |
| Edge-Case-Daten | **FEHLT** | Keine Sonderzeichen/Grenzwert-Testdaten |

---

## Zu testender Code

### lib/ (14 Dateien)

| Datei | Typ | Testbedarf |
|-------|-----|------------|
| `lib/supabase-browser.ts` | Supabase Client (Browser) | Mock-Tests |
| `lib/supabase-server.ts` | Supabase Client (Server) | Mock-Tests |
| `lib/supabase-helpers.ts` | Query-Hilfsfunktionen | Unit Tests |
| `lib/pipeline-stages.ts` | Pipeline Stage Definitionen | Unit Tests |
| `lib/format.ts` | Formatierungs-Utilities | Unit Tests |
| `lib/logger.ts` | Pino Logger | Unit Tests |
| `lib/utils.ts` | Allgemeine Utilities (cn) | Unit Tests |
| `lib/hooks/use-businesses.ts` | Custom Hook | Hook Tests |
| `lib/hooks/use-locations.ts` | Custom Hook | Hook Tests |
| `lib/hooks/use-ops-data.ts` | Custom Hook | Hook Tests |
| `lib/hooks/use-pipeline-counts.ts` | Custom Hook | Hook Tests |
| `lib/hooks/use-runs.ts` | Custom Hook | Hook Tests |
| `lib/hooks/use-search-stats.ts` | Custom Hook | Hook Tests |
| `lib/types/database.types.ts` | Type Definitionen | Kein Test noetig |

### app/api/ (1 Route)

| Route | Methode | Testbedarf |
|-------|---------|------------|
| `/api/health` | GET | Unit + Integration |

### Komponenten (16 Dateien)

| Komponente | Testbedarf |
|------------|------------|
| `businesses-table.tsx` | Rendering + Interaktion |
| `locations-table.tsx` | Rendering + Interaktion |
| `runs-table.tsx` | Rendering + Interaktion |
| `pipeline-overview.tsx` | Rendering |
| `search-overview.tsx` | Rendering |
| `add-location-form.tsx` | Form-Validierung + Submit |
| `csv-import-modal.tsx` | File Upload + Parse |
| `login-form.tsx` | Auth-Flow |
| `signup-form.tsx` | Auth-Flow |
| `sidebar.tsx` | Navigation |
| `logout-button.tsx` | Auth-Flow |
| `status-badge.tsx` | Rendering |
| `ui/badge.tsx` | Shadcn — kein Test noetig |
| `ui/button.tsx` | Shadcn — kein Test noetig |
| `ui/card.tsx` | Shadcn — kein Test noetig |
| `ui/tooltip.tsx` | Shadcn — kein Test noetig |

### Dashboard Pages (6 Seiten)

| Seite | Testbedarf |
|-------|------------|
| `/dashboard` | Rendering + Daten laden |
| `/dashboard/businesses` | Tabelle + Filter |
| `/dashboard/locations` | Tabelle + CRUD |
| `/dashboard/runs` | Tabelle |
| `/dashboard/ops` | KPIs + Tabellen |
| `layout.tsx` | Sidebar + Auth Guard |

### Supabase (8 Migrations, 5 Views, 8 Tabellen)

| Aspekt | Testbedarf |
|--------|------------|
| RLS Policies (8 Tabellen) | pgTAP: SELECT/INSERT/UPDATE/DELETE pro Rolle |
| Migrations (8 Dateien) | Sequentielle Ausfuehrung auf leerer DB |
| Constraints | FK, UNIQUE, NOT NULL, CHECK |
| Views (5) | Korrekte Aggregation, RLS-Durchsetzung |
| ENUMs (2) | Gueltige Werte, ungueltige abgewiesen |

### n8n Workflows (11 aktiv)

| Workflow | Testbedarf |
|----------|------------|
| WF 01 — Scrape Dispatcher | Webhook-Test + Supabase-Ergebnis |
| WF 01b — Scrape Status | Apify-Status Auswertung |
| WF 02 — Import | Batch-Upsert Korrektheit |
| WF 03 — Qualify | OpenAI Auswertung + Stage-Update |
| WF 04a — Enrich Dispatcher | Worker-Dispatch korrekt |
| WF 04b — Enrich Worker | Puppeteer + OpenAI Ergebnis |
| WF 05 — Export | CSV-Erstellung + Email |
| WF 07 — Error Logger | Error-Handling + Logging |
| WF 08 — Health Check | Konnektivitaet |
| WF 09 — Daily Digest | Report-Inhalt |
| WF 10 — Backup | Workflow-Export |
| WF 11 — Integrity | Stuck-Detection |

---

## Zusammenfassung

- **Test-Abdeckung: 0%** — keinerlei Tests vorhanden
- **Prioritaet 1:** Vitest + React Testing Library fuer Frontend
- **Prioritaet 2:** pgTAP fuer RLS und Constraint Tests
- **Prioritaet 3:** n8n Webhook/Integration Tests
- **Blocker:** Keine Staging-Umgebung — Tests muessen gegen Mocks laufen oder Staging muss zuerst erstellt werden

---

## Naechste Schritte (Phase 0.2)

1. Vitest + React Testing Library einrichten
2. pgTAP Konzept (ohne Staging: Migrations-Test gegen lokale DB)
3. n8n Test-Konzept definieren
4. Testdaten-Seed erstellen
