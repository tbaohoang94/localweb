# Resilience Report — Google Maps Lead Pipeline

> Template — wird nach Chaos Tests mit realen Ergebnissen befuellt.
> Ausfuehrung: `npx tsx tests/resilience/chaos-tests.ts`

---

## Resilience-Matrix

| Szenario | Verhalten | Datenverlust | Auto-Recovery | Aktion noetig |
|----------|-----------|-------------|---------------|---------------|
| Supabase nicht erreichbar | Health 503, Dashboard Error | Nein (Writes gequeued in n8n) | Teilweise | Pipeline-Stage pruefen |
| n8n Container Crash | Laufende Executions verloren | Moeglich (in-flight Items) | Docker Restart | Pipeline Integrity Check (WF 11) |
| Vercel Deployment kaputt | Dashboard nicht erreichbar | Nein (Daten in Supabase) | Rollback via Vercel | Vorheriges Deployment promoten |
| Doppelter Webhook | Idempotent via place_id UNIQUE | Nein | N/A | Keine |
| Race Condition (2 Updates) | Last-Write-Wins | Nein (aber unvorhersagbar) | N/A | Monitoring |
| Ungueltiger ENUM-Wert | PostgreSQL rejected | Nein | N/A | Keine |
| XSS in Business-Name | Wird gespeichert, React escaped | Nein | N/A | Keine |
| Apify Rate Limit | WF 01 fehlschlag, Retry | Nein | WF 07 Alert + Retry | Abwarten / Batch verkleinern |
| n8n Memory Exhaustion | OOM Kill | Moeglich | Docker Restart | RAM erhoehen / Concurrency senken |
| Disk voll (Hetzner) | n8n stoppt | Nein (Daten in Supabase) | Nein | Manuell aufraeumen |

## Bekannte Schwachstellen

1. **Keine Webhook-Queue**: Webhook-Events waehrend n8n-Downtime gehen verloren. n8n hat kein eingebautes Event-Queuing.
2. **Last-Write-Wins bei Race Conditions**: Kein optimistic locking implementiert. Bei gleichzeitigen Updates gewinnt der letzte.
3. **Kein Circuit Breaker**: Wenn Apify/OpenAI dauerhaft ausfallen, retried n8n endlos (bis max_retries in WF-Logik).
4. **Memory-Limit**: n8n Task Runner hat 2GB — bei vielen parallelen Puppeteer-Sessions (WF 04b) kann OOM auftreten.

## Empfehlungen

- [ ] Docker Memory Limit explizit setzen (`deploy.resources.limits.memory: 3g`)
- [ ] Log-Rotation fuer Docker-Container konfigurieren (`max-size: 50m, max-file: 3`)
- [ ] Monitoring: Disk Usage Alert bei > 80% (WF 08 erweitern)
- [ ] Staging-Umgebung fuer destruktive Chaos-Tests aufsetzen
