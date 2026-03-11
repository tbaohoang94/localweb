# Supabase — Close CRM Sync

> Projektspezifische Supabase-Konventionen, RLS-Policies und Auth-Setup.

---

## Projekt-Details

| | |
|---|---|
| Projekt-Name | close.io |
| Projekt-ID | vgdamdwglsqsmkiojtif |
| Projekt-URL | https://vgdamdwglsqsmkiojtif.supabase.co |
| Region | eu-west-1 (Ireland) |
| Plan | Free |
| PostgreSQL | 17.6 |

---

## Schema-Konventionen

- Tabellennamen: `snake_case`, Plural (`leads`, `calls`, `opportunities`)
- Spalten: `snake_case`
- Primaerschluessel: immer `id uuid DEFAULT gen_random_uuid()`
- Timestamps: `created_at` (DEFAULT now()), `synced_at` (letzter n8n Sync)
- Externe IDs: `close_[entity]_id` z.B. `close_user_id`, `close_lead_id`
- Enums: `user_role` (caller/setter/closer/admin), `user_status` (active/inactive)
- JSONB: `custom_fields` fuer Close.io Custom Fields

---

## Tabellen (12 + test_runs)

| Tabelle | Rows | Source | Beschreibung |
|---|---|---|---|
| users | 34 | Close.io | CRM-Benutzer |
| leads | 152.290 | Close.io | Leads/Kontakte |
| calls | 253.702 | Close.io | Anrufe |
| meetings | 6.311 | Close.io | Meetings |
| opportunities | 1.811 | Close.io | Verkaufschancen |
| custom_activity_types | 12 | Close.io | Aktivitaetstyp-Definitionen |
| custom_activities | 9.487 | Close.io | Custom Activities (EG/SG/NoShow) |
| transcripts | 164 | Close + Demodesk | Gespraechstranskripte |
| commission_rules | 4 | Manuell | Provisionsregeln |
| custom_fields | 143 | Close.io | Custom Field Definitionen |
| sync_runs | 190 | n8n | Sync-Tracking |
| test_runs | 17 | n8n/Claude | Workflow-Test-Ergebnisse |

Details: `knowledge/data_models.md`

---

## Auth Setup

**Auth-Provider:** Email/Password (Supabase Auth)
**Session-Handling:** SSR via `@supabase/ssr`
**Middleware:** `middleware.ts` schuetzt alle `/dashboard/*` Routen

```typescript
// lib/supabase-server.ts — Server Component
import { createServerClient } from '@supabase/ssr'

// lib/supabase-browser.ts — Client Component
import { createBrowserClient } from '@supabase/ssr'
```

---

## RLS Policies

> Row Level Security ist auf ALLEN 12 Tabellen aktiviert (seit 2026-03-02).

### Prinzip
- **Kein Zugriff ohne explizite Policy**
- **Service Role (n8n)** hat vollen Zugriff — umgeht RLS automatisch
- **Authenticated Users** haben nur SELECT-Zugriff (read-only Dashboard)
- **Anon Users** haben keinen Zugriff

### Aktuelle Policies

Alle Tabellen haben die gleiche Policy:
```sql
CREATE POLICY "authenticated_read" ON [tabelle]
  FOR SELECT TO authenticated USING (true);
```

Keine INSERT/UPDATE/DELETE Policies fuer authenticated — nur Service Role kann schreiben.

---

## Migrations

**Aktuelle Baseline:** `supabase/migrations/000_baseline.sql`
**Archivierte Migrationen:** `supabase/migrations/_archive/` (veraltet, nur Referenz)

Migrationen werden ueber Supabase MCP `apply_migration` ausgefuehrt.
Neue Migrationen werden additiv hinzugefuegt.

---

## Functions

| Function | Typ | Zweck |
|---|---|---|
| `get_caller_call_stats(p_caller_ids, p_from, p_to)` | SQL | Aggregiert Brutto/Netto-Calls und Talk-Time pro Caller |
| `resolve_lead_id(...)` | SQL | Matcht Demodesk-Teilnehmer auf Leads via E-Mail |

---

## Nuetzliche Queries

```sql
-- Sync-Status pruefen
SELECT entity, status, records_synced, error_message, started_at
FROM sync_runs ORDER BY created_at DESC LIMIT 10;

-- Opportunity-Verteilung nach Status
SELECT status, COUNT(*), SUM(value) FROM opportunities GROUP BY status;

-- Groesste Tabellen
SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;
```

---

## Offene Punkte

- [ ] Leaked Password Protection im Auth-Dashboard aktivieren
- [ ] Archivierungsstrategie fuer calls-Tabelle (253k+ Rows)
- [ ] Supabase auf Pro-Plan upgraden wenn Free-Limits erreicht werden
