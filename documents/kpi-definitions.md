# Dashboard KPI Definitions

Letzte Aktualisierung: 2026-02-23
Stack: Next.js · Supabase (Postgres) · Close.io
Query-Datei: `crm-frontend/lib/dashboard-queries.ts`

---

## Allgemeine Regeln

- **Datumsfilter**: Jeder View respektiert `{ from, to }` ISO-Datumsstrings.
  - Opportunities: `close_created_at >= from` OR `closed_at >= from`
  - Calls/Meetings: `close_created_at` within [from, to]
  - Custom Activities: `close_created_at` within [from, to]
- **Rep-Filter**: `filters.rep !== "Alle"` → zusätzlicher `user_id`-Filter auf allen Queries.
- **Won-Status**: Erkennung über `status ILIKE '%Won%'` auf der `opportunities` Tabelle.
- **Active Stage**: `isActiveStage(mapStatus(status))` → schließt Won + Lost aus, zählt alle dazwischenliegenden Stages.

---

## View: Controlling

Query-Funktionen: `fetchCloserKPIs`, `fetchRevenueByMonth`, `fetchPipelineStages`, `fetchColdcallerKPIs`, `fetchEgToSgRate`

| KPI | Anzeige | Berechnung | Tabelle |
|-----|---------|------------|---------|
| Umsatz MTD | € | Summe `opportunity.value` aller Won Deals im Zeitraum | `opportunities` |
| Won Deals | Zahl | Anzahl Won Deals im Zeitraum | `opportunities` |
| Pipeline Value | € | Summe `value` aller aktiven Opps (nicht Won/Lost) | `opportunities` |
| Pipeline Coverage | x-fach | Pipeline Value ÷ Umsatz MTD | abgeleitet |
| Win Rate | % | Won ÷ (Won + Lost) × 100 | `opportunities` |
| Ø Deal Size | € | Umsatz MTD ÷ Won Deals | abgeleitet |
| EG→SG Rate | % | EG Activities mit Ergebnis "2 - Folgetermin" ÷ alle EG Activities × 100 | `custom_activities` |
| Offene Opps | Zahl | Anzahl Opps mit `isActiveStage = true` | `opportunities` |

---

## View: Closer

Query-Funktionen: `fetchCloserKPIs`, `fetchDashboardOpportunities`, `fetchEgToSgRate`

### KPI Cards (Gesamt aller Closer)

| KPI | Anzeige | Berechnung | Tabelle |
|-----|---------|------------|---------|
| Won Umsatz (MTD) | € | Summe `value` aller Won Deals im Zeitraum | `opportunities` |
| Won Deals | Zahl | Anzahl Won Deals | `opportunities` |
| Win Rate | % | Won ÷ (Won + Lost) × 100 | `opportunities` |
| Pipeline Coverage | x-fach | Summe(aktive Opps value) ÷ Umsatz MTD | abgeleitet |
| Ø Deal Size | € | Umsatz MTD ÷ Won Deals | abgeleitet |
| Ø Sales Cycle | Tage | Ø Tage von `close_created_at` → `closed_at` bei Won Deals | `opportunities` |
| EG→SG Rate | % | EG Activities mit Ergebnis "2 - Folgetermin" ÷ alle EG Activities × 100 | `custom_activities` |
| Umsatz pro EG | € | Umsatz MTD ÷ Gesamt-EG-Count im Zeitraum | `opportunities` + `custom_activities` |

### Closer-Tabelle (pro Closer)

| Spalte | Berechnung | Tabelle |
|--------|------------|---------|
| EGs | Anzahl EG-Activities im Zeitraum | `custom_activities` |
| → SG | EG-Activities mit Ergebnis = "2 - Folgetermin" | `custom_activities` |
| EG→SG % | → SG ÷ EGs × 100 | abgeleitet |
| Won | Anzahl Won Deals | `opportunities` |
| Win Rate | Won ÷ (Won + Lost) × 100 | abgeleitet |
| Umsatz MTD | Summe `value` Won Deals | `opportunities` |
| Ø Deal Size | Umsatz ÷ Won | abgeleitet |
| Ø Cycle | Ø Tage `close_created_at` → `closed_at` (Won Deals) | `opportunities` |
| Offene Opps | Anzahl aktive Opps | `opportunities` |
| Pipeline Value | Summe `value` aktiver Opps | `opportunities` |
| Provision MTD | `2 × monthly_value + 0.5 × setup_fee` pro Won Deal | `opportunities` + `commission_rules` |

---

## View: Coldcaller

Query-Funktion: `fetchColdcallerKPIs`

