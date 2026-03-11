# ADR-002: Pipeline als Event-driven State Machine

## Status: Accepted
## Datum: 2026-03-04

## Kontext

Die Lead Pipeline verarbeitet Locations und Businesses durch mehrere Schritte:
Scraping → Import → Qualifizierung → Enrichment → Export.
Es braucht eine Architektur die fehlertolerant, beobachtbar und erweiterbar ist.

## Entscheidung

Jede Entitaet (Location, Business) hat einen `pipeline_stage` als PostgreSQL ENUM.
Workflows (n8n) laufen unabhaengig auf Cron-Schedules und verarbeiten Items basierend auf
ihrem aktuellen Stage. Die Datenbank ist die Single Source of Truth.

## Begruendung

- **Fehlertoleranz:** Ein fehlerhafter Workflow bricht nicht die gesamte Kette.
  Jeder Workflow kann unabhaengig neugestartet werden.
- **Beobachtbarkeit:** Dashboard kann den Status jedes Items anzeigen.
  Pipeline-Overview zeigt Verteilung ueber alle Stages.
- **Idempotenz:** Workflows koennen mehrfach laufen ohne Seiteneffekte
  (sie verarbeiten nur Items im richtigen Stage).
- **Typsicherheit:** PostgreSQL ENUMs verhindern ungueltige Stage-Werte.

## Konsequenzen

+ Jeder Workflow ist unabhaengig testbar
+ Pipeline-Fortschritt ist jederzeit sichtbar
+ Neue Stages koennen per Migration hinzugefuegt werden
+ Retry-Mechanismus ueber `retry_count` und `last_error`
- Stage-Aenderungen erfordern DB-Migrationen
- Keine zentralisierte Orchestrierung (kein uebergreifendes Monitoring)
- Client-seitige Aggregation fuer Dashboard-Statistiken noetig
