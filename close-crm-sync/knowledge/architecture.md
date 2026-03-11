# Architektur — [PROJECT_NAME]

> Systemdesign, Datenfluss und technische Entscheidungen.

---

## Systemübersicht

```
[Skizze des Datenflusses — Text-Diagramm]

Beispiel:
Close.io ──(Pull täglich)──► n8n Orchestrator ──► Supabase
                                    │
                              Error Logger
                                    │
                              Slack / E-Mail
```

---

## Komponenten

### Frontend (Next.js / Vercel)
- **Zweck:** [Was macht das Frontend?]
- **Auth:** Supabase Auth — SSR via Middleware
- **Daten:** Server Components lesen direkt aus Supabase

### Datenbank (Supabase / PostgreSQL)
- **Zweck:** Single Source of Truth für alle persistenten Daten
- **RLS:** Aktiviert — Details in `docs/supabase.md`

### Automation (n8n / Hetzner)
- **Zweck:** [Welche Prozesse automatisiert n8n?]
- **Trigger-Typen:** [Webhook / Cron / Manuell]
- **Details:** `docs/n8n.md`

---

## Datenfluss

### Flow 1: [Name, z.B. "Lead Sync"]
```
1. Trigger: [Cron täglich 02:00 Uhr]
2. n8n holt Delta von Close.io API (seit letztem Sync)
3. Transformation: Close-Felder → Supabase-Schema
4. Upsert in Supabase (unique key: close_id)
5. Logging: Sync-Job in sync_logs Tabelle
6. Bei Fehler: Error-Logger Workflow → Slack
```

### Flow 2: [OFFEN]

---

## Technische Entscheidungen (ADR)

> Architecture Decision Records — Warum haben wir X gewählt statt Y?

### ADR-001: [Entscheidung]
**Datum:** [DATUM]
**Entscheidung:** [Was wurde entschieden?]
**Begründung:** [Warum?]
**Alternativen die verworfen wurden:** [Was haben wir nicht genommen und warum?]

---

## Skalierung & Limits

| System | Limit | Unser Bedarf | Risiko |
|---|---|---|---|
| Close.io API | 120 req/min | [OFFEN] | [OFFEN] |
| Supabase | [Plan-abhängig] | [OFFEN] | [OFFEN] |
| n8n | [Execution Timeout] | [OFFEN] | [OFFEN] |

---

## Offene Punkte [OFFEN]

- [ ] [OFFEN]
