-- source_id nullable machen fuer Demodesk-Records
-- Demodesk-Records nutzen demodesk_token als Identifier, nicht source_id
ALTER TABLE transcripts ALTER COLUMN source_id DROP NOT NULL;
