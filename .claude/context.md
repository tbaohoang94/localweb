# context.md — Shared Technical Context

This file contains stack-wide standards and patterns.
For project-specific context → see projects/<name>/.context/ and README.md

---

## n8n Workflow Standards

### Node Naming
- Descriptive and unique: `HTTP Request - Fetch Close Leads`
- Prefixed by type for clarity: `IF - Has Email`, `Set - Clean Payload`

### Error Handling
- Use "Continue on Fail" + explicit error branch on HTTP nodes
- Standard output structure: `{ success: boolean, data: any, error?: string }`
- Log errors via dedicated error-logger workflow when available

### HTTP Nodes
- Timeout: 30s default
- Retry: 3x with exponential backoff
- Handle non-200 status codes explicitly (don't assume success)

### Function/Code Nodes
- Business logic lives here, not inside HTTP node expressions
- Always return explicit structure
- Inline comments for anything non-obvious
- See n8n skills for language-specific patterns:
  - JavaScript: documents/n8n/agent/skills/n8n-skills/skills/n8n-code-javascript/SKILL.md
  - Python: documents/n8n/agent/skills/n8n-skills/skills/n8n-code-python/SKILL.md
  - Expressions: documents/n8n/agent/skills/n8n-skills/skills/n8n-expression-syntax/SKILL.md

### Rate Limit Pattern
```
SplitInBatches (batch size = API limit minus 10%)
  → Process batch
  → Wait node (1-2s between batches)
```

### Workflow File Naming
- Location: documents/n8n/projects/<name>/workflows/
- Manifest: _manifest.json tracks dependencies between workflows
- Template for new projects: documents/n8n/projects/_template/

### Workflow Size
- Max ~20 nodes per workflow
- If larger → split into sub-workflows connected via Execute Workflow node
- Max 3 levels of nested Execute Workflow

---

## Supabase Patterns

Shared across crm-frontend and frontend (scraping app).

### Client Setup
- Browser client: lib/supabase-browser.ts
- Server client: lib/supabase-server.ts
- Always use typed client where types are available

### Query Pattern
```ts
const { data, error } = await supabase
  .from('table')
  .select('col1, col2')
  .eq('status', 'active')

if (error) throw new Error(`Failed: ${error.message}`)
```

### Rules
- Always destructure `{ data, error }` — never assume success
- Use `.single()` for single-row queries
- Use RLS policies — never bypass with service_role in client code
- Server-side operations use supabase-server.ts (with cookies for auth)
- Migrations go in: crm-frontend/supabase/migration.sql (CRM) or project-specific knowledge/

---

## Next.js Patterns

Both frontends use App Router.

### Structure
```
app/
  layout.tsx          → Root layout (auth provider, sidebar)
  page.tsx            → Landing/redirect
  login/page.tsx      → Auth
  dashboard/
    layout.tsx        → Dashboard shell (sidebar, nav)
    page.tsx          → Dashboard home
    <feature>/page.tsx
```

### Auth Flow
- Middleware handles auth redirect (middleware.ts in each app)
- Supabase Auth with cookie-based sessions
- Protected routes under /dashboard

### Components
- One file per component in components/
- Feature-grouped subdirectories: components/leads/, components/activities/
- Keep components focused — one responsibility per file

### Styling
- Tailwind CSS only, no CSS modules or styled-components
- Follow existing class patterns in the codebase

---

## API Reference (Quick)

### Close.io
- CRM API for leads, contacts, opportunities
- Auth: API key via env var
- Rate limit: check project constraints.md for specifics
- Docs: https://developer.close.com/

### Apify
- Web scraping actor runs
- Usage pattern: Start actor → Poll for results → Import data
- Local reference: documents/apify-api-run-actor.md
- Auth: API token via env var

### Airtable
- Used as sync target in close-airtable-sync project
- Rate limit: 5 requests/second (free tier)
- Schema: documents/n8n/projects/close-airtable-sync/knowledge/schemas/airtable-schema.json

### Google Maps
- Used in google-maps-lead-pipeline for location/business data
- Supabase schema: documents/n8n/projects/google-maps-lead-pipeline/knowledge/supabase-schema.sql

---

## Docker (n8n)

- Config: documents/n8n/docker/
- Compose: docker-compose.yml (dev), docker-compose.prod.yml (prod)
- Reverse proxy: Caddy (Caddyfile)
- Env template: .env.example
- Never modify runtime data directly — use n8n UI or API

---

## Decision Log Convention

All projects use append-only decision logs at .context/decisions.md

Format:
```
## YYYY-MM-DD — <Title>
Decision: <what was decided>
Reason: <why>
Alternatives: <what was considered>
```

When Claude makes a significant assumption → append to the relevant project's decisions.md