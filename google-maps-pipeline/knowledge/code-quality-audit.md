# Code Quality Audit — 2026-03-04

> Projekt: Google Maps Lead Pipeline (Localweb)
> Stack: Next.js 14 App Router + Supabase + n8n + Tailwind/shadcn
> Letzte Aktualisierung: 2026-03-04 (nach Phase 0–6)

---

## Aktueller Stand (nach Refactoring)

### Ordnerstruktur

```
frontend/
  app/
    layout.tsx                    # Root Layout (Font, Analytics)
    page.tsx                      # Redirect: auth → /dashboard, sonst → /login
    error.tsx                     # Error Boundary
    globals.css                   # CSS-Variablen, Animationen
    login/page.tsx                # Login-Seite
    signup/page.tsx               # Signup-Seite
    dashboard/
      layout.tsx                  # Auth-Guard + Sidebar
      page.tsx                    # Dashboard (PipelineOverview + SearchOverview)
      businesses/page.tsx         # Businesses-Tabelle
      locations/page.tsx          # Locations-Tabelle
      runs/page.tsx               # Scrape-Runs-Tabelle
  components/
    ui/                           # shadcn/ui Basis (badge, button, card, tooltip)
    shared/
      status-badge.tsx            # Gemeinsame StatusBadge-Komponente
    add-location-form.tsx
    businesses-table.tsx
    csv-import-modal.tsx
    locations-table.tsx
    login-form.tsx
    logout-button.tsx
    pipeline-overview.tsx
    runs-table.tsx
    search-overview.tsx
    sidebar.tsx
    signup-form.tsx
  lib/
    hooks/                        # Custom Hooks (Data Access Layer)
      use-businesses.ts
      use-locations.ts
      use-pipeline-counts.ts
      use-runs.ts
      use-search-stats.ts
    types/
      database.types.ts           # Generierte Supabase Types
    format.ts                     # Formatierungs-Utilities
    pipeline-stages.ts            # Stage-Definitionen (Single Source of Truth)
    supabase-browser.ts           # Browser Client (mit Database Generic)
    supabase-helpers.ts           # Batch-Insert Utility
    supabase-server.ts            # Server Client (mit Database Generic)
    utils.ts                      # cn() Helper
  middleware.ts                   # Auth Middleware
  .eslintrc.json                  # ESLint strict config
  .prettierrc                     # Prettier config
```

---

## Metriken — Vorher / Nachher

| Metrik | Vorher | Nachher | Status |
|--------|--------|---------|--------|
| TypeScript Errors | 0 | 0 | OK |
| ESLint Errors | 0 | 0 | OK |
| `any` / `as any` Count | 0 (Projektcode), 0 (Generiert: 2 in supabase-helpers) | 0 + 2 (dokumentiert) | OK |
| `@ts-ignore` / `@ts-expect-error` | 0 | 0 | OK |
| `TODO` / `FIXME` Count | 0 | 0 | OK |
| Ungenutzte Komponenten | 5 (dashboard-stats, pipeline-overview, pipeline-status, search-stats-table, scrape-runs-table) | 0 | BEHOBEN |
| Dead Dependencies | 1 (next-themes) | 0 | BEHOBEN |
| Duplizierte Code-Bloecke | 6 Patterns | 0 | BEHOBEN |
| Queries ohne Error-Check | 5 | 0 | BEHOBEN |
| Queries mit `select("*")` | 5 | 0 | BEHOBEN |
| Type-Assertions (`as`) | 3 | 1 (LocationStage Cast, dokumentiert) | BEHOBEN |
| Supabase Database Types | Nicht vorhanden | Generiert und eingebunden | BEHOBEN |
| Custom Hooks | 0 | 5 | NEU |
| Props Interfaces | 0 | 3 (StageBoxProps, KpiTileProps, AddLocationFormProps) | NEU |
| Prettier konfiguriert | Nein | Ja | NEU |
| ESLint strikt | Nein | Ja (no-explicit-any, no-unused-vars, no-console) | NEU |
| Husky + lint-staged | Nein | Konfiguriert (benoetigt `git init`) | NEU |
| tsconfig strikt | Nein | Ja (noUncheckedIndexedAccess, noImplicitReturns, etc.) | NEU |
| Variablennamen konsistent | Deutsch/Englisch gemischt | Englisch (lt. CLAUDE.md) | BEHOBEN |
| ADR-Dokumentation | Nicht vorhanden | 3 ADRs | NEU |
| Dependency-Dokumentation | Nicht vorhanden | knowledge/dependencies.md | NEU |

---

## Erledigte Probleme

| # | Problem | Status |
|---|---------|--------|
| 1 | scrape-runs-table.tsx referenziert geloeschte Spalte | GELOESCHT |
| 2 | Kein Supabase Database Typing | BEHOBEN — database.types.ts generiert |
| 3 | Inkonsistentes Error-Handling | BEHOBEN — alle Hooks haben error state |
| 4 | Daten-Queries in Client Components | AKZEPTIERT — siehe ADR-001 |
| 5 | 4 ungenutzte Komponenten | GELOESCHT (3) / EINGEBUNDEN (1: PipelineOverview) |
| 6 | Code-Duplikation | BEHOBEN — StatusBadge, Stages, Format, BatchInsert zentralisiert |
| 7 | Keine Input-Validierung | OFFEN — Zod noch nicht eingefuehrt |
| 8 | `select("*")` Queries | BEHOBEN — explizite Spalten in allen Hooks |
| 9 | Sprach-Inkonsistenz | BEHOBEN — UI Deutsch, Variablen Englisch |
| 10 | Dead Dependency next-themes | ENTFERNT |
| 11 | test-debug Seite | ENTFERNT |
| 12 | Kein Prettier/Husky | BEHOBEN — konfiguriert und installiert |
| 13 | ESLint minimal | BEHOBEN — strikte Regeln aktiv |
| 14 | tsconfig nicht strikt | BEHOBEN — noUncheckedIndexedAccess etc. |

---

## Offene Punkte

| # | Thema | Prioritaet | Bemerkung |
|---|-------|-----------|-----------|
| 1 | Input-Validierung mit Zod | Mittel | Keyword- und CSV-Inputs validieren |
| 2 | Server-seitige Aggregation | Niedrig | search_query_stats View nutzen statt client-seitig |
| 3 | Pagination Locations-Tabelle | Niedrig | Skaliert aktuell nicht bei > 10.000 Eintraegen |
| 4 | Git-Repository initialisieren | Niedrig | Husky Pre-Commit-Hooks benoetigen `git init` |

---

## Durchgefuehrte Phasen

- [x] Phase 0: Codebase Audit
- [x] Phase 1: TypeScript Strictness (tsconfig, Database Types, Strict Null Checks)
- [x] Phase 2: Architecture Patterns (Custom Hooks als Data Access Layer)
- [x] Phase 3: Component Quality (Props Interfaces, Hook-Integration)
- [x] Phase 4: Code Duplication (Shared Utilities, englische Variablen)
- [x] Phase 5: Linting & Formatting (ESLint strict, Prettier, Husky + lint-staged)
- [x] Phase 6: Documentation (3 ADRs, Dependencies-Docs, Knowledge-Konsistenz)
