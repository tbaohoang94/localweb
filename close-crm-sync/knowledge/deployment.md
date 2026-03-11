# Deployment — [PROJECT_NAME]

---

## Environments

| Environment | Frontend URL | Supabase Projekt | n8n |
|---|---|---|---|
| Development | localhost:3000 | [dev-projekt] | localhost:5678 |
| Staging | [OFFEN] | [staging-projekt] | [OFFEN] |
| Production | [OFFEN] | [prod-projekt] | [hetzner-url] |

---

## Frontend (Vercel)

**Deploy:** automatisch bei Push auf `main`
**Preview:** automatisch bei Pull Request

```bash
# Manuell deployen
vercel --prod
```

**Environment Variables in Vercel:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] [WEITERE — OFFEN]

---

## n8n (Hetzner)

```bash
# n8n neu starten
cd /opt/n8n
docker-compose restart

# Logs anzeigen
docker-compose logs -f n8n

# Backup Workflows
n8n export:workflow --all --output=backup/
```

---

## Supabase Migrations

```bash
# Migration auf Production anwenden
supabase db push --db-url=[PROD_URL]

# ACHTUNG: Immer zuerst auf Staging testen
supabase db push --db-url=[STAGING_URL]
```

---

## Rollback

| Was | Wie |
|---|---|
| Frontend | Vercel → Deployments → Redeploy vorherige Version |
| n8n Workflow | JSON aus `n8n/workflows/` importieren |
| DB Migration | [OFFEN — Migrations sind additive, kein auto-rollback] |

---

## Monitoring & Alerts

| Was | Tool | Alert bei |
|---|---|---|
| Frontend Errors | Vercel Logs | [OFFEN] |
| n8n Workflow Fehler | Error Logger → Slack | Jeder Fehler |
| DB Performance | Supabase Dashboard | [OFFEN] |

---

## Offene Punkte [OFFEN]

- [ ] Staging Environment aufsetzen
- [ ] Monitoring konfigurieren
