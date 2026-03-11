-- ============================================================
-- BASELINE MIGRATION — Stand: 2026-03-02
-- Generiert aus dem realen Supabase-Schema (Projekt: close.io)
-- Vorherige Migrationen (001-005) waren veraltet → _archive/
-- ============================================================

-- Enums
CREATE TYPE user_role AS ENUM ('caller', 'setter', 'closer', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive');

-- ============================================================
-- 1. users (Close.io CRM-User)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  close_user_id  TEXT UNIQUE NOT NULL,
  email          TEXT NOT NULL,
  first_name     TEXT,
  last_name      TEXT,
  role           user_role,
  status         user_status DEFAULT 'active',
  created_at     TIMESTAMPTZ DEFAULT now(),
  synced_at      TIMESTAMPTZ
);

-- ============================================================
-- 2. leads (Close.io Leads)
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  close_lead_id   TEXT UNIQUE NOT NULL,
  lead_name       TEXT NOT NULL,
  branche         TEXT,
  google_maps_url TEXT,
  source          TEXT,
  city            TEXT,
  status          TEXT,
  close_created_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  synced_at       TIMESTAMPTZ
);

-- ============================================================
-- 3. opportunities (Close.io Opportunities)
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunities (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  close_opportunity_id TEXT UNIQUE NOT NULL,
  lead_id              UUID REFERENCES leads(id),
  user_id              UUID REFERENCES users(id),
  setter_id            UUID REFERENCES users(id),
  status               TEXT,
  product              TEXT,
  value                NUMERIC,
  setup_fee            NUMERIC,
  monthly_value        NUMERIC,
  contract_duration    INTEGER,
  confidence           INTEGER,
  lost_reason          TEXT,
  forecast_close_date  DATE,
  closed_at            TIMESTAMPTZ,
  close_created_at     TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now(),
  synced_at            TIMESTAMPTZ,
  custom_fields        JSONB,
  close_lead_id        TEXT
);

CREATE INDEX idx_opportunities_lead_id ON opportunities(lead_id);
CREATE INDEX idx_opportunities_user_id ON opportunities(user_id);
CREATE INDEX idx_opportunities_setter_id ON opportunities(setter_id);

-- ============================================================
-- 4. calls (Close.io Calls)
-- ============================================================
CREATE TABLE IF NOT EXISTS calls (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  close_call_id    TEXT UNIQUE NOT NULL,
  user_id          UUID REFERENCES users(id),
  lead_id          UUID REFERENCES leads(id),
  direction        TEXT,
  disposition      TEXT,
  duration         INTEGER,
  phone_number     TEXT,
  note             TEXT,
  recording_url    TEXT,
  close_created_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  synced_at        TIMESTAMPTZ,
  close_lead_id    TEXT
);

CREATE INDEX idx_calls_lead_id ON calls(lead_id);
CREATE INDEX idx_calls_user_id ON calls(user_id);

-- ============================================================
-- 5. meetings (Close.io Meetings)
-- ============================================================
CREATE TABLE IF NOT EXISTS meetings (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  close_meeting_id  TEXT UNIQUE NOT NULL,
  user_id           UUID REFERENCES users(id),
  lead_id           UUID REFERENCES leads(id),
  title             TEXT,
  duration          INTEGER,
  recording_url     TEXT,
  note              TEXT,
  starts_at         TIMESTAMPTZ,
  ends_at           TIMESTAMPTZ,
  close_created_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  synced_at         TIMESTAMPTZ,
  close_lead_id     TEXT
);

CREATE INDEX idx_meetings_lead_id ON meetings(lead_id);
CREATE INDEX idx_meetings_user_id ON meetings(user_id);

-- ============================================================
-- 6. custom_activity_types (Close.io Custom Activity Types)
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_activity_types (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  close_type_id  TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now(),
  synced_at      TIMESTAMPTZ
);

-- ============================================================
-- 7. custom_activities (Close.io Custom Activities)
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_activities (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  close_activity_id  TEXT UNIQUE NOT NULL,
  type_id            UUID REFERENCES custom_activity_types(id),
  user_id            UUID REFERENCES users(id),
  lead_id            UUID REFERENCES leads(id),
  note               TEXT,
  custom_fields      JSONB,
  close_created_at   TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT now(),
  synced_at          TIMESTAMPTZ,
  close_lead_id      TEXT
);

