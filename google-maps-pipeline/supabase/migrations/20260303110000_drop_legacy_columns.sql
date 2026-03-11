-- Drop Legacy Columns: Alte Status-Spalten und nie befuellte Apify-Felder entfernen
-- pipeline_stage ist jetzt die einzige Quelle fuer den Status

-- ══════════════════════════════════════════════════════════════════════════════
-- View search_query_stats: auf pipeline_stage umbauen
-- ══════════════════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS search_query_stats;

CREATE VIEW search_query_stats AS
SELECT
  search_string,
  count(*) AS total,
  count(*) FILTER (WHERE pipeline_stage != 'unqualified') AS qualified,
  count(*) FILTER (WHERE pipeline_stage = 'unqualified') AS wrong_category,
  count(*) FILTER (WHERE phone IS NULL AND im_tel IS NULL) AS no_phone,
  count(*) FILTER (WHERE website IS NULL) AS no_website,
  count(*) FILTER (WHERE im_contact_name IS NULL) AS no_contact,
  count(*) FILTER (WHERE pipeline_stage IN ('enriched', 'qualified') AND (im_tel IS NOT NULL OR phone IS NOT NULL)) AS exportable
FROM businesses
GROUP BY search_string
ORDER BY count(*) DESC;

-- ══════════════════════════════════════════════════════════════════════════════
-- locations: scrape_status entfernen (ersetzt durch pipeline_stage)
-- ══════════════════════════════════════════════════════════════════════════════

DROP INDEX IF EXISTS idx_locations_scrape_status;
ALTER TABLE locations DROP COLUMN IF EXISTS scrape_status;

-- ══════════════════════════════════════════════════════════════════════════════
-- businesses: alte Status-Spalten entfernen (ersetzt durch pipeline_stage)
-- ══════════════════════════════════════════════════════════════════════════════

DROP INDEX IF EXISTS idx_businesses_enrichment_status;
DROP INDEX IF EXISTS idx_businesses_qualification_status;
DROP INDEX IF EXISTS idx_businesses_close_export_status;

ALTER TABLE businesses
  DROP COLUMN IF EXISTS enrichment_status,
  DROP COLUMN IF EXISTS qualification_status,
  DROP COLUMN IF EXISTS close_export_status,
  DROP COLUMN IF EXISTS close_exported_at,
  DROP COLUMN IF EXISTS close_lead_id;

-- ══════════════════════════════════════════════════════════════════════════════
-- businesses: nie befuellte Apify-Spalten entfernen
-- (WF 02 Normalize Data extrahiert diese Felder nicht)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE businesses
  DROP COLUMN IF EXISTS price,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS temporarily_closed,
  DROP COLUMN IF EXISTS categories,
  DROP COLUMN IF EXISTS kgmid,
  DROP COLUMN IF EXISTS image_categories,
  DROP COLUMN IF EXISTS additional_info,
  DROP COLUMN IF EXISTS people_also_search,
  DROP COLUMN IF EXISTS places_tags,
  DROP COLUMN IF EXISTS reviews_tags,
  DROP COLUMN IF EXISTS hotel_ads,
  DROP COLUMN IF EXISTS gas_prices,
  DROP COLUMN IF EXISTS google_food_url,
  DROP COLUMN IF EXISTS search_page_url,
  DROP COLUMN IF EXISTS language,
  DROP COLUMN IF EXISTS is_advertisement,
  DROP COLUMN IF EXISTS scraped_at,
  DROP COLUMN IF EXISTS impressum_url,
  DROP COLUMN IF EXISTS impressum_contacts;
