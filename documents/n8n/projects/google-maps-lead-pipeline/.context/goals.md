# Project Goals

## Primary Goal
Build a repeatable Google Maps business scraping pipeline.

## Objectives
- Use Apify for data collection via the Google Maps Scraper actor
- Use n8n for orchestration of scrape runs, data processing, and storage
- Store data idempotently in Supabase (PostgreSQL)
- Track scrape runs and locations for auditability and replayability

## Architectural Decisions

### API Integration: HTTP Nodes + Environment Variables
**Decision:** Always use HTTP Request nodes with environment variables instead of built-in n8n nodes.

**Rationale:**
- Portability: Workflows work across n8n instances without credential migration
- Centralized config: All API keys in `.env` file
- Stability: Direct API calls are more stable than n8n node updates
- Flexibility: Full control over API requests

**Required Environment Variables:**
```
SUPABASE_GOOGLE_URL=https://xxx.supabase.co
SUPABASE_GOOGLE_KEY=eyJ...
APIFY_API_TOKEN=apify_api_...
OPENAI_API_KEY=sk-...
```

**Usage in n8n:**
```javascript
{{ $env.SUPABASE_GOOGLE_URL }}
{{ $env.SUPABASE_GOOGLE_KEY }}
{{ $env.OPENAI_API_KEY }}
{{ $env.APIFY_API_TOKEN }}
```
