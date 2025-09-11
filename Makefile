.PHONY: help dev build clean logs shell

help: ## Mostrar comandos disponíveis
	@echo "Comandos disponíveis:"
	@echo "  dev       - Iniciar ambiente de desenvolvimento"
	@echo "  build     - Construir containers"
	@echo "  clean     - Limpar containers e volumes"
	@echo "  logs      - Mostrar logs"
	@echo "  shell     - Acessar shell do container"

dev: ## Iniciar desenvolvimento
	docker-compose up --build

build: ## Construir containers
	docker-compose build

clean: ## Limpar tudo
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

logs: ## Mostrar logs
	docker-compose logs -f

shell-backend: ## Acessar shell do container backend
	docker-compose exec backend sh

shell-frontend: ## Acessar shell do container frontend
	docker-compose exec frontend sh

shell-db: ## Acessar shell do container db
	docker-compose exec postgres psql -U financeiro_user -d financeiro_db