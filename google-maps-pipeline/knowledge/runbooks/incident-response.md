# Incident Response — Google Maps Lead Pipeline

---

## Eskalationspfad

| Stufe | Zeitrahmen | Aktion | Kontakt |
|-------|-----------|--------|---------|
| 1 | Sofort | Automatische Email (WF 07/08) | NOTIFICATION_EMAIL |
| 2 | 30min | Manueller Check via Dashboard /ops | Entwickler |
| 3 | 2h | Eskalation an Projektverantwortlichen | [OFFEN] |

---

## Incident-Ablauf

### 1. Erkennung
- Email-Alert von WF 07 (Error) oder WF 08 (Health Check)
- Daily Digest (WF 09) zeigt Auffaelligkeiten
- Manueller Check im Ops Dashboard (/dashboard/ops)

### 2. Einschaetzung
- **Critical:** Service komplett down → Sofort handeln
- **High:** Wiederkehrende Fehler (5+ in 10min) → Innerhalb 30min
- **Medium:** Einzelfehler → Naechster Arbeitstag
- **Low:** Informativ → Beim naechsten Review

### 3. Diagnose
1. Ops Dashboard pruefen: /dashboard/ops
2. system_logs filtern nach Severity + Source
3. n8n UI: Fehlgeschlagene Executions ansehen
4. Supabase Dashboard: Connection Pool, Slow Queries

### 4. Behebung
- Siehe: [common-issues.md](common-issues.md) fuer bekannte Probleme
- Siehe: [disaster-recovery.md](../disaster-recovery.md) fuer schwere Ausfaelle

### 5. Nachbereitung
- system_logs Eintrag pruefen: Ist der Fehler behoben?
- Pipeline Integrity Check (WF 11) manuell ausloesen
- Falls noetig: Post-Mortem erstellen

---

## Post-Mortem Template

```markdown
## Post-Mortem: [Titel]

**Datum:** YYYY-MM-DD
**Dauer:** HH:MM - HH:MM (X Minuten)
**Severity:** Critical / High / Medium
**Betroffene Systeme:** n8n / Supabase / Frontend / Close

### Zusammenfassung
[1-2 Saetze: Was ist passiert?]

### Timeline
- HH:MM — [Erstes Symptom]
- HH:MM — [Alert ausgeloest]
- HH:MM — [Diagnose begonnen]
- HH:MM — [Fix angewendet]
- HH:MM — [Service wiederhergestellt]

### Root Cause
[Was war die Ursache?]

### Impact
- [X] Pipeline-Items betroffen
- [X] Minuten Ausfallzeit
- Datenverlust: Ja/Nein

### Massnahmen
- [ ] Kurzfristig: [Was wurde sofort getan?]
- [ ] Langfristig: [Was wird geaendert um Wiederholung zu vermeiden?]
```

---

## Kommunikation bei Kunden-Impact

### Template: Kurzinfo an Kunden

```
Betreff: Kurze Unterbrechung — [System]

Hallo [Name],

wir hatten heute eine kurze technische Stoerung bei [System].
Das Problem wurde um [Uhrzeit] behoben.

Impact: [Was war betroffen?]
Datenverlust: Keiner

Bei Fragen stehen wir gerne zur Verfuegung.

Beste Gruesse
[Name]
```
