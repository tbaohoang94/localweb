# ADR-001: Client-seitige Datenabfragen statt API Routes

## Status: Accepted
## Datum: 2026-03-04

## Kontext

Next.js bietet Server Components und API Routes fuer serverseitige Datenverarbeitung.
Dieses Projekt nutzt jedoch ausschliesslich Client Components mit dem Supabase Browser Client
fuer alle Datenabfragen.

## Entscheidung

Alle Datenabfragen laufen ueber den Supabase Browser Client (Anon Key + RLS).
Es gibt keine API Routes (`app/api/`).

## Begruendung

- **RLS als Security Layer:** Supabase Row Level Security schuetzt die Daten auf DB-Ebene.
  Der Anon Key erlaubt nur authentifizierten Zugriff (via RLS Policies).
- **Keine Business-Logik im Frontend:** Alle komplexen Operationen (Scraping, Enrichment, Export)
  laufen in n8n-Workflows mit Service Role Key.
- **Einfachheit:** Fuer ein reines Dashboard (Read + einfache Writes) braucht es keine
  zusaetzliche API-Schicht. Das wuerde nur Boilerplate erzeugen.
- **Supabase PostgREST:** Die REST API ist bereits typsicher und performant.

## Konsequenzen

+ Weniger Code (keine API Routes, keine Fetch-Abstraktion)
+ Schnellere Entwicklung (direkt von Supabase lesen)
+ RLS garantiert Sicherheit unabhaengig vom Frontend-Code
- Server Components koennen nicht fuer initiales Laden genutzt werden
- Alle Daten werden client-seitig aggregiert (kein SSR-Caching)
- Bei wachsender Komplexitaet muessten API Routes nachgeruestet werden

## Mitigation

- Custom Hooks kapseln alle Supabase-Queries (kein direkter Supabase-Zugriff in Komponenten)
- Business-Logik und Aggregation koennten spaeter in DB Views/RPCs verschoben werden
