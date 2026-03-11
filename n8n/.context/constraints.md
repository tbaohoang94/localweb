# Constraints

## API Limits
- **Close.io**: 100 requests/minute. Must implement rate limiting with Wait nodes.
- **Airtable**: 5 requests/second per base. Batch operations where possible.
- **OpenAI Whisper**: Standard rate limits. Audio files must be < 25 MB.

## Technical Constraints
- **Close.io has no dedicated n8n node** -- all API calls use HTTP Request with header auth
- **Airtable API token lacks `schema.bases:read`** -- schema is manually documented
- **Apify community package** must be installed in Docker image; causes errors if missing
- **Webhook activation** requires n8n editor UI in v2.x; API activation alone is insufficient
- **Code node external modules** restricted to: apify-client, cheerio, puppeteer, puppeteer-core

## Infrastructure
- n8n runs in Docker with PostgreSQL backend
- External access via Cloudflare Tunnel (n8n.hoba-consulting.com)
- Credentials stored in n8n encrypted store, never in workflow JSON
