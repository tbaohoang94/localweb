# Supabase Database Schema

Project: `vgdamdwglsqsmkiojtif`
URL: `https://vgdamdwglsqsmkiojtif.supabase.co`

## Tables (11)

### 1. users (Dimension)
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| close_user_id | text | unique, not null |
| email | text | not null |
| first_name | text | |
| last_name | text | |
| role | user_role | enum: caller, setter, closer, admin |
| status | user_status | enum: active, inactive, default 'active' |
| created_at | timestamptz | default now() |
| synced_at | timestamptz | |

### 2. leads (Dimension)
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| close_lead_id | text | unique, not null |
| lead_name | text | not null |
| branche | text | |
| google_maps_url | text | |
| source | text | |
| city | text | |
| status | text | |
| close_created_at | timestamptz | |
| created_at | timestamptz | default now() |
| synced_at | timestamptz | |

### 3. opportunities (Fact)
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| close_opportunity_id | text | unique, not null |
| lead_id | uuid | FK → leads.id |
| user_id | uuid | FK → users.id (Closer) |
| setter_id | uuid | FK → users.id (Setter) |
| status | text | |
| product | text | |
| value | numeric | |
| setup_fee | numeric | |
| monthly_value | numeric | |
| contract_duration | int | Monate |
| confidence | int | 0-100 |
| lost_reason | text | |
| forecast_close_date | date | |
| closed_at | timestamptz | |
| custom_fields | jsonb | Close custom fields |
| close_created_at | timestamptz | |
| created_at | timestamptz | default now() |
| synced_at | timestamptz | |

### 4. calls (Fact)
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| close_call_id | text | unique, not null |
| user_id | uuid | FK → users.id |
| lead_id | uuid | FK → leads.id |
| direction | text | inbound / outbound |
| disposition | text | answered, voicemail, missed, busy |
| duration | int | Sekunden |
| phone_number | text | |
| note | text | |
| recording_url | text | |
| close_created_at | timestamptz | |
| created_at | timestamptz | default now() |
| synced_at | timestamptz | |

### 5. meetings (Fact)
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| close_meeting_id | text | unique, not null |
| user_id | uuid | FK → users.id |
| lead_id | uuid | FK → leads.id |
| title | text | |
| duration | int | Sekunden |
| recording_url | text | |
| note | text | |
| starts_at | timestamptz | |
| ends_at | timestamptz | |
| close_created_at | timestamptz | |
| created_at | timestamptz | default now() |
| synced_at | timestamptz | |

### 6. custom_activity_types (Dimension)
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| close_type_id | text | unique, not null |
| name | text | not null |
| created_at | timestamptz | default now() |
| synced_at | timestamptz | |

### 7. custom_activities (Fact)
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| close_activity_id | text | unique, not null |
| type_id | uuid | FK → custom_activity_types.id |
| user_id | uuid | FK → users.id |
| lead_id | uuid | FK → leads.id |
| note | text | |
| custom_fields | jsonb | Close custom fields |
| close_created_at | timestamptz | |
| created_at | timestamptz | default now() |
| synced_at | timestamptz | |

### 8. transcripts (Fact)
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| source_type | text | not null, 'call', 'meeting', or 'demodesk' |
| source_id | uuid | not null, ID from calls or meetings |
| content | text | Transkript-Volltext |
| call_type | text | 'erstgespraech', 'strategiegespraech', 'coldcalling' |
| summary | text | AI-generated summary |
| url | text | |
| recording_url | text | Demodesk Video-URL (kann temporaer sein) |
| google_drive_url | text | Permanente Google Drive URL |
| google_drive_file_id | text | Google Drive File ID |
| customer_url | text | Demodesk Frontend-Link |
| demodesk_token | text | Recording Token (unique, Dedup-Key) |
| demodesk_demo_id | text | Zugehoerige Demo-ID |
| ai_summary | text | AI-Summary von Demodesk |
| audio_only | boolean | default false, nur-Audio Flag |
| recording_status | text | Status (ready, processing, etc.) |
| created_at | timestamptz | default now() |
| synced_at | timestamptz | |

**Indexes:** Unique auf `demodesk_token` (WHERE NOT NULL), Index auf `google_drive_file_id`
**Migration:** `002_demodesk_recordings.sql`

### 9. sync_runs (System)
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| entity | text | not null |
| status | text | not null: running, success, error |
| records_synced | int | |
| error_message | text | |
| started_at | timestamptz | |
| finished_at | timestamptz | |
| created_at | timestamptz | default now() |

### 10. commission_rules (System)
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| role | user_role | not null |
| event_type | text | not null |
| calc_type | text | not null: fixed, formula |
| fixed_amount | numeric | |
| formula | text | |
| created_at | timestamptz | default now() |

**Provisionsregeln:**
- setter / meeting_completed → +60€
- setter / no_show → -10€
- setter / deal_closed → +200€
- closer / deal_closed → 2 × monthly_value + 0.5 × setup_fee

### 11. custom_fields (Dimension)
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| close_field_id | text | unique, not null |
| name | text | not null |
| entity_type | text | not null, 'lead' or 'opportunity' |
| field_type | text | |
| created_at | timestamptz | default now() |
| synced_at | timestamptz | |

## Enums
- `user_role`: caller, setter, closer, admin
- `user_status`: active, inactive

## Relationships
```
users ←── calls.user_id
users ←── meetings.user_id
users ←── opportunities.user_id (Closer)
users ←── opportunities.setter_id (Setter)
users ←── custom_activities.user_id
leads ←── calls.lead_id
leads ←── meetings.lead_id
leads ←── opportunities.lead_id
leads ←── custom_activities.lead_id
custom_activity_types ←── custom_activities.type_id
calls/meetings ←── transcripts.source_id (via source_type)
```

## Planned (not yet created)
- `calls_daily` — Materialized View for daily call aggregations
- Indexes for frequent queries
- RLS Policies

## n8n Sync Order
1. users (no dependencies)
2. leads (no dependencies)
3. custom_activity_types (no dependencies)
4. custom_fields (no dependencies)
5. opportunities (needs users + leads)
6. calls (needs users + leads)
7. meetings (needs users + leads)
8. custom_activities (needs users + leads + custom_activity_types)
9. transcripts (needs calls + meetings)
