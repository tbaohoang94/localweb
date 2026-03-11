# Datenmodell — Close CRM Sync

> Alle Entitaeten, Felder, Beziehungen und Mapping-Logik.
> Das SQL-Schema liegt in `supabase/migrations/000_baseline.sql`.
> Generierte TypeScript-Types: `frontend/lib/types/database.ts`

---

## Entitaeten-Uebersicht

```
users 1──── n opportunities (user_id)
  │         │
  │         └── n leads (via lead_id)
  │
  ├──── n calls (user_id)
  │       └── n leads (via lead_id)
  │
  ├──── n meetings (user_id)
  │       └── n leads (via lead_id)
  │
  └──── n custom_activities (user_id)
          ├── n leads (via lead_id)
          └── 1 custom_activity_types (via type_id)

leads 1──── n transcripts (lead_id)

commission_rules (standalone — Provisionsregeln)
custom_fields (standalone — Close.io Felddefinitionen)
sync_runs (standalone — Sync-Tracking)
test_runs (standalone — n8n Workflow-Tests)
```

---

## Tabellen

### users
**Zweck:** Close.io CRM-Benutzer (Closer, Caller, Setter, Admin)
**Source of Truth:** Close.io → n8n Sync → Supabase
**Rows:** ~34

| Spalte | Typ | Constraint | Beschreibung |
|---|---|---|---|
| id | uuid | PK | Interne ID |
| close_user_id | text | UNIQUE, NOT NULL | Close.io User-ID |
| email | text | NOT NULL | E-Mail-Adresse |
| first_name | text | | Vorname |
| last_name | text | | Nachname |
| role | user_role (enum) | | caller / setter / closer / admin |
| status | user_status (enum) | DEFAULT 'active' | active / inactive |
| created_at | timestamptz | DEFAULT now() | Erstellungszeitpunkt |
| synced_at | timestamptz | | Letzter Sync |

---

### leads
**Zweck:** Close.io Leads (Kontakte/Firmen)
**Source of Truth:** Close.io → n8n Sync → Supabase
**Rows:** ~152.000

| Spalte | Typ | Constraint | Beschreibung |
|---|---|---|---|
| id | uuid | PK | Interne ID |
| close_lead_id | text | UNIQUE, NOT NULL | Close.io Lead-ID |
| lead_name | text | NOT NULL | Firmen-/Kontaktname |
| branche | text | | Branche |
| google_maps_url | text | | Google Maps Link |
| source | text | | Herkunftsquelle |
| city | text | | Stadt |
| status | text | | Lead-Status |
| close_created_at | timestamptz | | Erstellungsdatum in Close |
| created_at | timestamptz | DEFAULT now() | |
| synced_at | timestamptz | | Letzter Sync |

---

### opportunities
**Zweck:** Close.io Opportunities (Verkaufschancen)
**Source of Truth:** Close.io → n8n Sync → Supabase
**Rows:** ~1.800

| Spalte | Typ | Constraint | Beschreibung |
|---|---|---|---|
| id | uuid | PK | Interne ID |
| close_opportunity_id | text | UNIQUE, NOT NULL | Close.io Opp-ID |
| lead_id | uuid | FK → leads | Zugehoeriger Lead |
| user_id | uuid | FK → users | Zustaendiger Closer |
| setter_id | uuid | FK → users | Setter der den Termin gelegt hat |
| status | text | | active / Won / Lost / etc. |
| product | text | | Produkttyp |
| value | numeric | | Gesamtwert |
| setup_fee | numeric | | Einrichtungsgebuehr |
| monthly_value | numeric | | Monatlicher Wert |
| contract_duration | integer | | Laufzeit in Monaten |
| confidence | integer | | Wahrscheinlichkeit (0-100) |
| lost_reason | text | | Verlustgrund |
| forecast_close_date | date | | Geplantes Abschlussdatum |
| closed_at | timestamptz | | Tatsaechliches Abschlussdatum |
| close_created_at | timestamptz | | Erstellungsdatum in Close |
| custom_fields | jsonb | | Close Custom Fields |
| close_lead_id | text | | Close Lead-ID (Denormalisiert) |

---

### calls
**Zweck:** Close.io Anrufe
**Source of Truth:** Close.io → n8n Sync → Supabase
**Rows:** ~253.000

