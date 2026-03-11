# Projektplan — [PROJECT_NAME]

> Dieser Plan wird von Claude Code und dir gemeinsam gepflegt.
> Aktualisiere den Status nach jeder Session.
> Zuletzt aktualisiert: [DATUM]

---

## Status-Legende

```
[ ] Offen
[~] In Arbeit
[x] Fertig
[!] Blockiert — Grund steht beim Task
```

---

## Aktueller Stand

**Aktuelle Phase:** Phase 1
**Nächster Task:** 1.1
**Letzter abgeschlossener Task:** —
**Offene Blocker:** —

**Für die nächste Session:**
```
Lies @docs/project_plan.md und @.claude/CLAUDE.md.
Wir arbeiten heute an Task [X.X]: [Task-Name].
```

---

## Phase 0 — Fundament & Setup

> Ziel: Lokale Entwicklungsumgebung läuft, Basis-Infrastruktur steht.
> Fertig wenn: `npm run dev` läuft, Supabase verbunden, n8n erreichbar.

| # | Task | Fertig wenn... | Status | Aufwand |
|---|---|---|---|---|
| 0.1 | Supabase Projekt anlegen + .env.local befüllen | Verbindung steht, Anon Key funktioniert | [ ] | 30min |
| 0.2 | Next.js Projekt initialisieren (shadcn, Tailwind, TypeScript strict) | `npm run dev` ohne Fehler | [ ] | 30min |
| 0.3 | Supabase Auth einrichten (Middleware, Login-Route) | Login/Logout funktioniert lokal | [ ] | 1h |
| 0.4 | n8n Instanz erreichbar + Credentials angelegt | Test-Workflow läuft durch | [ ] | 30min |
| 0.5 | Error-Logger Workflow in n8n | Fehler landen in Supabase + Slack | [ ] | 1h |

---

## Phase 1 — Datenmodell & Schema

> Ziel: Alle Tabellen existieren, RLS aktiv, Typen generiert.
> Fertig wenn: Migrations auf Staging deployed, TypeScript-Typen generiert.

| # | Task | Fertig wenn... | Status | Aufwand |
|---|---|---|---|---|
| 1.1 | [Tabelle 1] Migration schreiben | Migration läuft durch, Tabelle existiert | [ ] | 1h |
| 1.2 | [Tabelle 2] Migration + RLS Policies | RLS getestet mit verschiedenen Rollen | [ ] | 1h |
| 1.3 | TypeScript Types generieren | `supabase gen types` — keine Fehler | [ ] | 30min |
| 1.4 | Seed-Daten für lokale Entwicklung | Test-Datensätze vorhanden | [ ] | 30min |

---

## Phase 2 — [Kern-Feature / Integration]

> Ziel: [Was ist das Ergebnis dieser Phase?]
> Fertig wenn: [Konkretes Akzeptanzkriterium]

| # | Task | Fertig wenn... | Status | Aufwand |
|---|---|---|---|---|
| 2.1 | [OFFEN] | | [ ] | |
| 2.2 | [OFFEN] | | [ ] | |

---

## Phase 3 — [Weitere Features]

> [OFFEN]

| # | Task | Fertig wenn... | Status | Aufwand |
|---|---|---|---|---|
| 3.1 | [OFFEN] | | [ ] | |

---

## Phase 4 — n8n Automationen

> Ziel: Alle Workflows laufen in Produktion, Fehlerbehandlung aktiv.
> Fertig wenn: Orchestrator läuft 24h ohne Fehler.

| # | Task | Fertig wenn... | Status | Aufwand |
|---|---|---|---|---|
| 4.1 | [Workflow 1] bauen + testen | Test-Run erfolgreich, Daten korrekt | [ ] | 2h |
| 4.2 | [Workflow 2] bauen + testen | [OFFEN] | [ ] | |
| 4.3 | Orchestrator + Cron einrichten | Läuft automatisch zur geplanten Zeit | [ ] | 1h |

---

## Phase 5 — Frontend

> Ziel: Alle Screens implementiert, Daten kommen aus Supabase.
> Fertig wenn: Kunde kann alle User Journeys aus project_blueprint.md durchführen.

| # | Task | Fertig wenn... | Status | Aufwand |
|---|---|---|---|---|
| 5.1 | Layout + Navigation + Sidebar | Responsive, alle Links funktionieren | [ ] | 1h |
| 5.2 | [Screen 1] | User Journey 1 vollständig | [ ] | 2h |
| 5.3 | [Screen 2] | User Journey 2 vollständig | [ ] | 2h |
| 5.4 | Loading + Error + Empty States | Kein Screen ohne State-Handling | [ ] | 1h |

---

## Phase 6 — Testing & Polish

> Ziel: Stabil genug für Kunden-Abnahme.

| # | Task | Fertig wenn... | Status | Aufwand |
|---|---|---|---|---|
| 6.1 | E2E Durchlauf aller User Journeys | Keine kritischen Bugs | [ ] | 2h |
| 6.2 | Performance Check (Lighthouse) | Score > 90 in allen Kategorien | [ ] | 1h |
| 6.3 | DSGVO Check (Cookie, Datenschutz, Impressum) | Alle Pflichtseiten vorhanden | [ ] | 1h |

---

## Phase 7 — Deployment

| # | Task | Fertig wenn... | Status | Aufwand |
|---|---|---|---|---|
| 7.1 | Staging deployed + Kunde testet | Abnahme-Feedback eingeholt | [ ] | 1h |
| 7.2 | Produktions-Deployment | Live-URL funktioniert | [ ] | 1h |
| 7.3 | Monitoring aktiv | Erster Alert-Test erfolgreich | [ ] | 30min |
| 7.4 | Übergabe-Doku | Kunde kann selbst neue Inhalte anlegen | [ ] | 1h |

---

## Abgeschlossene Sessions

> Protokoll was in welcher Session erledigt wurde.

| Datum | Tasks | Notizen |
|---|---|---|
| [DATUM] | [Task-Nummern] | [Was war schwierig, was hat gut geklappt] |

---

## Bekannte Probleme & Entscheidungen

> Technische Schulden, bewusste Kompromisse, spätere Verbesserungen.

| Beschreibung | Warum so | Wann beheben |
|---|---|---|
| [OFFEN] | | |
