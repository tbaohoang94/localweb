# Dependencies — Google Maps Lead Pipeline Frontend

> Dokumentation aller externen Abhaengigkeiten mit Begruendung.

---

## Runtime Dependencies

| Package | Version | Zweck | Alternative |
|---|---|---|---|
| next | 14.2.x | App Router Framework, SSR, Routing | — |
| react / react-dom | ^18 | UI Library | — |
| @supabase/ssr | ^0.8 | Supabase Client fuer Next.js (Cookie-basierte Auth) | @supabase/auth-helpers-nextjs (deprecated) |
| @supabase/supabase-js | ^2.78 | Supabase JS Client (Peer Dependency) | — |
| @radix-ui/react-slot | ^1.2 | Polymorphe Komponenten (shadcn/ui Button) | — |
| @radix-ui/react-tooltip | ^1.2 | Accessible Tooltips (shadcn/ui) | — |
| class-variance-authority | ^0.7 | Variant-basierte CSS Klassen (shadcn/ui) | — |
| clsx | ^2.1 | Conditional CSS Klassen | classnames |
| tailwind-merge | ^3.5 | Tailwind Klassen intelligent mergen | — |
| tailwindcss-animate | ^1.0 | Animationen fuer Tailwind (shadcn/ui) | — |
| lucide-react | ^0.576 | Icon Library (Tree-shakeable) | heroicons, react-icons |
| papaparse | ^5.5 | CSV Parsing (Client-seitig) | csv-parse (Node-only) |
| @vercel/analytics | ^1.6 | Vercel Web Analytics | — |
| @vercel/speed-insights | ^1.3 | Vercel Performance Monitoring | — |

## Dev Dependencies

| Package | Version | Zweck |
|---|---|---|
| typescript | ^5 | TypeScript Compiler |
| eslint + eslint-config-next | ^8 / 14.2.x | Linting (Next.js Regeln) |
| prettier | ^3.8 | Code-Formatierung |
| husky | ^9.1 | Git Hooks (Pre-Commit) |
| lint-staged | ^15.5 | Lint nur geaenderte Dateien |
| tailwindcss | ^3.4 | CSS Framework |
| postcss | ^8 | CSS Processing |
| @types/* | ^18-20 | TypeScript Type Definitions |

## Bekannte Limitierungen

- **PapaParse:** Kein Streaming fuer sehr grosse CSVs im Browser. Fuer Dateien > 50MB
  muesste serverseitiges Parsing implementiert werden.
- **Supabase SSR:** Cookies werden in Server Components nicht gesetzt (nur gelesen).
  Writes muessen ueber Middleware oder Route Handlers laufen.

## Upgrade-Strategie

- **Next.js:** Auf 14.x LTS bleiben. Upgrade auf 15.x erst wenn stabil und
  @supabase/ssr kompatibel.
- **Supabase:** Minor-Updates zeitnah uebernehmen. Major-Updates nach Changelog pruefen.
- **shadcn/ui Deps:** (Radix, CVA, clsx, tailwind-merge) sind stabil. Updates bei Bedarf.
