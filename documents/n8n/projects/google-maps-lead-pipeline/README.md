# Google Maps Lead Pipeline

**Status**: Planning

Scrapes Google Maps business listings using Apify, orchestrated by n8n, and stores deduplicated data in Supabase.

## Architecture

```
Apify (Google Maps Scraper)
  |
  v
n8n (orchestration, mapping, upsert)
  |
  v
Supabase (PostgreSQL -- locations, businesses, scrape runs)
```

## Directory Structure

```
google-maps-lead-pipeline/
  .context/                Goals, constraints, architecture decisions
  knowledge/               Supabase schema, API docs
    supabase-schema.sql    Database table definitions
  workflows/               n8n workflow JSON files
```

## Next Steps

1. Create n8n workflows for scrape orchestration
2. Configure Apify and Supabase credentials in n8n
3. Build data mapping and upsert logic
4. Add error handling and run status tracking
