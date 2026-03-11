# [API Name] — Integration Doku

> Projektspezifische Doku für die [API Name] Integration.
> Offizielle Docs: [URL]

---

## Auth

**Typ:** [API Key / OAuth / Basic Auth]
**Header:** `Authorization: Bearer [KEY]` / `[anderes Format]`
**Key liegt in:** n8n Credentials unter `[Credential-Name]`

---

## Base URL

```
Production: https://api.[service].com/v1
Sandbox:    https://api-sandbox.[service].com/v1
```

---

## Rate Limits

| Limit | Wert | Unser Handling |
|---|---|---|
| Requests/Minute | [OFFEN] | Sleep Node |
| Requests/Tag | [OFFEN] | - |
| Concurrent | [OFFEN] | - |

---

## Pagination

```json
// Request
GET /[endpoint]?limit=100&skip=0

// Response
{
  "data": [...],
  "total_results": 1500,
  "has_more": true
}
```

**Loop-Pattern in n8n:**
```
Fetch Page → Verarbeiten → has_more? → Fetch nächste Page
```

---

## Endpoints

### [Endpoint 1]

**Zweck:** [Was macht dieser Endpoint?]

```
GET /[path]
```

**Query Parameter:**
| Parameter | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| [param] | string | Ja | [Beschreibung] |

**Response:**
```json
{
  "id": "abc123",
  "[field]": "[value]"
}
```

**Edge Cases:**
- [OFFEN]

---

### [Endpoint 2 — OFFEN]

---

## Webhooks

**Events die wir empfangen:**
| Event | Trigger | Unsere Reaktion |
|---|---|---|
| [event.name] | [Wann?] | [Was tun wir?] |

**Signatur-Validierung:**
```typescript
// [OFFEN: Wie validieren wir die Webhook-Signatur?]
```

---

## Error Codes

| Code | Bedeutung | Unser Handling |
|---|---|---|
| 429 | Rate Limit | Retry nach 60s |
| 401 | Auth Fehler | Alert + Stop |
| 404 | Not Found | Loggen, Weitermachen |
| 500 | Server Error | Retry 3x, dann Alert |

---

## Bekannte Eigenheiten

- [OFFEN: Gotchas, Eigenheiten, undokumentiertes Verhalten]

---

## Offene Punkte [OFFEN]

- [ ] [OFFEN]
