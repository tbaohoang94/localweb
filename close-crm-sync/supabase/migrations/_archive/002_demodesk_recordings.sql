-- Demodesk Recordings — Schema-Erweiterung
-- Neue Spalten fuer transcripts-Tabelle: Video-Metadaten + Google Drive Referenz
-- Additiv — bestehende Spalten/Daten werden NICHT veraendert

-- ============================================================
-- 1. Neue Spalten hinzufuegen
-- ============================================================

ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS google_drive_url TEXT;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS google_drive_file_id TEXT;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS customer_url TEXT;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS demodesk_token TEXT;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS demodesk_demo_id TEXT;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS audio_only BOOLEAN DEFAULT false;
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS recording_status TEXT;

-- ============================================================
-- 2. Unique Index fuer Dedup auf demodesk_token
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_transcripts_dedup_demodesk_token
  ON transcripts(demodesk_token)
  WHERE demodesk_token IS NOT NULL AND demodesk_token != '';

-- ============================================================
-- 3. Index fuer Google Drive Abfragen
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_transcripts_google_drive
  ON transcripts(google_drive_file_id)
  WHERE google_drive_file_id IS NOT NULL;

-- ============================================================
-- 4. Kommentar fuer Dokumentation
-- ============================================================

COMMENT ON COLUMN transcripts.recording_url IS 'Demodesk Video-URL (kann temporaer sein)';
COMMENT ON COLUMN transcripts.google_drive_url IS 'Permanente Google Drive URL der Video-Datei';
COMMENT ON COLUMN transcripts.google_drive_file_id IS 'Google Drive File ID fuer API-Zugriff';
COMMENT ON COLUMN transcripts.customer_url IS 'Demodesk Frontend-Link zum Anschauen';
COMMENT ON COLUMN transcripts.demodesk_token IS 'Eindeutiger Recording Token von Demodesk';
COMMENT ON COLUMN transcripts.demodesk_demo_id IS 'Zugehoerige Demo-ID in Demodesk';
COMMENT ON COLUMN transcripts.ai_summary IS 'AI-generierte Zusammenfassung von Demodesk';
COMMENT ON COLUMN transcripts.audio_only IS 'true = nur Audio, kein Video';
COMMENT ON COLUMN transcripts.recording_status IS 'Status der Aufnahme (ready, processing, etc.)';
