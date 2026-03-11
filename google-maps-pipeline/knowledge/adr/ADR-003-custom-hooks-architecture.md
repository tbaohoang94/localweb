# ADR-003: Custom Hooks als Data Access Layer

## Status: Accepted
## Datum: 2026-03-04

## Kontext

Die code-quality-prompt.md fordert eine Layered Architecture
(Controller → Service → Repository). Dieses Projekt hat jedoch keine API Routes —
alle Daten werden client-seitig ueber den Supabase Browser Client abgefragt.

## Entscheidung

Custom Hooks (`lib/hooks/`) bilden die Data Access Schicht.
Komponenten rufen Hooks auf, nie direkt Supabase.

```
components/        → UI Layer (Rendering, User Interaction)
lib/hooks/         → Data Access Layer (Supabase Queries, Mutations)
lib/pipeline-stages.ts → Domain Constants
lib/format.ts      → Utility Functions
```

## Begruendung

- **Separation of Concerns:** Datenlogik ist von UI-Logik getrennt.
- **Testbarkeit:** Hooks koennten einzeln getestet werden (mit Mock-Supabase).
- **Konsistenz:** Einheitliches Loading/Error-Pattern ueber alle Datentabellen.
- **Proportional:** Eine vollstaendige Repository/Service-Schicht waere Overengineering
  fuer ein ~2700 LOC Dashboard ohne serverseitige Business-Logik.

## Konsequenzen

+ Komponenten sind schlank und fokussiert auf Rendering
+ Supabase-Queries sind zentralisiert und wiederverwendbar
+ Einheitliches Error-Handling Pattern
- Hooks sind 1:1 an Komponenten gebunden (keine Wiederverwendung zwischen Seiten)
- Bei wachsender Komplexitaet muesste eine Service-Schicht eingefuegt werden