| Spalte | Typ | Constraint | Beschreibung |
|---|---|---|---|
| id | uuid | PK | Interne ID |
| close_call_id | text | UNIQUE, NOT NULL | Close.io Call-ID |
| user_id | uuid | FK → users | Anrufer |
| lead_id | uuid | FK → leads | Angerufener Lead |
| direction | text | | inbound / outbound |
| disposition | text | | Ergebnis (answered, no-answer, etc.) |
| duration | integer | | Dauer in Sekunden |
| phone_number | text | | Telefonnummer |
| note | text | | Notizen |
| recording_url | text | | Aufnahme-URL |
| close_created_at | timestamptz | | Anrufzeitpunkt |
| close_lead_id | text | | Close Lead-ID (Denormalisiert) |

---

### meetings
**Zweck:** Close.io Meetings
**Source of Truth:** Close.io → n8n Sync → Supabase
**Rows:** ~6.300

| Spalte | Typ | Constraint | Beschreibung |
|---|---|---|---|
| id | uuid | PK | |
| close_meeting_id | text | UNIQUE, NOT NULL | Close.io Meeting-ID |
| user_id | uuid | FK → users | Meeting-Organisator |
| lead_id | uuid | FK → leads | Zugehoeriger Lead |
| title | text | | Meeting-Titel |
| duration | integer | | Dauer in Minuten |
| starts_at | timestamptz | | Startzeit |
| ends_at | timestamptz | | Endzeit |
| close_created_at | timestamptz | | |

---

### custom_activity_types
**Zweck:** Close.io Custom Activity Type Definitionen
**Rows:** 12

| Spalte | Typ | Constraint | Beschreibung |
|---|---|---|---|
| id | uuid | PK | |
| close_type_id | text | UNIQUE, NOT NULL | Close.io Type-ID (z.B. actitype_xxx) |
| name | text | NOT NULL | Anzeigename |

---

### custom_activities
**Zweck:** Close.io Custom Activities (EG, SG, NoShows, etc.)
**Rows:** ~9.500

| Spalte | Typ | Constraint | Beschreibung |
|---|---|---|---|
| id | uuid | PK | |
| close_activity_id | text | UNIQUE, NOT NULL | Close.io Activity-ID |
| type_id | uuid | FK → custom_activity_types | Typ der Aktivitaet |
| user_id | uuid | FK → users | Zustaendiger Closer/Caller |
| lead_id | uuid | FK → leads | Zugehoeriger Lead |
| note | text | | Notizen |
| custom_fields | jsonb | | Close Custom Fields |
| close_created_at | timestamptz | | |

---

### transcripts
**Zweck:** Gespraeches-Transkripte (Close Whisper + Demodesk)
**Rows:** ~164

| Spalte | Typ | Constraint | Beschreibung |
|---|---|---|---|
| id | uuid | PK | |
| source_type | text | NOT NULL | 'call' / 'meeting' / 'demodesk' |
| source_id | uuid | | FK zur Quell-Tabelle (calls/meetings) |
| content | text | | Transkript-Text |
| lead_id | uuid | FK → leads | Zugehoeriger Lead |
| demodesk_token | text | UNIQUE | Demodesk Recording-Token |
| demodesk_demo_id | text | | Demodesk Demo-ID |
| ai_summary | text | | KI-generierte Zusammenfassung |
| google_drive_url | text | | Permanente Video-URL |

---

### commission_rules
**Zweck:** Provisionsregeln pro Rolle
**Rows:** 4

| Spalte | Typ | Constraint | Beschreibung |
|---|---|---|---|
| id | uuid | PK | |
| role | user_role | NOT NULL | caller / closer |
| event_type | text | NOT NULL | deal_closed / meeting_completed / no_show |
| calc_type | text | NOT NULL | fixed / formula |
| fixed_amount | numeric | | Fester Betrag (bei calc_type=fixed) |
| formula | text | | Formel (bei calc_type=formula) |

---

## Dedup & Identity

| Entitaet | Unique Key | Merge-Strategie |
|---|---|---|
| users | close_user_id | UPSERT — Close gewinnt |
| leads | close_lead_id | UPSERT — Close gewinnt |
| opportunities | close_opportunity_id | UPSERT — Close gewinnt |
| calls | close_call_id | UPSERT — Close gewinnt |
| meetings | close_meeting_id | UPSERT — Close gewinnt |
| custom_activities | close_activity_id | UPSERT — Close gewinnt |
| custom_activity_types | close_type_id | UPSERT — Close gewinnt |
| transcripts (Demodesk) | demodesk_token | UPSERT — Demodesk gewinnt |

**Golden Record Regel:** Close.io ist Source of Truth fuer alle CRM-Daten. Supabase ist Read-Replica.

---

## Offene Punkte

- [ ] `resolve_lead_id` Funktion dokumentieren (matcht Demodesk-Teilnehmer auf Leads)
- [ ] Archivierungsstrategie fuer calls (253k+ Rows, wachsend)
