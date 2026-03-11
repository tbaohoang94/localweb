# Error Handling — [PROJECT_NAME]

---

## Prinzipien

1. Jeder Fehler wird geloggt — nie still schlucken
2. Fehler haben Kontext (was, wo, wann, Input-Daten)
3. Kritische Fehler lösen sofort eine Benachrichtigung aus
4. Partial Failures: [Abbruch oder Weitermachen? — OFFEN entscheiden]

---

## Fehler-Klassifizierung

| Klasse | Beispiel | Retry? | Benachrichtigung |
|---|---|---|---|
| Transient | API Timeout, 429 Rate Limit | Ja, 3x | Nein (außer nach allen Retries) |
| Business | Duplikat, Validierungsfehler | Nein | Nein (nur loggen) |
| Critical | DB down, Auth-Fehler, Datenkorruption | Nein | Sofort → Slack |

---

## Retry-Strategie

```
Versuch 1: sofort
Versuch 2: nach 30 Sekunden
Versuch 3: nach 5 Minuten
→ danach: Dead Letter / manuelle Intervention
```

---

## n8n Error Logger

Alle Workflows rufen bei Fehler diesen Webhook auf:

```json
{
  "workflow": "{{ $workflow.name }}",
  "node": "{{ $node.name }}",
  "error": "{{ $json.error.message }}",
  "timestamp": "{{ $now }}",
  "input": "{{ $json }}"
}
```

**Webhook URL:** `[OFFEN]`
**Ziel:** Supabase `error_logs` Tabelle + Slack `#alerts` Channel

---

## Frontend Error Handling

```typescript
// Pattern für Server Actions
try {
  // ...
} catch (error) {
  if (error instanceof PostgrestError) {
    // Supabase Fehler
  }
  // Immer loggen, nie rethrow ohne Context
  console.error('[ComponentName]', error)
  return { error: 'Benutzerfreundliche Fehlermeldung' }
}
```

---

## Benachrichtigungen

| Kanal | Wann |
|---|---|
| Slack `#alerts` | Critical Errors |
| E-Mail | [OFFEN] |
| [OFFEN] | |

---

## Offene Punkte [OFFEN]

- [ ] Slack Webhook URL
- [ ] Partial Failure Entscheidung: Abbruch oder Weitermachen?
