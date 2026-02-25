# n8n Workflow Builder - Makefile

DOCKER_DIR := docker

# Local development (with Cloudflare Tunnel)
up:
	docker compose -f $(DOCKER_DIR)/docker-compose.yml up -d

down:
	docker compose -f $(DOCKER_DIR)/docker-compose.yml down

down-v:
	docker compose -f $(DOCKER_DIR)/docker-compose.yml down -v

# Production (Caddy + Redis + Worker)
prod-up:
	docker compose -f $(DOCKER_DIR)/docker-compose.yml -f $(DOCKER_DIR)/docker-compose.prod.yml up -d

prod-down:
	docker compose -f $(DOCKER_DIR)/docker-compose.yml -f $(DOCKER_DIR)/docker-compose.prod.yml down

prod-down-v:
	docker compose -f $(DOCKER_DIR)/docker-compose.yml -f $(DOCKER_DIR)/docker-compose.prod.yml down -v

# Logs
logs:
	docker compose -f $(DOCKER_DIR)/docker-compose.yml logs -f n8n

prod-logs:
	docker compose -f $(DOCKER_DIR)/docker-compose.yml -f $(DOCKER_DIR)/docker-compose.prod.yml logs -f n8n

# Health check
health:
	curl -sf http://localhost:5678/healthz && echo " OK" || echo " FAIL"
