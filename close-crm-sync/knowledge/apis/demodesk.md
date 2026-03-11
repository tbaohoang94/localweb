# Demodesk API Reference

## Allgemein

| Eigenschaft | Wert |
|---|---|
| **Base URL** | `https://demodesk.com/api/v1` |
| **Auth** | Header: `api-key: <API_KEY>` |
| **Format** | JSON (Standard), text/plain (Transkripte) |
| **Pagination** | `page` Parameter (ab 1), `meta.hasNextPage` prüfen |
| **Rate Limits** | Nicht dokumentiert — konservativ: 1s Pause zwischen Requests |

## API Key Typen

| Typ | Zweck |
|---|---|
| `MASTER_3RD_PARTY_API_KEY` | Partner-Key für Account-Erstellung |
| `COMPANY_ADMIN_USER_API_KEY` | **Hauptkey pro Firma** (wird für Sync verwendet) |
| `USER_API_KEY` | Individueller User-Key |

## Response-Format

```json
{
  "data": { ... },
  "status": "ok",
  "meta": {
    "hasNextPage": true
  }
}
```

Fehler enthalten ein `detail`-Feld mit HTTP-Statuscode.

---

## Endpoints

### 1. Demos (Meetings) auflisten

```
GET /demos
```

**Header:**
- `api-key: <API_KEY>`
- `Accept: application/json`

**Filter-Parameter:**

| Parameter | Wert | Beschreibung |
|---|---|---|
| `filter[schedule_eq]` | `past` / `upcoming` | Vergangene oder zukünftige Meetings |
| `filter[recordings_present]` | `true` / `false` | Nur Meetings mit Aufnahmen |
| `filter[all_team_members_dashboard]` | `true` / `false` | Alle Teammitglieder |
| `filter[account_i_cont]` | String | Meeting-Name (Suche) |
| `filter[start_date_gteq]` | ISO-Datum | Startdatum ab |
| `filter[start_date_lteq]` | ISO-Datum | Startdatum bis |
| `filter[template_name_i_cont]` | String | Meeting-Typ (Suche) |
| `page` | Integer (ab 1) | Seite |

**Response-Struktur:**

```json
{
  "data": [
    {
      "id": "12345",
      "type": "demos",
      "attributes": {
        "account": "Firmenname",
        "start_date": "2024-12-20T10:00:00.000Z",
        "duration": 1800,
        ...
      },
      "relationships": {
        "recordings": {
          "data": [
            { "id": "rec_123", "type": "recordings" }
          ]
        }
      }
    }
  ],
  "included": [
    {
      "id": "rec_123",
      "type": "recordings",
      "attributes": {
        "token": "c5cebae524c202ba",
        "createdAt": "2024-12-20T07:07:59.312Z",
        "status": "ready",
        "url": "https://...",
        "customerUrl": "https://demodesk.com/recordings/c5cebae524c202ba",
        "audioOnly": false
      }
    }
  ],
  "meta": { "hasNextPage": true }
}
```

**Pagination:** Seitengröße ist 25 Demos pro Seite. `meta.hasNextPage` prüfen, dann `page` inkrementieren.

**n8n Verwendung:**
```
URL: https://demodesk.com/api/v1/demos?filter[schedule_eq]=past&filter[recordings_present]=true&page={{ $json.page }}
Header: api-key = {{ $env.DEMODESK_API_KEY }}
```

---

### 2. Recording-Details abrufen

```
GET /recordings/<token>
```

**Header:**
- `api-key: <API_KEY>`
- `Accept: application/json`

**Response:**

```json
{
  "data": {
    "id": "rec_123",
    "type": "recordings",
    "attributes": {
      "createdAt": "2024-12-20T07:07:59.312Z",
      "status": "ready",
      "url": "https://...(temporäre Video-URL)...",
      "customerUrl": "https://demodesk.com/recordings/c5cebae524c202ba",
      "token": "c5cebae524c202ba",
      "audioOnly": false
    },
    "relationships": {
      "demo": {
        "data": { "id": "12345", "type": "demos" }
      }
    }
  },
  "status": "ok"
}
```

