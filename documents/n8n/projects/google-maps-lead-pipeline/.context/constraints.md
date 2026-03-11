# Constraints

## Technical
- Supabase (PostgreSQL) is the only database
- n8n is the only orchestration layer -- no custom backend code
- Apify Google Maps Scraper actor is the sole data source
- Deduplication is enforced via the Google `place_id` unique constraint

## Operational
- No assumptions about input data beyond what the Apify actor returns
- No interactive user prompts within workflows
