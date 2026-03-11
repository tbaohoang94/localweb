# Stufe 1 Skalierung — Test-Ergebnisse

**Datum:** 2026-03-04
**Durchgefuehrt von:** Claude Code

---

## Aenderungen (Stufe 1 Skalierung)

| Aenderung | Vorher | Nachher | Begruendung |
|-----------|--------|---------|-------------|
| WF 02 `Get Scraped Locations` limit | 5 | 15 | 3x Durchsatz beim Import |
| WF 04a `Calculate Slots` MAX_IN_FLIGHT | 50 | 80 | Mehr parallele Enrichment-Worker |
| Docker Runner `MAX_CONCURRENCY` | 5 | 10 | Mehr parallele Code-Node-Ausfuehrungen |
| Supabase Views | SECURITY DEFINER | SECURITY INVOKER | Security Advisory Fix |

---

## Phase 4 — n8n Workflow Error & Timeout Tests

### 4.1 Test-Infrastruktur

| Pruefpunkt | Ergebnis |
|------------|----------|
| Error-Workflow auf allen WFs konfiguriert | OK — alle 7 WFs verweisen auf `75nGTzEeTlBQmlys` |
| executionTimeout auf allen WFs gesetzt | OK — 120s bis 600s je nach WF |
| maxConcurrencyLevel auf Dispatching-WFs | OK — WF 01, 01b, 02, 03, 04a, 05 alle auf `1` |
| WF 04b (Worker) ohne maxConcurrency | OK — korrekt, Worker muessen parallel laufen |

### 4.2 Error-Handling

| Test | Ergebnis | Details |
|------|----------|---------|
| failed_enrich mit retry_count | OK | Businesses haben `retry_count: 1` und kontextbezogene `last_error` Messages |
| Error Messages enthalten URL + Grund | OK | z.B. "URL: loudcinematography.com \| Error: TLS disconnected" |
| Error-Workflow feuert bei Fehlern | OK | Letzte Execution: 15784 (13:25 Uhr), laeuft korrekt |

### 4.3 Timeout Tests

| Test | Ergebnis | Details |
|------|----------|---------|
| WF 04b HTTP Timeouts | OK | Fetch Website: 15s, Fetch Impressum: 15s, OpenAI: 30s |
| WF 04b executionTimeout | OK | 120s — Worker bricht nach 2 Min ab |
| WF 02 executionTimeout | OK | 600s konfiguriert |
| WF 04a executionTimeout | OK | 300s konfiguriert |

### 4.4 Idempotenz & Datenintegritaet

| Test | Ergebnis | Details |
|------|----------|---------|
| Upsert auf place_id | OK | `on_conflict=place_id` + `resolution=merge-duplicates` |
| Keine stuck "enriching" Records | OK | 0 Businesses auf `enriching` hängend |
| Keine stuck "scraping" Locations | OK | 0 Locations auf `scraping` hängend |

### 4.5 Container-Stabilitaet

| Test | Ergebnis | Details |
|------|----------|---------|
| Docker Restart Policy | OK | `unless-stopped` auf n8n + Runner |
| Memory Limits | WARNUNG | Kein Memory Limit gesetzt (unbegrenzt) |
| Runner-Restart Recovery | OK | Runner nach Restart sofort verbunden, naechste Execution erfolgreich |
| Execution Pruning | WARNUNG | Nicht konfiguriert — Disk kann unbegrenzt wachsen |

---

## Phase 5 — Load & Stress Tests

### Execution-Performance nach Skalierung

| Workflow | Dauer (typisch) | Status | Details |
|----------|-----------------|--------|---------|
| WF 02 (15 Locations) | ~41s | OK | Vorher ~22s mit 5 Locations (linear skaliert) |
| WF 04a (Dispatcher) | ~7.5s | OK | Schnell, kein Bottleneck |
| WF 04b (Worker) | 6-18s | OK | 10 parallele Worker, alle success |
| WF 04b Erfolgsrate | 100% | OK | Letzte 50 Executions: 50/50 success |

### Resource-Verbrauch

| Container | CPU (idle) | CPU (peak) | Memory | Bewertung |
|-----------|-----------|-----------|--------|-----------|
| n8n | 4.25% | 94.4% (kurzer Burst) | 418 MiB | OK, Bursts normal |
| n8n-runner | 0.6% | ~1% | 104 MiB | OK, niedrig |
| postgres | 2.8% | ~5% | 128 MiB | OK |

### Aktuelle Pipeline-Counts

| Stage | Locations | Businesses |
|-------|-----------|------------|
| imported | 102 | — |
| failed_scrape | 1 | — |
| qualified | — | 3 |
| unqualified | — | 4.013 |
| enriched | — | 186 |
| failed_enrich | — | 347 |
| exported | — | 2.830 |

---

## Phase 6 — Chaos & Resilience Tests

| Test | Ergebnis | Details |
|------|----------|---------|
| Runner-Restart waehrend Betrieb | OK | Runner reconnected in <3s, naechste Execution erfolgreich |
| Keine running Executions nach Restart | OK | 0 Zombie-Executions |
| Daten-Konsistenz nach Restart | OK | Keine stuck Records |

---

## Supabase Security Advisors

| Issue | Schwere | Fix |
|-------|---------|-----|
| Views mit SECURITY DEFINER | ERROR | Gefixt: Beide Views auf SECURITY INVOKER umgestellt |
| locations RLS zu permissiv (DELETE/INSERT) | WARN | Offen — fuer internes Tool akzeptabel |
| Leaked Password Protection | WARN | Offen — Auth nicht im Einsatz fuer diese Pipeline |

---

## Offene Punkte / Empfehlungen

1. **Docker Memory Limits setzen** — `mem_limit: 1g` fuer n8n, `mem_limit: 512m` fuer Runner
2. **Execution Pruning aktivieren** — `EXECUTIONS_DATA_PRUNE=true`, `EXECUTIONS_DATA_MAX_AGE=168` (7 Tage)
3. **Stufe 2 bei Bedarf**: DB-Indizes, Bulk-Operations, Materialized Views
4. **Stufe 3 bei >100k Records**: Edge Functions als Worker
