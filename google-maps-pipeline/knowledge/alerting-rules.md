# Alerting-Regeln — Google Maps Lead Pipeline

> Definiert wann, wie und an wen Alerts gesendet werden.

---

## Severity-Stufen

| Severity | Kanal | Bedingung | Beispiel |
|----------|-------|-----------|----------|
| Critical | Email sofort | Service komplett down | n8n Container stopped, Supabase nicht erreichbar |
| High | Email sofort | Wiederkehrende Fehler | 5+ Workflow-Fehler in 10min, alle Locations in failed_scrape |
| Medium | Email | Einzelfehler, Performance | 1 Workflow-Fehler, Health-Check > 3s |
| Low | Daily Digest | Informativ | Storage-Wachstum, Pipeline-Durchsatz-Report |

---

## Alert-Quellen

| Quelle | Kanal | Details |
|--------|-------|---------|
| n8n WF 07 (Error Trigger) | Email | Jeder Workflow-Fehler → Email + system_logs |
| n8n Health-Check WF | Email | Alle 5min: Supabase, n8n selbst |
| Next.js /api/health | Externer Monitor | HTTP 200/503 Response |
| Sentry | Sentry Dashboard | Frontend-Exceptions (konfigurierbar) |

---

## De-Duplizierung

- Gleicher Workflow + gleicher Error-Node innerhalb 10 Minuten: nur 1x Email
- Implementierung: `system_logs`-Abfrage vor Email-Versand im Error Workflow
- [OFFEN] Noch nicht implementiert — erfordert Code-Node in WF 07

---

## Daily Digest

- Zeitplan: taeglich 08:00 Europe/Berlin
- Inhalt: Zusammenfassung aus `system_logs` der letzten 24h
- Gruppiert nach Severity + Source
- Pipeline-Durchsatz aus `business_throughput` View
- [OFFEN] Workflow noch nicht erstellt

---

## Eskalation

| Stufe | Zeitrahmen | Aktion |
|-------|-----------|--------|
| 1 | Sofort | Email an NOTIFICATION_EMAIL |
| 2 | 30min ohne Reaktion | [OFFEN] Noch kein zweiter Kanal konfiguriert |
| 3 | 2h ohne Reaktion | [OFFEN] Manueller Eingriff noetig |
