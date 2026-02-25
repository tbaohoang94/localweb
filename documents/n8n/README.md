# n8n Workflow Builder

Production-grade n8n workflow automation platform. Build, validate, and deploy n8n workflows with structured project management.

## Quick Start

```bash
# 1. Start n8n locally
cd docker
cp .env.example .env  # Fill in real values
docker compose up -d

# 2. Access n8n
open http://localhost:5678

# 3. Import workflows
cd projects/close-airtable-sync/scripts
./import.sh
```

## Structure

```
n8n/
  .claude/          Claude working rules, MCP config, project index
  docker/           Docker Compose, Dockerfiles, Caddyfile
  runtime/          Runtime data (gitignored)
  agent/
    mcp/            MCP server source code
    skills/         Claude skill definitions
  projects/
    _template/      Template for new projects
    close-airtable-sync/   Close.io -> Airtable sync project
```

## Projects

| Project | Status | Description |
|---------|--------|-------------|
| [close-airtable-sync](projects/close-airtable-sync/) | Maintenance | Close.io CRM -> Airtable analytics sync |
| [google-maps-lead-pipeline](projects/google-maps-lead-pipeline/) | Planning | Google Maps scraping -> Close.io leads |

## Infrastructure

- **n8n**: `http://localhost:5678` (Docker) / `https://n8n.hoba-consulting.com` (Tunnel)
- **Database**: PostgreSQL 15
- **Reverse Proxy**: Caddy (production) / Cloudflare Tunnel (dev)
- **MCP Server**: n8n-mcp via npx (see `.claude/mcp-config.json`)
