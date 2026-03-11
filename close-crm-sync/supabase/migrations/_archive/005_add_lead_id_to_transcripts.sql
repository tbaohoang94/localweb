-- Migration: lead_id Spalte zur transcripts-Tabelle hinzufuegen
-- War in 001_initial.sql definiert, fehlt aber in der aktuellen Tabelle
-- Wird von WF 23 (23-eg-stattgefunden) benoetigt um Transkripte Leads zuzuordnen

ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id);

CREATE INDEX IF NOT EXISTS idx_transcripts_lead_id ON transcripts(lead_id);

COMMENT ON COLUMN transcripts.lead_id IS 'FK zu leads.id — ordnet Transkript einem Lead zu';
