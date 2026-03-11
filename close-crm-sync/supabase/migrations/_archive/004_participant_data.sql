-- Kunden- und Meeting-Daten fuer Close-Lead-Zuordnung
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS participant_email TEXT;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS participant_name TEXT;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS host_name TEXT;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS host_email TEXT;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS meeting_account TEXT;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS meeting_start TIMESTAMPTZ;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS meeting_duration INTEGER;

-- Index fuer Close-Lead-Matching ueber Kunden-E-Mail
CREATE INDEX IF NOT EXISTS idx_transcripts_participant_email
  ON transcripts(participant_email)
  WHERE participant_email IS NOT NULL;
