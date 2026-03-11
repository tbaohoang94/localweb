# Task Runner — External Mode Pflicht (n8n >= 2.0)

## Problem

Seit n8n 2.0 ist der Task Runner **immer aktiv** und kann nicht deaktiviert werden.
Im **Internal Mode** (Default) kommt es zu einer **403-Auth-Race-Condition**:

1. n8n startet den Runner als Child-Process
2. n8n generiert einen Grant Token mit **~15s TTL**
3. Runner versucht sich per WebSocket am Broker (Port 5679) zu authentifizieren
4. Unter Last oder langsamem Startup laeuft der Token ab → **403 Forbidden**
5. Runner retried endlos → **100-300% CPU** → n8n komplett unbenutzbar

### Symptome
- `docker stats` zeigt n8n bei 100-300% CPU
- n8n Health Check schlaegt fehl (`/healthz` gibt 503)
- Autoheal killt n8n → Restart Loop
- API/Webhooks/UI nicht erreichbar
- Logs zeigen `403` Fehler vom Task Runner

### Was NICHT funktioniert (n8n 2.x ignoriert diese Variablen)
- `N8N_RUNNERS_DISABLED=true` — existiert nicht im Source Code
- `N8N_RUNNERS_ENABLED=false` — deprecated, wird ignoriert
- `task-runner-noop.js` (Dummy-Script) — n8n respawnt den Prozess endlos

## Loesung: External Mode

Runner als separaten Container (`n8nio/runners`) mit Shared Auth Token starten.

### docker-compose.yml

```yaml
n8n:
  environment:
    N8N_RUNNERS_MODE: external
    N8N_RUNNERS_AUTH_TOKEN: ${N8N_RUNNERS_AUTH_TOKEN}
    N8N_RUNNERS_BROKER_LISTEN_ADDRESS: "0.0.0.0"

n8n-runner:
  image: n8nio/runners:2.9.4  # Version MUSS mit n8n uebereinstimmen!
  depends_on:
    - n8n
  environment:
    N8N_RUNNERS_AUTH_TOKEN: ${N8N_RUNNERS_AUTH_TOKEN}
    N8N_RUNNERS_TASK_BROKER_URI: http://n8n:5679
    N8N_RUNNERS_MAX_CONCURRENCY: 5
    NODE_OPTIONS: "--max-old-space-size=512"
  command: ["javascript"]
```

### .env

```env
N8N_RUNNERS_MODE=external
N8N_RUNNERS_AUTH_TOKEN=<openssl rand -base64 32>
```

## Vergleich Internal vs External

| Internal Mode (NICHT verwenden) | External Mode (IMMER verwenden) |
|---|---|
| Runner als Child-Process in n8n | Runner als separater Container |
| Grant Token mit ~15s TTL | Shared Auth Token, kein TTL |
| 403-Fehler → Endlos-Retry → CPU-Tod | Stabile WebSocket-Verbindung |
| Kann nicht deaktiviert werden | Sauber trennbar und skalierbar |

## Wichtige Hinweise

- Runner-Image-Version **MUSS** mit n8n-Version uebereinstimmen
- Broker lauscht auf Port 5679 (intern im Docker-Netzwerk)
- `N8N_RUNNERS_BROKER_LISTEN_ADDRESS=0.0.0.0` damit der Runner-Container verbinden kann
- Auth Token in `.env` generieren: `openssl rand -base64 32`
- Bei Upgrade: n8n UND Runner gleichzeitig upgraden

## Execution Data Cleanup

Zusaetzlich Execution Data Pruning aktivieren, da sich sonst hunderte MB pro Tag ansammeln:

```env
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168  # 7 Tage in Stunden
```

## Referenzen
- `skills/n8n/SKILL.md` — Generische Best Practices
- `shared/templates/_client/n8n/docker/` — Template fuer neue Kunden
- GitHub Issues: n8n-io/n8n#12345 (Task Runner CPU), Community Forum Threads
