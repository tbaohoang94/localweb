# Business Rules — Google Maps Lead Pipeline

> Fachliche Regeln die im Code abgebildet sein muessen.

---

## Pipeline-Status Uebergaenge

### Locations

```
new → scraping → scraped → imported
                    ↓
               failed_scrape (retry_count < 3 → new)
```

### Businesses

```
new → qualified ──→ enriching → enriched ──→ exported
  ↓                    ↓
unqualified       failed_enrich (retry_count < 3 → qualified)
```

- Nur Items im erwarteten Status werden verarbeitet
- Status wird atomar per PATCH gesetzt
- `unqualified` und `exported` sind Endstatus

---

## Qualifizierung (WF 03)

- Prueft ob die Google-Kategorie zum Suchbegriff passt
- Verarbeitet pro (keyword, category) Paar — nicht pro Business
- Alle Businesses mit derselben Kombination werden gleichzeitig qualifiziert/disqualifiziert
- OpenAI GPT-4o-mini entscheidet: "Passt die Kategorie zum Suchbegriff?"
- qualification_reason wird als Begruendung gespeichert
- `unqualified` ist ein Endstatus — kein Retry

## Enrichment (WF 04a/04b)

- Nur Businesses mit `website IS NOT NULL` werden enriched
- WF 04a markiert Batch als `enriching`, feuert WF 04b pro Item
- WF 04b: Puppeteer scraped Website → OpenAI extrahiert Kontaktdaten
- Stuck-Detection: Items >30min in `enriching` → `failed_enrich`
- Extrahierte Felder: website_summary, im_contact_name, im_email, im_tel

## CSV Export (WF 05)

- Exportiert nur: pipeline_stage = 'enriched' UND (im_tel OR phone IS NOT NULL)
- Email an NOTIFICATION_EMAIL (bao.hoang@localweb.de)
- Nach Export: pipeline_stage → 'exported'

## Deduplizierung

- Businesses per `place_id` — UPSERT mit merge-duplicates
- Innerhalb Dataset: Filter auf placeId vorhanden + nicht permanently_closed
- Duplicate placeIds per Map dedupliziert

## Website-Normalisierung (WF 02)

- URL auf Domain reduziert: `https://example.com/path` → `https://example.com`
- Kein Protokoll? → `https://` vorangestellt
- Leere/ungueltige URLs → null

## Email-Validierung (WF 04b)

- Regex: `/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/`
- Ungueltige Emails → null

## Retry-Regeln

| Kontext | Max | Wartezeit | Zurueck zu |
|---|---|---|---|
| failed_scrape | 3 | 1h | new |
| failed_enrich | 3 | 30min | qualified |
| HTTP-Fehler (n8n) | 3 | 3-5s | automatisch |