CREATE INDEX idx_custom_activities_lead_id ON custom_activities(lead_id);
CREATE INDEX idx_custom_activities_type_id ON custom_activities(type_id);
CREATE INDEX idx_custom_activities_user_id ON custom_activities(user_id);

-- ============================================================
-- 8. transcripts (Close Whisper + Demodesk)
-- ============================================================
CREATE TABLE IF NOT EXISTS transcripts (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type        TEXT NOT NULL,
  source_id          UUID,
  content            TEXT,
  url                TEXT,
  created_at         TIMESTAMPTZ DEFAULT now(),
  synced_at          TIMESTAMPTZ,
  call_type          TEXT,
  summary            TEXT,
  recording_url      TEXT,
  google_drive_url   TEXT,
  google_drive_file_id TEXT,
  customer_url       TEXT,
  demodesk_token     TEXT UNIQUE,
  demodesk_demo_id   TEXT,
  ai_summary         TEXT,
  audio_only         BOOLEAN DEFAULT false,
  recording_status   TEXT,
  participant_email  TEXT,
  participant_name   TEXT,
  host_name          TEXT,
  host_email         TEXT,
  meeting_account    TEXT,
  meeting_start      TIMESTAMPTZ,
  meeting_duration   INTEGER,
  lead_id            UUID REFERENCES leads(id)
);

-- ============================================================
-- 9. commission_rules (Provisionsregeln)
-- ============================================================
CREATE TABLE IF NOT EXISTS commission_rules (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role         user_role NOT NULL,
  event_type   TEXT NOT NULL,
  calc_type    TEXT NOT NULL,
  fixed_amount NUMERIC,
  formula      TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 10. custom_fields (Close.io Custom Field Definitionen)
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_fields (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  close_field_id TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  entity_type    TEXT NOT NULL CHECK (entity_type IN ('lead', 'opportunity', 'activity')),
  field_type     TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  synced_at      TIMESTAMPTZ
);

-- ============================================================
-- 11. sync_runs (Sync-Tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_runs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity          TEXT NOT NULL,
  status          TEXT NOT NULL,
  records_synced  INTEGER,
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  sync_since      TEXT,
  sync_until      TEXT
);

-- ============================================================
-- 12. test_runs (n8n Workflow-Tests)
-- ============================================================
CREATE TABLE IF NOT EXISTS test_runs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id     TEXT NOT NULL,
  workflow_name   TEXT,
  triggered_at    TIMESTAMPTZ DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  status          TEXT NOT NULL CHECK (status IN ('running', 'success', 'error')),
  items_processed INTEGER DEFAULT 0,
  duration_ms     INTEGER,
  assertions      JSONB DEFAULT '[]',
  sample_data     JSONB,
  error_message   TEXT,
  triggered_by    TEXT DEFAULT 'claude-mcp'
);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;

-- Authentifizierte User: nur SELECT
CREATE POLICY "authenticated_read" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON calls FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON custom_activity_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON custom_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON transcripts FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON commission_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON custom_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON sync_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read" ON test_runs FOR SELECT TO authenticated USING (true);

-- Service Role (n8n) umgeht RLS automatisch — keine Write-Policies noetig

-- ============================================================
-- Functions
-- ============================================================
CREATE OR REPLACE FUNCTION get_caller_call_stats(
  p_caller_ids UUID[],
  p_from TEXT,
  p_to TEXT
)
RETURNS TABLE (
  user_id UUID,
  brutto_calls BIGINT,
  netto_calls BIGINT,
  talk_time_min NUMERIC
)
LANGUAGE sql
SET search_path = public
AS $$
  SELECT
    c.user_id,
    COUNT(*) AS brutto_calls,
    COUNT(*) FILTER (WHERE c.duration > 30) AS netto_calls,
    COALESCE(SUM(c.duration) FILTER (WHERE c.duration > 0) / 60.0, 0) AS talk_time_min
  FROM calls c
  WHERE c.user_id = ANY(p_caller_ids)
    AND c.close_created_at >= p_from::timestamptz
    AND c.close_created_at <= p_to::timestamptz
  GROUP BY c.user_id;
$$;
