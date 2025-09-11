# Prod-Kommandos
prod-up:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d

prod-down:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml down

prod-down-v:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml down -v

# Local-Kommandos (z. B. mit Cloudflare Tunnel)
up-local:
	docker/docker-compose.local.yml up -d

down-local:
	docker/docker-compose.local.yml down

# Logs
logs:
	docker compose -f docker/docker-compose.yml logs -f n8n

prod-logs:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml logs -f n8n

local-logs:
	docker compose -f docker/docker-compose.yml -f docker/docker-compose.local.yml logs -f n8n
