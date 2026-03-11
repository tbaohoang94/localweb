# Skalierungsgrenzen — Google Maps Lead Pipeline

> Template — wird nach Load Tests mit realen Werten befuellt.
> Ausfuehrung: `k6 run tests/load/api-routes.js` + `k6 run tests/load/supabase-queries.js`

---

## Gemessene Grenzen (Staging, Datum: _____)

### Next.js API (Vercel)

| Metrik | Wert |
|--------|------|
| Normale Last (20 VUs) | p95: ___ms |
| Spitzenlast (100 VUs) | p95: ___ms |
| Stress (200 VUs) | p95: ___ms |
| Grenze: p95 > 1s ab | ___ VUs |
| Bottleneck | [ ] Supabase Connections / [ ] Vercel Function Limits / [ ] _____ |

### Supabase

| Metrik | Wert |
|--------|------|
| Max gleichzeitige Connections | ___ |
| Read Latenz (p95, 30 VUs) | ___ms |
| Write Latenz (p95, 15 VUs) | ___ms |
| View Query Latenz (p95) | ___ms |
| Dashboard-Query bei ~7k Businesses | ___ms |
| Bottleneck | [ ] Connection Pool / [ ] Query Performance / [ ] _____ |

### n8n

| Metrik | Wert |
|--------|------|
| Max Webhook Events/Minute ohne Verlust | ___ |
| Burst-Kapazitaet (gleichzeitig) | ___ |
| Avg Webhook-Latenz | ___ms |
| Max Webhook-Latenz | ___ms |
| Memory-Grenze (OOM) | ___MB |
| Concurrency Limit (aktuell) | 40 |
| Bottleneck | [ ] Memory / [ ] CPU / [ ] Supabase Writes / [ ] _____ |

### Apify

| Metrik | Wert |
|--------|------|
| Rate Limit | ___ Requests/Minute |
| Batch-Size (aktuell) | 8 Locations |
| Scrape-Dauer pro Location | ~___min |

---

## Empfehlungen

- [ ] Bei > ___ Businesses: Index auf [Spalte] hinzufuegen
- [ ] Bei > ___ gleichzeitigen Usern: Supabase Connection Pool erhoehen
- [ ] Bei > ___ Webhook Events/min: n8n Worker-Mode aktivieren
- [ ] Bei > ___ Locations gesamt: Pagination in WF 01 einbauen
- [ ] Bei > ___ system_logs Eintraegen: Log-Retention automatisieren
