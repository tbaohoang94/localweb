-- Close.io → Supabase Migration
-- Run this in Supabase SQL Editor
-- Tables created in dependency order (parents before children)

-- ============================================================
-- 1. close_users (no FK dependencies)
-- ============================================================
CREATE TABLE IF NOT EXISTS close_users (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  close_id    TEXT UNIQUE NOT NULL,
  name        TEXT,
  vorname     TEXT,
  nachname    TEXT,
  email       TEXT,
  role        TEXT,
  aktiv       BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_close_users_close_id ON close_users(close_id);

-- ============================================================
-- 2. leads (FK → close_users)
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  close_id          TEXT UNIQUE NOT NULL,
  lead_name         TEXT,
  close_url         TEXT,
  branche           TEXT,
  eg_vereinbart_von UUID REFERENCES close_users(id),
  leadscore         NUMERIC,
  setting_score     NUMERIC,
  closing_score     NUMERIC,
  coldcall_score    NUMERIC,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leads_close_id ON leads(close_id);
CREATE INDEX idx_leads_eg_vereinbart ON leads(eg_vereinbart_von);

-- ============================================================
-- 3. custom_activity_types (no FK dependencies)
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_activity_types (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  close_id  TEXT UNIQUE NOT NULL,
  name      TEXT,
  type      TEXT
);

CREATE INDEX idx_custom_activity_types_close_id ON custom_activity_types(close_id);

-- ============================================================
-- 4. custom_activities (FK → leads, close_users, custom_activity_types)
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_activities (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  close_id            TEXT UNIQUE NOT NULL,
  lead_id             UUID REFERENCES leads(id),
  owner_id            UUID REFERENCES close_users(id),
  activity_type_id    UUID REFERENCES custom_activity_types(id),
  date                TIMESTAMPTZ,
  date_created        TIMESTAMPTZ,
  calculation         TEXT,
  ergebnis            TEXT,
  show_up_rate        NUMERIC,
  sg_no_show          NUMERIC,
  custom_fields_json  JSONB,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_custom_activities_close_id ON custom_activities(close_id);
CREATE INDEX idx_custom_activities_owner_id ON custom_activities(owner_id);
CREATE INDEX idx_custom_activities_type_id ON custom_activities(activity_type_id);
CREATE INDEX idx_activities_lead_date ON custom_activities(lead_id, date DESC);

-- ============================================================
-- 5. opportunities (FK → leads, close_users)
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunities (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  close_id      TEXT UNIQUE NOT NULL,
  lead_id       UUID REFERENCES leads(id),
  owner_id      UUID REFERENCES close_users(id),
  value         NUMERIC(12,2),
  status        TEXT,
  confidence    NUMERIC,
  date_created  TIMESTAMPTZ,
  date_won      TIMESTAMPTZ,
  close_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_opp_status CHECK (status IN ('active', 'won', 'lost')),
  CONSTRAINT chk_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE INDEX idx_opportunities_close_id ON opportunities(close_id);
CREATE INDEX idx_opportunities_lead_id ON opportunities(lead_id);
CREATE INDEX idx_opportunities_owner_id ON opportunities(owner_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);

-- ============================================================
-- 6. transcripts (FK → leads, close_users)
-- ============================================================
CREATE TABLE IF NOT EXISTS transcripts (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id               UUID REFERENCES leads(id),
  owner_id              UUID REFERENCES close_users(id),
  transcript            TEXT,
  activity_name         TEXT,
  gespraechsdauer       NUMERIC,
  talk_ratio            TEXT,
  demodesk_meeting_id   TEXT,
  close_call_id         TEXT,
  date                  TIMESTAMPTZ,
  gespraechstyp         TEXT,
  source                TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_transcript_source CHECK (source IN ('close_whisper', 'demodesk'))
);

CREATE INDEX idx_transcripts_lead_id ON transcripts(lead_id);
CREATE INDEX idx_transcripts_owner_id ON transcripts(owner_id);
CREATE INDEX idx_transcripts_source_date ON transcripts(source, date DESC);
CREATE UNIQUE INDEX idx_transcripts_dedup_demodesk
  ON transcripts(demodesk_meeting_id) WHERE demodesk_meeting_id IS NOT NULL AND demodesk_meeting_id != '';
CREATE UNIQUE INDEX idx_transcripts_dedup_close
  ON transcripts(close_call_id) WHERE close_call_id IS NOT NULL;

-- ============================================================
-- 7. sync_dates (no FK dependencies)
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_dates (
  id      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date    DATE NOT NULL UNIQUE,
  status  TEXT DEFAULT 'pending',
  CONSTRAINT chk_sync_status CHECK (status IN ('pending', 'processing', 'completed'))
);

-- ============================================================
-- 8. error_logs (no FK dependencies)
-- ============================================================
CREATE TABLE IF NOT EXISTS error_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name   TEXT,
  node_name       TEXT,
  error_message   TEXT,
  timestamp       TIMESTAMPTZ DEFAULT now(),
  execution_id    TEXT,
  workflow_id     TEXT,
  severity        TEXT DEFAULT 'Error',
  input_data      JSONB
);

CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_workflow ON error_logs(workflow_name);

-- ============================================================
-- Row Level Security (RLS)
-- Allow authenticated users to read all data (read-only app)
-- ============================================================
ALTER TABLE close_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Read-only policies for authenticated users
CREATE POLICY "Authenticated users can read close_users"
  ON close_users FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read leads"
  ON leads FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read custom_activity_types"
  ON custom_activity_types FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read custom_activities"
  ON custom_activities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read opportunities"
  ON opportunities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read transcripts"
  ON transcripts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read sync_dates"
  ON sync_dates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read error_logs"
  ON error_logs FOR SELECT TO authenticated USING (true);

-- Service role (n8n) bypasses RLS automatically, so no write policies needed

-- ============================================================
-- Updated_at trigger (auto-update on row modification)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_close_users
  BEFORE UPDATE ON close_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_leads
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_opportunities
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
