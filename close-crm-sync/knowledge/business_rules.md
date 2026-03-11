# Business Rules — [PROJECT_NAME]

> Fachliche Regeln die im Code abgebildet sein müssen. Wenn du unsicher bist ob etwas hier steht — hier nachschauen, nicht raten.

---

## Kern-Regeln

### [Bereich 1, z.B. "Leads"]

**Regel 1:** [Beschreibung]
- Bedingung: [Wann gilt die Regel?]
- Aktion: [Was passiert?]
- Ausnahmen: [OFFEN]

**Regel 2:** [OFFEN]

---

## Statusübergänge

### [Entity] Status-Machine

```
[Status A] ──► [Status B] ──► [Status C]
                  │
                  └──► [Status D] (bei Fehler)
```

| Von | Nach | Bedingung | Wer darf das? |
|---|---|---|---|
| [A] | [B] | [Bedingung] | [Rolle/System] |
| [OFFEN] | | | |

---

## Dedup-Regeln

| Entität | Unique Key | Was passiert bei Duplikat? |
|---|---|---|
| [Entity] | [Feld] | [neuerer gewinnt / merge / error] |

---

## Berechnungen

### [Berechnung 1]
```
[Formel oder Pseudocode]
Beispiel: Score = (Anzahl Aktivitäten × 10) + (Opportunity-Wert / 1000)
```

---

## Validierungen

| Feld | Regel | Fehlermeldung |
|---|---|---|
| [email] | muss valides Format haben | "Bitte gültige E-Mail eingeben" |
| [OFFEN] | | |

---

## Offene Punkte [OFFEN]

- [ ] [OFFEN]