| KPI | Anzeige | Berechnung | Tabelle |
|-----|---------|------------|---------|
| Anrufe (Gesamt) | Zahl | Anzahl aller Calls im Zeitraum (Bruttocalls) | `calls` |
| Gesprächszeit | Min | Summe `duration` aller Calls ÷ 60 | `calls` |
| Echte Gespräche | Zahl | Calls mit `disposition = "answered"` (Nettocalls) | `calls` |
| Terminquote | % | Meetings gebucht ÷ Nettocalls × 100 | `calls` + `meetings` |
| Meetings gebucht | Zahl | Anzahl Meetings im Zeitraum | `meetings` |
| Show Rate | % | Meetings stattgefunden ÷ Meetings gebucht × 100 | `meetings` |
| Provision (MTD) | € | Meetings stattgefunden × `fixed_amount` + No Shows × `fixed_amount` (negativ) | `commission_rules` |

**Provision-Formel Coldcaller:**
- Meeting stattgefunden: `fixed_amount` pro Meeting (rule: `event_type = "meeting_completed"`)
- No-Show: negativer `fixed_amount` (rule: `event_type = "no_show"`)
- Stattgefunden-Kriterium: `starts_at <= now()`

---

## View: Coaching

Query-Funktionen: `fetchCoachingCalls`, `fetchWonDeals`, `fetchIndustryBreakdown`

| KPI | Anzeige | Berechnung | Tabelle |
|-----|---------|------------|---------|
| Calls (Zeitraum) | Zahl | Anzahl Calls im Zeitraum (max 20 angezeigt) | `calls` |
| Won Deals | Zahl | Anzahl Won Deals im Zeitraum | `opportunities` |
| Gesamtumsatz | € | Summe `value` Won Deals | `opportunities` |
| Ø Deal Size | € | Gesamtumsatz ÷ Won Deals | abgeleitet |
| Ø Sales Cycle | Tage | Ø Tage `close_created_at` → `closed_at` bei Won Deals | `opportunities` |

---

## View: Provisionen

Query-Funktionen: `fetchProvisionTransactions`, `fetchMonthlyProvision`

| KPI | Anzeige | Berechnung | Tabelle |
|-----|---------|------------|---------|
| Provision MTD | € | Summe aller Provisions-Transaktionen im Zeitraum | abgeleitet |
| Transaktionen | Zahl | Anzahl Provisions-Ereignisse (Won Deals + Meetings) | abgeleitet |
| Ø pro Transaktion | € | Provision MTD ÷ Anzahl Transaktionen | abgeleitet |
| Top Kategorie | Name + € | Kategorie mit höchster Gesamtsumme | abgeleitet |

**Provisions-Typen:**
| Typ | Rolle | Formel |
|-----|-------|--------|
| Umsatzbonus | Closer | `2 × monthly_value + 0.5 × setup_fee` pro Won Deal |
| Meeting Bonus | Caller | `fixed_amount` pro stattgefundenem Meeting |
| No Show | Caller | negativer `fixed_amount` pro No-Show |

---

## View: Opportunities

Query-Funktion: `fetchDashboardOpportunities`

| KPI | Anzeige | Berechnung | Tabelle |
|-----|---------|------------|---------|
| Pipeline Value | € | Summe `value` aller aktiven Opps | `opportunities` |
| Offen | Zahl | Anzahl aktiver Opps | `opportunities` |
| Won | Zahl | Anzahl Won Opps im Zeitraum | `opportunities` |
| Lost | Zahl | Anzahl Lost Opps im Zeitraum | `opportunities` |
| Win Rate | % | Won ÷ (Won + Lost) × 100 | abgeleitet |
| Ø Sales Cycle | Tage | Ø `stageAge` bei Won Opps (Tage seit `close_created_at`) | abgeleitet |

---

## EG→SG Rate – Detaildefinition

**Datenquelle:** `custom_activities`
**Activity Type:** "EG - stattgefunden" (`actitype_0Pow7dFbqAOrFjLsCT068D`)
**Ergebnis-Feld (JSONB-Key):** `custom.cf_Bp0LGE1a2Am7BlHszQNtV7KuTpVYDthbiKOetsFkcUQ`

| Wert | Bedeutung | Zählt als |
|------|-----------|-----------|
| 1 - Kunde | Direkt gewonnen (ohne SG) | — (kein SG) |
| 2 - Folgetermin | SG wurde vereinbart | **converted** |
| 3 - Follow-up | Kein Termin, weiter in Follow-up | — |
| 4 - Verloren | Lost nach EG | — |
| 5 - Unqualifiziert | Unqualified nach EG | — |

```
EG→SG Rate = count(EG Activities mit Ergebnis = "2 - Folgetermin")
             ÷ count(alle EG Activities im Zeitraum)
             × 100
```

**Code:** `fetchEgToSgRate()` in `crm-frontend/lib/dashboard-queries.ts`
**Field Mappings:** `crm-frontend/lib/close-field-mappings.ts`

---

## Provisions-Regeln (commission_rules Tabelle)

| Rolle | Event | Calc-Typ | Formel / Betrag |
|-------|-------|----------|----------------|
| closer | deal_closed | formula | `2 × monthly_value + 0.5 × setup_fee` |
| caller | meeting_completed | fixed | `fixed_amount` € pro abgehaltenes Meeting |
| caller | no_show | fixed | `fixed_amount` € (negativ) pro No-Show |
