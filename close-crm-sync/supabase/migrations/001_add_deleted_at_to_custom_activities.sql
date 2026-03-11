-- Soft-Delete Spalte fuer custom_activities
-- Wird gesetzt wenn eine Custom Activity in Close geloescht wird (via Webhook)
ALTER TABLE custom_activities
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Partial Index fuer schnelle Dashboard-Queries (WHERE deleted_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_custom_activities_deleted_at
  ON custom_activities (deleted_at)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN custom_activities.deleted_at IS 'Soft-delete timestamp, set when activity is deleted in Close CRM';
