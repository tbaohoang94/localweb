# Close API Reference

## Auth

```
Authorization: Basic base64(API_KEY + ":")
```

- API Key = Username, Password = leer
- Base64 **einmal** vorab kodieren, als statischen String in n8n nutzen
- Aktueller Wert: `Basic YXBpXzJKd0JqaHMwYmZCUmJ5d3dHeXA0blUuMWlWV0NZVUUyRzE3NWh6NjJmNEJMRzo=`
- NICHT via n8n Credentials oder Runtime-Expressions

## Rate Limits

| Scope | Limit |
|---|---|
| Pro API Key | ~20 RPS (variiert je Endpoint-Gruppe) |
| Pro Organisation | 3x Key-Limit (~60 RPS) |
| Algorithmus | Token Bucket (Burst erlaubt) |

**Response Headers:**
```
RateLimit: limit=100, remaining=50, reset=5
```

**Bei 429:** `retry-after` Header auslesen, `rate_reset` Sekunden warten.

---

## POST /api/v1/data/search/

Erweiterte Suche über alle Objekttypen. **Wichtigster Endpoint für Bulk-Extraktion.**

### Pagination: Cursor-basiert

| Eigenschaft | Wert |
|---|---|
| Methode | Cursor (im Response-Body) |
| Hard Limit | **10.000 Ergebnisse** pro Query |
| Cursor Expiry | **30 Sekunden** |
| Ende-Signal | `cursor: null` |
| Strategie >10k | Date-Window-Shift (siehe unten) |

### Request Body

```json
{
  "query": { "type": "and", "queries": [...] },
  "_fields": { "lead": ["id", "display_name", "date_created"] },
  "_limit": 200,
  "cursor": "string_or_null",
  "sort": [{ "direction": "desc", "field": { "field_name": "date_created", "object_type": "lead", "type": "regular_field" } }],
  "include_counts": true
}
```

### Query-Syntax

**WICHTIG:** Immer `object_type` Query als ersten Filter:
```json
{ "type": "object_type", "object_type": "lead" }
```

**Datum-Filter (zwei Formate):**

Format 1 — `gte`/`lt` mit ISO-Datetime (empfohlen für n8n Code Nodes):
```json
{
  "type": "moment_range",
  "gte": "2026-02-18T00:00:00.000Z",
  "lt": "2026-02-19T00:00:00.000Z"
}
```

Format 2 — `fixed_local_date` (benötigt `which: "start"`):
```json
{
  "type": "moment_range",
  "on_or_after": { "type": "fixed_local_date", "value": "2026-02-18", "which": "start" },
  "before": { "type": "fixed_local_date", "value": "2026-02-19", "which": "start" }
}
```

**Komplettes Beispiel (Leads eines Tages):**
```json
{
  "query": {
    "type": "and",
    "queries": [
      { "type": "object_type", "object_type": "lead" },
      {
        "type": "field_condition",
        "field": { "type": "regular_field", "object_type": "lead", "field_name": "date_created" },
        "condition": { "type": "moment_range", "gte": "2026-02-18T00:00:00.000Z", "lt": "2026-02-19T00:00:00.000Z" }
      }
    ]
  },
  "_fields": { "lead": ["id", "display_name", "date_created", "status_label"] },
  "_limit": 200,
  "include_counts": true,
  "sort": [{ "direction": "desc", "field": { "field_name": "date_created", "object_type": "lead", "type": "regular_field" } }]
}
```

### Response

```json
{
  "data": [{ "id": "lead_xxx", "display_name": "...", "date_created": "..." }],
  "cursor": "string_or_null",
  "count": { "limited": 200, "total": 4523 }
}
```

### Date-Window-Shift Strategie (>10k Ergebnisse)

Bei 200/page → max 50 Pages → Safety-Grenze bei 48 Pages:

1. Paginieren bis Page 48 oder `cursor: null`
2. `date_created` des letzten Datensatzes als neues `lt`/`untilExclusive`
3. Neue Suche mit verkleinertem Zeitfenster
4. Repeat bis alle Daten erfasst

**n8n Pattern:** `Build Body → HTTP Request → Check More Pages → If hasMore → Loop back to Build Body`

---

## GET /api/v1/activity/

### Pagination: Offset-basiert

| Eigenschaft | Wert |
|---|---|
| Methode | `_skip` + `_limit` |
| Ende-Signal | `has_more: false` |
| Max _limit/_skip | Nicht dokumentiert (400 bei Überschreitung) |
| Strategie für Deep Pagination | Date-Range-Filter |

### Parameter

