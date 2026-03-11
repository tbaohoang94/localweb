# Project Blueprint — [PROJECT_NAME]

> Source of Truth für dieses Projekt. Alle anderen Dokumente referenzieren hierauf.
> Zuletzt aktualisiert: [DATUM]

---

## 1. Ziel & Outcome

**Problem das wir lösen:**
[Was ist das konkrete Problem des Kunden/Nutzers?]

**Lösung:**
[Was bauen wir genau?]

**Erfolg sieht so aus:**
[Konkrete, messbare Kriterien. Was muss funktionieren damit das Projekt "fertig" ist?]

**Warum jetzt / Warum wir:**
[OFFEN]

---

## 2. Scope

### In Scope
- [Feature / Funktion 1]
- [Feature / Funktion 2]

### Out of Scope
- [Was explizit NICHT gebaut wird]
- [Was Phase 2 ist]

### Phase 2 (bekannt, aber nicht jetzt)
- [OFFEN]

---

## 3. Stakeholder

| Rolle | Name | Verantwortung |
|---|---|---|
| Entscheider | [OFFEN] | Budget, finale Abnahme |
| Fachlicher Ansprechpartner | [OFFEN] | Anforderungen, Testing |
| Entwicklung | [Name] | Umsetzung |

---

## 4. User Journeys

### Journey 1: [Name]
1. Nutzer macht X
2. System tut Y
3. Ergebnis: Z

### Journey 2: [Name]
[OFFEN]

---

## 5. Systeme & Integrationen

| System | Rolle | Richtung | Source of Truth für |
|---|---|---|---|
| Supabase | Datenbank & Auth | - | Alle persistenten Daten |
| [Close.io] | CRM | Pull (wir lesen) | Leads, Opportunities |
| [Stripe] | Payments | Push (Webhooks) | Zahlungsstatus |
| n8n | Automation | - | Workflow-Logik |
| Vercel | Hosting Frontend | - | - |
| Hetzner | Hosting n8n | - | - |

---

## 6. Sync-Strategie

| Datenobjekt | Source | Ziel | Frequenz | Strategie |
|---|---|---|---|---|
| [Leads] | [Close.io] | Supabase | [täglich] | [Delta, Upsert] |
| [OFFEN] | | | | |

**Idempotenz-Ansatz:** [Wie stellen wir sicher dass doppeltes Ausführen keine Probleme macht?]

---

## 7. Datenmodell-Übersicht

> Details in `docs/data_models.md`

Zentrale Entitäten:
- **[Entity 1]** — [kurze Beschreibung, Lebenszyklus]
- **[Entity 2]** — [OFFEN]

---

## 8. Nicht-funktionale Anforderungen

| Anforderung | Zielwert |
|---|---|
| Performance (LCP) | < 2.5s |
| Availability | 99.5% |
| DSGVO | Ja — Daten in EU |
| Authentifizierung | Supabase Auth |
| Backup | [OFFEN] |

---

## 9. Testing & Abnahme

**Abnahmekriterien:**
- [ ] [Kriterium 1]
- [ ] [Kriterium 2]

**Testverantwortlich:** [OFFEN]
**Testfenster:** [OFFEN]

---

## 10. Rollout Plan

| Phase | Was | Wann |
|---|---|---|
| Alpha | Intern testen | [OFFEN] |
| Beta | Kunde testet | [OFFEN] |
| Go-Live | Produktiv | [OFFEN] |

---

## 11. Offene Punkte [OFFEN]

- [ ] [OFFEN]
