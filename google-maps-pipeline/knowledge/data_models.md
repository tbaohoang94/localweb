# Datenmodell — Google Maps Lead Pipeline

> Alle Entitaeten, Felder und Beziehungen.
> Das SQL-Schema liegt in `supabase/migrations/`.

---

## locations

Jede Location ist eine Kombination aus Stadt + Suchbegriff. UNIQUE(country, city, query).

| Spalte | Typ | Beschreibung |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| country | text NOT NULL | Land (z.B. "Deutschland") |
| city | text NOT NULL | Stadt (z.B. "Passau") |
| query | text NOT NULL | Suchbegriff (z.B. "Geigenbauer") |
| latitude | numeric | Breitengrad (optional) |
| longitude | numeric | Laengengrad (optional) |
| created_at | timestamptz | Erstellungszeitpunkt |
| apify_run_id | text | Apify Actor Run ID |
| scraped_at | timestamptz | Wann Scrape gestartet wurde (WF 01) |
| scrape_finished_at | timestamptz | Wann Scrape abgeschlossen (WF 01b/02) |
| scrape_total_results | integer | Anzahl gefundener Businesses (WF 02) |
| **pipeline_stage** | location_pipeline_stage | Zentraler Status (ENUM) |
| retry_count | integer DEFAULT 0 | Anzahl Retry-Versuche |
| last_error | text | Letzte Fehlermeldung |

### location_pipeline_stage ENUM

| Wert | Bedeutung | Gesetzt von |
|---|---|---|
| `new` | Bereit zum Scrapen | Frontend / manuell |
| `scraping` | Apify Run laeuft | WF 01 |
| `scraped` | Apify fertig, Import steht aus | WF 01b |
| `imported` | Businesses importiert | WF 02 |
| `failed_scrape` | Scraping fehlgeschlagen | WF 01b / WF 02 |

---

## businesses

Jeder Business-Eintrag ist ein Google Maps Ergebnis. UNIQUE(place_id).

| Spalte | Typ | Beschreibung |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| place_id | text UNIQUE NOT NULL | Google Place ID (Dedup-Key) |
| name | text NOT NULL | Firmenname |
| category | text | Google-Kategorie |
| address | text | Vollstaendige Adresse |
| city | text | Stadt |
| postal_code | text | PLZ |
| country | text | Land |
| phone | text | Telefonnummer (formatiert) |
| website | text | Website-URL (normalisiert auf Domain) |
| rating | numeric | Google-Bewertung (1-5) |
| reviews_count | integer | Anzahl Bewertungen |
| latitude / longitude | numeric | Koordinaten |
| claimed | boolean | Google-Profil beansprucht? |
| permanently_closed | boolean | Dauerhaft geschlossen? |
| created_at / updated_at | timestamptz | Zeitstempel |
| neighborhood | text | Stadtviertel |
| street | text | Strasse |
| phone_unformatted | text | Telefon (roh, ohne Formatierung) |
| fid | text | Google FID |
| cid | text | Google CID |
| images_count | integer | Anzahl Google-Fotos |
| opening_hours | jsonb | Oeffnungszeiten |
| google_maps_url | text | Google Maps Link |
| search_string | text | Suchbegriff der zum Fund fuehrte |
| rank | integer | Position in Google Maps |
| website_summary | text | AI-generierte Website-Zusammenfassung (WF 04b) |
| enriched_at | timestamptz | Enrichment-Zeitpunkt (WF 04b) |
| im_contact_name | text | Kontaktname aus Impressum (WF 04b) |
| im_email | text | Email aus Impressum (WF 04b) |
| im_tel | text | Telefon aus Impressum (WF 04b) |
| qualification_reason | text | OpenAI-Begruendung (WF 03) |
| qualified_at | timestamptz | Qualifizierungs-Zeitpunkt (WF 03) |
| **pipeline_stage** | business_pipeline_stage | Zentraler Status (ENUM) |
| retry_count | integer DEFAULT 0 | Anzahl Retry-Versuche |
| last_error | text | Letzte Fehlermeldung |

### business_pipeline_stage ENUM

| Wert | Bedeutung | Gesetzt von |
|---|---|---|
| `new` | Frisch importiert | WF 02 |
| `qualified` | Kategorie passt | WF 03 |
| `unqualified` | Kategorie passt nicht (Endstatus) | WF 03 |
| `enriching` | Website wird gescraped | WF 04a |
| `enriched` | Kontaktdaten extrahiert | WF 04b |
| `failed_enrich` | Enrichment fehlgeschlagen | WF 04b |
| `exported` | CSV exportiert (Endstatus) | WF 05 |

---

## Weitere Tabellen

### cities
Statische Liste der Staedte (wird nicht von der Pipeline geschrieben).

### pipeline_runs (Monitoring)
Optionale Tabelle fuer Workflow-Ausfuehrungen.

### workflow_logs
Error-Logs von WF 07 (Error Logger).

### custom_fields
Close.io Custom Field Mappings (ausserhalb Scope).

---

## View: search_query_stats

Aggregierte Statistiken pro Suchbegriff:

```sql
SELECT search_string, count(*) AS total,
  count(*) FILTER (WHERE pipeline_stage != 'unqualified') AS qualified,
  count(*) FILTER (WHERE pipeline_stage = 'unqualified') AS wrong_category,
  count(*) FILTER (WHERE phone IS NULL AND im_tel IS NULL) AS no_phone,
  count(*) FILTER (WHERE website IS NULL) AS no_website,
  count(*) FILTER (WHERE im_contact_name IS NULL) AS no_contact,
  count(*) FILTER (WHERE pipeline_stage IN ('enriched','qualified')
    AND (im_tel IS NOT NULL OR phone IS NOT NULL)) AS exportable
FROM businesses GROUP BY search_string ORDER BY count(*) DESC;
```

## Deduplizierung

- Businesses: UPSERT per `place_id` (`on_conflict=place_id`, `resolution=merge-duplicates`)
- Locations: UNIQUE(country, city, query)
