# Testing — Google Maps Lead Pipeline

> Vollstaendige Test-Dokumentation.
> Erstellt: 2026-03-04 (Testing & Resilience Audit)

---

## Test-Uebersicht

### Ausfuehrung

| Test-Typ | Befehl | Ort |
|----------|--------|-----|
| Unit Tests | `npm run test` | `frontend/` |
| Unit Tests (Watch) | `npm run test:watch` | `frontend/` |
| Coverage Report | `npm run test:coverage` | `frontend/` |
| DB Tests (pgTAP) | `bash scripts/test-db.sh` | Root |
| n8n Integration | `npx tsx tests/n8n/test-n8n-workflows.ts` | Root |
| Pipeline E2E | `npx tsx tests/integration/pipeline-e2e.test.ts` | Root |
| Smoke Tests | `bash scripts/smoke-test.sh` | Root |
| Load Tests (API) | `k6 run tests/load/api-routes.js` | Root |
| Load Tests (Supabase) | `k6 run tests/load/supabase-queries.js` | Root |
| Webhook Flood | `npx tsx tests/load/n8n-webhook-flood.ts` | Root |
| Chaos Tests | `npx tsx tests/resilience/chaos-tests.ts` | Root |

### Verzeichnisstruktur

```
frontend/
  vitest.config.ts              — Vitest-Konfiguration
  tests/
    setup.ts                    — Globale Mocks (Supabase, Next.js)
    smoke.test.ts               — Smoke Test (Vitest laeuft)
    lib/
      format.test.ts            — Formatierungs-Utilities
      format-edge-cases.test.ts — Edge Cases fuer Formatierung
      pipeline-stages.test.ts   — Pipeline Stage Definitionen
      pipeline-stages-edge-cases.test.ts — Edge Cases
      utils.test.ts             — cn() Utility
      supabase-helpers.test.ts  — batchInsert
      logger.test.ts            — Pino Logger
    hooks/
      use-locations.test.ts     — Locations Hook
      use-businesses.test.ts    — Businesses Hook
    api/
      health.test.ts            — Health-Endpoint
      health-edge-cases.test.ts — Edge Cases

tests/                          — Projekt-weite Tests (nicht Vitest)
  db/
    rls_policies.test.sql       — pgTAP: RLS auf allen Tabellen
    constraints.test.sql        — pgTAP: ENUMs, NOT NULL, UNIQUE, Indizes
    migrations.test.sql         — pgTAP: Migration-Konsistenz
    views.test.sql              — pgTAP: Views existieren, security_invoker
  n8n/
    test-n8n-workflows.ts       — Webhook-Integration-Tests
  integration/
    pipeline-e2e.test.ts        — Pipeline End-to-End
  resilience/
    chaos-tests.ts              — Chaos & Resilience
  load/
    api-routes.js               — k6: Next.js API Load
    supabase-queries.js         — k6: Supabase Query Load
    n8n-webhook-flood.ts        — Webhook Flood Szenarien
    results/                    — Load Test Ergebnisse

scripts/
  smoke-test.sh                 — Post-Deployment Smoke Tests
  test-db.sh                    — pgTAP Runner (nur Staging)
  seed-test-data.ts             — Testdaten-Generator
```

---

## Coverage-Ziele

| Bereich | Ziel | Aktuell |
|---------|------|---------|
| Unit Tests (lib/) | > 80% | ~85% (format, pipeline-stages, utils, helpers) |
| API Routes | 100% | 100% (/api/health) |
| Hooks | > 70% | ~70% (use-locations, use-businesses) |
| RLS Tests (pgTAP) | 100% aller Tabellen | 6/8 Tabellen getestet |
| n8n Integration | Alle WFs mit Webhook | 3/3 Webhooks |
| Komponenten | > 60% | [OFFEN — noch keine Komponenten-Tests] |

---

## Wann welche Tests laufen

| Trigger | Tests |
|---------|-------|
| Jeder Push (CI) | Unit Tests + ESLint + TypeScript + Build |
| Pull Request | + Coverage Report |
| Jedes Deployment | Smoke Tests |
| Taeglich (manuell/n8n) | Smoke + Sync-Validierung |
| Quartalsweise | Load + Stress + Chaos |
| Nach Supabase Migration | pgTAP (RLS + Constraints) |
| Nach n8n Workflow-Aenderung | n8n Integration Tests |

---

## Test-Maintenance-Regeln

- Neues Feature = neue Tests (keine Ausnahme)
- Neue Supabase-Tabelle = RLS Tests in `tests/db/rls_policies.test.sql`
- Neuer n8n-Workflow = Integration Test + Error-Case
- Neue API-Route = Unit Test + Auth Test
- Bug-Fix = Regression Test der den Bug reproduziert BEVOR er gefixt wird
- Seed-Script aktuell halten bei Schema-Aenderungen
- Test-Credentials rotieren (nicht dieselben wie Production)

---

## Voraussetzungen fuer Integration/Load/Chaos Tests

| Test-Typ | Env-Variable | Beschreibung |
|----------|-------------|-------------|
| pgTAP | `STAGING_DB_URL` | PostgreSQL Connection String (Staging) |
| Integration | `STAGING_SUPABASE_URL` | Supabase REST URL (Staging) |
| Integration | `STAGING_SUPABASE_KEY` | Supabase Service Role Key (Staging) |
| n8n Tests | `N8N_BASE_URL` | n8n URL (default: http://localhost:5678) |
| Smoke Tests | `NEXT_URL` | Frontend URL (default: http://localhost:3000) |
| Load Tests | k6 installiert | `brew install k6` |

**WICHTIG:** Alle Integration/Load/Chaos Tests haben eingebauten Production-Schutz — sie brechen ab wenn das Production-Projekt (`wknzyrvcrcdchnysntii`) erkannt wird.
