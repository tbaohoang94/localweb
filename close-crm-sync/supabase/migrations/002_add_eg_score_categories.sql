-- Kategorie-Scores fuer EG-Transkript-Analyse
ALTER TABLE transcripts
  ADD COLUMN IF NOT EXISTS score_struktur smallint,
  ADD COLUMN IF NOT EXISTS score_discovery smallint,
  ADD COLUMN IF NOT EXISTS score_qualifizierung smallint,
  ADD COLUMN IF NOT EXISTS score_nutzen smallint,
  ADD COLUMN IF NOT EXISTS score_fuehrung smallint,
  ADD COLUMN IF NOT EXISTS score_abschluss smallint,
  ADD COLUMN IF NOT EXISTS score_gesamt numeric(4,2),
  ADD COLUMN IF NOT EXISTS score_details jsonb,
  ADD COLUMN IF NOT EXISTS conversion_einschaetzung text,
  ADD COLUMN IF NOT EXISTS top_fehler jsonb,
  ADD COLUMN IF NOT EXISTS top_verbesserungen jsonb;
