# Architecture Decisions

## ADR-001: Scrape Run Tracking
**Decision**: Each Apify execution is stored as a `scrape_run` linked to a `location`.
**Reason**: Enables auditing which locations were scraped, when, and with what results.

## ADR-002: Upsert via place_id
**Decision**: Businesses are upserted using the Google `place_id` as the unique key.
**Reason**: Prevents duplicates across multiple scrape runs while keeping data current.

## ADR-003: Scrape History Preservation
**Decision**: A linking table `business_scrape_links` connects businesses to the scrape runs that found them.
**Reason**: Preserves full history of when each business was seen without duplicating business records.

## ADR-004: Supabase as Single Source of Truth
**Decision**: Supabase is the only persistent data store. No data lives exclusively in n8n or Apify.
**Reason**: Centralizes querying, reporting, and downstream integrations in one place.
