# DocuSeal API Reference

## Allgemein

| Eigenschaft | Wert |
|---|---|
| EU-Endpoint | `https://api.docuseal.eu` |
| US-Endpoint | `https://api.docuseal.com` |
| Auth-Header | `X-Auth-Token: <API_KEY>` |
| Env-Variable | `$env.DOCUSEAL_API_KEY` |
| Content-Type | `application/json` |

Wir nutzen den **EU-Endpoint** (`api.docuseal.eu`).

---

## Endpoints

### POST /submissions — Submission erstellen

Erstellt eine neue Signing-Anfrage fuer ein Template.

**Request Body:**

| Parameter | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `template_id` | Integer | Ja | Template-ID (z.B. 378486, 431151) |
| `send_email` | Boolean | Nein | Email an Submitter senden (default: true) |
| `send_sms` | Boolean | Nein | SMS senden (default: false) |
| `order` | String | Nein | `"preserved"` (sequentiell) oder `"random"` (parallel) |
| `submitters` | Array | Ja | Liste der Unterzeichner |
| `completed_redirect_url` | String | Nein | Redirect-URL nach Abschluss |
| `bcc_completed` | String | Nein | BCC-Email fuer signierte Dokumente |
| `reply_to` | String | Nein | Reply-To Adresse |
| `expire_at` | String | Nein | Ablaufdatum (z.B. "2024-09-01 12:00:00 UTC") |
| `message` | Object | Nein | Eigener Email-Betreff/Body |

**Submitter-Objekt:**

| Feld | Typ | Beschreibung |
|---|---|---|
| `email` | String | Email-Adresse des Unterzeichners |
| `role` | String | Rolle im Template (z.B. "First Party", "Second Party") |
| `name` | String | Vollstaendiger Name |
| `phone` | String | Telefonnummer (E.164 Format) |
| `values` | Object | Vorausgefuellte Feldwerte (`{ "FeldName": "Wert" }`) |
| `external_id` | String | Externe ID aus eigener App |
| `completed` | Boolean | `true` = automatisch signiert (ohne Interaktion) |
| `send_email` | Boolean | Email pro Submitter steuern |
| `send_sms` | Boolean | SMS pro Submitter steuern |
| `order` | Integer | Reihenfolge |

**Beispiel-Request:**
```json
{
  "template_id": 431151,
  "send_email": true,
  "submitters": [
    {
      "role": "First Party",
      "email": "kunde@example.com"
    }
  ]
}
```

**Response:** Array von Submitter-Objekten
```json
[
  {
    "id": 1,
    "submission_id": 1,
    "uuid": "884d545b-3396-49f1-8c07-05b8b2a78755",
    "email": "kunde@example.com",
    "slug": "pAMimKcyrLjqVt",
    "sent_at": "2023-12-13T23:04:04.252Z",
    "status": "sent",
    "role": "First Party",
    "embed_src": "https://docuseal.com/s/pAMimKcyrLjqVt"
  }
]
```

---

### GET /submissions/{id} — Submission abrufen

**Response-Felder:**

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | Integer | Submission-ID |
| `status` | String | `pending`, `completed`, `declined`, `expired` |
| `slug` | String | URL-Slug |
| `audit_log_url` | String | Audit-Trail PDF |
| `combined_document_url` | String | Zusammengefuehrtes PDF |
| `completed_at` | String | Abschluss-Zeitstempel |
| `created_at` | String | Erstellungs-Zeitstempel |
| `submitters` | Array | Submitter mit Dokumenten |
| `template` | Object | Template-Info (`id`, `name`) |

**Submitter in Response:**

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | Integer | Submitter-ID |
| `email` | String | Email |
| `role` | String | Rolle |
| `status` | String | Status |
| `documents` | Array | `[{ "name": "...", "url": "https://..." }]` |
| `values` | Array | `[{ "field": "FeldName", "value": "Wert" }]` |

---

## Webhooks

### Konfiguration
- DocuSeal Console → Webhooks → "New Webhook"
- URL eingeben + Event-Typen auswaehlen
- Optional: Secret Key-Value-Pair fuer Auth-Header

### Verfuegbare Events

| Event | Beschreibung |
|---|---|
| `form.completed` | Unterzeichner hat Formular abgeschlossen |
| `form.viewed` | Unterzeichner hat Formular geoeffnet |
| `form.started` | Unterzeichner hat mit Ausfuellen begonnen |
| `submission.completed` | Alle Unterzeichner haben abgeschlossen |
| `submission.archived` | Submission archiviert |
| `template.created` | Neues Template erstellt |
| `template.updated` | Template aktualisiert |

### Webhook Payload (form.completed / form.viewed)

```json
{
  "event_type": "form.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": 12345,
    "submission_id": 67890,
    "email": "kunde@example.com",
    "phone": null,
    "name": "Max Mustermann",
    "status": "completed",
    "role": "Second Party",
    "external_id": null,
    "completed_at": "2024-01-15T10:30:00Z",
    "opened_at": "2024-01-15T10:25:00Z",
    "sent_at": "2024-01-15T09:00:00Z",
    "values": [
      { "field": "KundenName", "value": "Max Mustermann" }
    ],
    "documents": [
      {
        "name": "Vertrag",
        "url": "https://docuseal.eu/file/hash/vertrag.pdf"
      }
    ],
    "submission": {
      "id": 67890,
      "slug": "abc123",
      "status": "completed",
      "submitters": [
        {
          "id": 1,
          "email": "closer@localweb.de",
          "role": "First Party",
          "status": "completed"
        },
        {
          "id": 2,
          "email": "kunde@example.com",
          "role": "Second Party",
          "status": "completed"
        }
      ],
      "template": {
        "id": 378486,
        "name": "Firmenprofil Premium"
      }
    }
  }
}
```

**Wichtige Felder fuer Routing:**
- `event_type` — Event-Typ (`form.completed`, `form.viewed`)
- `data.submission.template.id` — Template-ID (fuer Routing nach Template)
- `data.email` — Email des Submitters der das Event ausgeloest hat
- `data.role` — Rolle des Submitters
- `data.documents` — Signierte Dokument-URLs (nur bei `form.completed`)
- `data.submission.submitters` — Alle Submitter der Submission (zum Finden der Second Party)

---

## Verwendung im Projekt

### Templates

| Template | ID | Beschreibung |
|---|---|---|
| Firmenprofil Premium | 378486 | Hauptvertrag Premium |
| Firmenprofil Starter | 377939 | Hauptvertrag Starter |
| Folge-Dokument | 431151 | Wird nach form.completed erstellt |

### Workflows

| WF | Verwendung |
|---|---|
| WF 26 (Angebot Erstellen) | Erstellt initiale DocuSeal Submission |
| WF 30 (DocuSeal Webhook) | Reagiert auf DocuSeal Webhook Events |
