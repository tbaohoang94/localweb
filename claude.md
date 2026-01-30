# Project: n8n Workflow Builder

This project builds, validates, and deploys n8n workflows. All workflow output must be valid n8n-compatible JSON, importable into any n8n instance.

## Workflow Development Process

Follow these steps for every workflow request:

### 1. Clarify
- Understand the goal, trigger, inputs, outputs, and integrations.
- Ask follow-up questions if anything is ambiguous or underspecified.

### 2. Research
- Look up relevant n8n nodes, their parameters, and known limitations.
- Use the n8n MCP server or workflow skills when available.
- Check for existing templates or patterns that fit the use case.

### 3. Design
- Outline the workflow architecture: nodes, connections, branching logic.
- Present the design for approval before writing JSON.

### 4. Build
- Generate the full workflow JSON.
- Place it in `files/workflows/` with a descriptive filename.

### 5. Validate
- Check all node types, expressions, connections, and credential references.
- Verify the JSON structure is importable into n8n.

### 6. Fix
- Proactively catch and fix errors. Do not wait to be told.

### 7. Document
- Add a brief description in the workflow's top-level `notes` field explaining what it does.

## Integration Points

### n8n MCP Server (Active)
Connected via `.mcp.json` in project root. Provides:
- **Documentation tools** — `search_nodes`, `get_node`, `validate_node`, `validate_workflow`, `search_templates`, `get_template`
- **Management tools** — create, read, update, delete, list workflows; trigger and monitor executions; health checks
- Instance: `http://localhost:5678` (local Docker)
- External: `https://n8n.hoba-consulting.com` (Cloudflare Tunnel)

### n8n Skills (Active)
Installed in `~/.claude/skills/`. 7 skills available:
- `n8n-expression-syntax` — `{{ }}` patterns, `$json`, `$node` variables
- `n8n-mcp-tools-expert` — node searching, validation, templates
- `n8n-workflow-patterns` — workflow architecture and node connections
- `n8n-validation-expert` — debugging and fixing validation errors
- `n8n-node-configuration` — node setup and property dependencies
- `n8n-code-javascript` — JavaScript in Code nodes
- `n8n-code-python` — Python in Code nodes (standard library only)

## File & Directory Conventions

- Workflows go in `files/workflows/` as `.json` files.
- Use descriptive filenames (e.g., `rss-to-telegram-summary.json`), not hashed IDs.
- Credentials are referenced by name/type only — never hardcode secrets.
- Existing hashed-name exports are legacy; new workflows use readable names.

## Safety Rules

- Never delete or overwrite existing workflow files without explicit confirmation.
- Never embed real credentials, API keys, or secrets in workflow JSON.
- Never activate or deploy workflows to a live instance without approval.
- Always confirm before making destructive changes (removing nodes, replacing workflows).

## Quality Standards

- Every workflow must have error handling (at minimum: an Error Trigger or try/catch on critical nodes).
- Use `Set` nodes to clean data between stages rather than passing raw payloads through.
- Prefer built-in n8n nodes over HTTP Request when a dedicated node exists.
- Keep workflows modular — split complex automations into sub-workflows when they exceed ~15 nodes.