| Parameter | Typ | Hinweis |
|---|---|---|
| `lead_id` | string | Viele Filter benötigen diesen |
| `user_id` | string | Nur mit `lead_id` |
| `user_id__in` | string | Nur mit `lead_id` |
| `contact_id` | string | Nur mit `lead_id` |
| `contact_id__in` | string | Nur mit `lead_id` |
| `_type` | string | Nur mit `lead_id` |
| `_type__in` | string | Nur mit `lead_id` |
| `date_created__gt` | datetime | Created after |
| `date_created__lt` | datetime | Created before |
| `activity_at__gt` | datetime | Occurred after |
| `activity_at__lt` | datetime | Occurred before |
| `_order_by` | string | `-activity_at` nur mit `lead_id` |
| `_fields` | string | Komma-separiert |
| `_limit` | integer | Max pro Page |
| `_skip` | integer | Offset |

### Activity Types

`Call`, `Email`, `EmailThread`, `Note`, `Meeting`, `LeadStatusChange`, `OpportunityStatusChange`, `SMS`, `TaskCompleted`, `LeadMerge`, `WhatsAppMessage`, `FormSubmission`, `Created`, `Custom`

### Response

```json
{
  "data": [{ "id": "acti_xxx", "_type": "Call", "lead_id": "lead_xxx", "date_created": "...", "activity_at": "..." }],
  "has_more": true
}
```

---

## GET /api/v1/opportunity/

### Pagination: Offset-basiert

| Eigenschaft | Wert |
|---|---|
| Methode | `_skip` + `_limit` |
| Ende-Signal | `has_more: false` |
| Total Count | `total_results` im Response |
| Aggregate Values | `total_value_*`, `expected_value_*` über ALLE Matches (nicht nur Page) |

### Parameter

| Parameter | Typ | Beschreibung |
|---|---|---|
| `lead_id` | string | Filter nach Lead |
| `user_id` | string | Filter nach User (supports `__in`) |
| `status_id` | string | Status ID (supports `__in`) |
| `status_label` | string | Status Name (supports `__in`) |
| `status_type` | string | `active`, `won`, `lost` (supports `__in`) |
| `value_period` | string | `one_time`, `monthly`, `annual` (supports `__in`) |
| `date_created__lt/gt/lte/gte` | datetime | Creation Date |
| `date_updated__lt/gt/lte/gte` | datetime | Update Date |
| `date_won__lt/gt/lte/gte` | datetime | Won Date |
| `query` | string | Text-Suche (z.B. `note:important`) |
| `lead_saved_search_id` | string | Smart View Filter |
| `_order_by` | string | Sort (siehe unten) |
| `_group_by` | string | Gruppierung |
| `_fields` | string | Felder |
| `_limit` | integer | Max pro Page |
| `_skip` | integer | Offset |

### Sort Options (`_order_by`)

`date_won`, `date_updated`, `date_created`, `confidence`, `user_name`, `value`, `annualized_value`, `annualized_expected_value` — Prefix `-` für descending.

### Group Options (`_group_by`)

`user_id`, `date_won__week`, `date_won__month`, `date_won__quarter`, `date_won__year`

### Response

```json
{
  "data": [{ "id": "oppo_xxx", "lead_id": "lead_xxx", "value": 5000, "status_type": "won", "date_won": "2024-03-01" }],
  "has_more": true,
  "total_results": 250,
  "total_value_one_time": 500000,
  "total_value_monthly": 25000,
  "total_value_annual": 300000,
  "total_value_annualized": 600000,
  "expected_value_annualized": 540000
}
```

---

## Vergleich

| | Search | Activity | Opportunity |
|---|---|---|---|
| **Method** | POST | GET | GET |
| **Path** | `/data/search/` | `/activity/` | `/opportunity/` |
| **Pagination** | Cursor | Offset | Offset |
| **Hard Limit** | 10.000 | _skip max (undok.) | _skip max (undok.) |
| **Cursor Expiry** | 30s | — | — |
| **Ende-Signal** | `cursor: null` | `has_more: false` | `has_more: false` |
| **Deep Pagination** | Date-Window-Shift | Date-Range-Filter | Date-Range-Filter |
| **Total Count** | `count.total` | — | `total_results` |

---

## Session Learnings

1. **`object_type` Query ist Pflicht** — ohne `{"type": "object_type", "object_type": "lead"}` gibt /data/search/ gemischte Ergebnisse zurück (tasks, notifications)
2. **Datum-Format wählen:** `gte`/`lt` mit ISO-Strings ist einfacher in Code Nodes als `fixed_local_date` mit `which`
3. **`which: "start"` ist Pflicht** bei `fixed_local_date` Format — ohne gibt Close 400 zurück
4. **48-Page-Safety:** Bei 200/page = 9.600 Ergebnisse, danach Date-Window-Shift statt Close 10k-Limit zu riskieren
5. **Upsert-Duplikate:** Beim Date-Window-Shift überlappen Randbereiche → Supabase `on_conflict` löst das
