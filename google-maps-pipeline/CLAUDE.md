# Google Maps Pipeline — Projekt-Kontext

> Ergänzt die globale CLAUDE.md (localweb/.claude/CLAUDE.md).
> Nur projektspezifische Informationen stehen hier.

---

## Kunde

**Kunde:** Localweb
**Kundenprofil:** @../../_client/profile.md ← zuerst lesen
**Vereinbarungen:** @../../_client/agreements.md ← bei Deployment/DSGVO-Fragen

---

## Projekt

**Typ:** [ ] Automation | [ ] Frontend | [ ] Fullstack
**Status:** [ ] Discovery | [ ] In Entwicklung | [ ] Live
**Zuletzt aktualisiert:** 2026-02-25

**Ziel:**
[Ein Satz — was löst dieses Projekt für wen?]

---

## Dokumente (knowledge/)

| Dokument | Wann lesen |
|---|---|
| @knowledge/project_blueprint.md | Immer zuerst |
| @knowledge/project_plan.md | Aktuellen Task finden |
| @knowledge/architecture.md | Systemdesign-Fragen |
| @knowledge/data_models.md | DB / Datenstruktur |
| @knowledge/supabase.md | Schema, RLS, Auth |
| @knowledge/n8n.md | Workflows, Credentials |
| @knowledge/security.md | Auth, Secrets, DSGVO |
| @knowledge/error_handling.md | Fehlerbehandlung |
| @knowledge/apis/ | API-Integrationen |

---

## Session starten

**Kickoff (neues Projekt):**
```
Lies @.claude/kickoff.md und starte den Kickoff.
```

**Weiterarbeiten:**
```
Lies @knowledge/project_plan.md. Wir arbeiten heute an Task [X.X].
```

---

## Aktueller Task

**Task:** [OFFEN — nach Kickoff ausfüllen]
**Blocker:** —

---

## Tests

- Neues Feature = neue Tests (keine Ausnahme)
- Neue Supabase-Tabelle = RLS Tests in `tests/db/rls_policies.test.sql`
- Neuer n8n-Workflow = Integration Test + Error-Case
- Neue API-Route = Unit Test + Auth Test
- Bug-Fix = Regression Test der den Bug reproduziert BEVOR er gefixt wird
- Unit Tests: `cd frontend && npm run test`
- Smoke Tests: `bash scripts/smoke-test.sh`
- Vollstaendige Doku: @knowledge/testing.md

## Offene Punkte

Siehe @knowledge/offene-punkte.md