**Wichtige Felder:**
- `url` — Direkte Video-URL (kann temporär sein!)
- `customerUrl` — Permanenter Link zur Aufnahme im Demodesk-Frontend
- `status` — "ready" = Aufnahme verfügbar
- `audioOnly` — true = nur Audio, kein Video
- `token` — Eindeutige ID der Aufnahme

---

### 3. Transkript abrufen

```
GET /recordings/<token>/transcript
```

**Header:**
- `api-key: <API_KEY>`
- `Accept: text/plain`

**Response:** Plain Text (kein JSON)

Gibt den vollständigen Transkript-Text zurück.

**n8n Konfiguration:**
```
Response Format: text
Accept Header: text/plain
```

---

### 4. Meeting erstellen

```
POST /scheduled_demos
```

(Nicht relevant für Recording-Sync, nur der Vollständigkeit halber dokumentiert.)

---

### 5. Meeting-Details abrufen

```
GET /scheduled_demos/<token>
```

---

## Webhooks

### Verfügbare Events

| Event | Beschreibung | Wann |
|---|---|---|
| `demo.scheduled` | Meeting geplant | Nach Buchung |
| `demo.rescheduled` | Meeting verschoben | Nach Änderung |
| `demo.handovered` | Meeting übergeben | Nach Handover |
| `demo.canceled` | Meeting abgesagt | Nach Stornierung |
| `demo.started` | Meeting gestartet | Bei Start |
| `demo.ended` | Meeting beendet | Bei Ende |
| `recording.uploaded` | Aufnahme hochgeladen | Nach Upload |
| **`recording.transcription_postprocessed`** | **Transkript fertig** | **Nach AI-Verarbeitung** |

### Webhook aktivieren

Kontakt: **support@demodesk.com** — Webhook-URL und gewünschte Events mitteilen.

### Payload: `recording.uploaded`

```json
{
  "attributes": {
    "demoId": 12345,
    "token": "c5cebae524c202ba",
    "url": "https://demodesk.com/recordings/...",
    "temporaryVideoUrl": "https://...(blob-url)...",
    "hostId": 71587,
    "hostEmail": "alex@demodesk.com"
  }
}
```

### Payload: `recording.transcription_postprocessed`

Enthält alle Felder von `recording.uploaded` **plus:**

```json
{
  "attributes": {
    "demoId": 12345,
    "token": "c5cebae524c202ba",
    "url": "https://demodesk.com/recordings/...",
    "temporaryVideoUrl": "https://...",
    "hostId": 71587,
    "hostEmail": "alex@demodesk.com",
    "primaryAiSummaryPlaintext": "...",
    "primaryAiSummaryHtml": "...",
    "latestAiSummaryPlaintext": "...",
    "latestAiSummaryHtml": "..."
  }
}
```

**Für den Sync relevant:** `recording.transcription_postprocessed` — enthält alles (Video + Transkript + AI-Summary).

---

## n8n Integration

### Credential-Konfiguration

- **Kein n8n-Node vorhanden** — HTTP Request verwenden
- Auth über Header: `api-key: {{ $env.DEMODESK_API_KEY }}`
- Environment Variable: `DEMODESK_API_KEY`

### Bekannte Eigenheiten

1. Recording-Tokens ≠ Demo-Tokens — unterschiedliche Identifier
2. `included` Array im `/demos` Response enthält Recording-Objekte (JSON:API Format)
3. Transkript-Endpoint gibt Plain Text zurück, kein JSON
4. Video-URLs (`url` Feld) können temporär sein — für permanente Speicherung: Google Drive Upload
5. `customerUrl` ist der permanente Demodesk-Frontend-Link
6. Seitengröße bei `/demos` ist 25 Einträge
