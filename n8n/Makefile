# Localweb — n8n Makefile

DOCKER_DIR := docker
COMPOSE_BASE := docker compose -f $(DOCKER_DIR)/docker-compose.yml
COMPOSE_LOCAL := $(COMPOSE_BASE) -f $(DOCKER_DIR)/docker-compose.local.yml
COMPOSE_PROD := $(COMPOSE_BASE) -f $(DOCKER_DIR)/docker-compose.prod.yml

# ── Lokale Entwicklung (MacBook — ressourcenschonend) ─────────────────────────
up:
	$(COMPOSE_LOCAL) up -d

up-build:
	$(COMPOSE_LOCAL) up -d --build

down:
	$(COMPOSE_LOCAL) down

down-v:
	$(COMPOSE_LOCAL) down -v

logs:
	$(COMPOSE_LOCAL) logs -f n8n

ps:
	$(COMPOSE_LOCAL) ps

# ── Produktion (Hetzner — Base + Overlay: Redis, Worker, Queue Mode) ─────────
prod-up:
	$(COMPOSE_PROD) up -d

prod-up-build:
	$(COMPOSE_PROD) up -d --build

prod-down:
	$(COMPOSE_PROD) down

prod-down-v:
	$(COMPOSE_PROD) down -v

prod-logs:
	$(COMPOSE_PROD) logs -f n8n

prod-ps:
	$(COMPOSE_PROD) ps

# ── Health Check ──────────────────────────────────────────────────────────────
health:
	@wget -qO- http://localhost:5678/healthz 2>/dev/null && echo " OK" || echo " FAIL"

# ── Aufraeumen ────────────────────────────────────────────────────────────────
clean:
	docker builder prune -f
	docker image prune -f
